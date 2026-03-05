/**
 * Automated Trading tool — config management + trade execution with risk management
 * Strategy decisions are made by the AI agent, not this tool.
 * Actions: setup, status, open, close
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { getExchange } from '../exchange/manager.js';
import { ok, err } from './utils.js';
import type { MarketType } from '../exchange/manager.js';

const CONFIG_DIR = resolve(process.env.HOME || '', '.aicoin-mcp');
const CONFIG_PATH = resolve(CONFIG_DIR, 'trade-config.json');

interface TradeConfig {
  exchange: string;
  symbol: string;
  market_type: MarketType;
  capital_pct: number;
  leverage: number;
  stop_loss_pct: number;
  take_profit_pct: number;
}

const DEFAULT_CONFIG: TradeConfig = {
  exchange: 'okx',
  symbol: 'BTC/USDT:USDT',
  market_type: 'swap',
  capital_pct: 0.5,
  leverage: 20,
  stop_loss_pct: 0.025,
  take_profit_pct: 0.05,
};

function loadConfig(): TradeConfig {
  if (existsSync(CONFIG_PATH)) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) };
    } catch { /* fall through */ }
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(cfg: TradeConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export function registerAutoTradeTools(server: McpServer) {
  server.tool(
    'auto_trade',
    'Automated trading with risk management. AI agent decides strategy, this tool executes.\n• setup — save trading config (exchange, symbol, leverage, SL/TP%)\n• status — show config + balance + positions + open orders\n• open — execute trade: calculate position → set leverage → market order → SL/TP. Requires: direction (long/short)\n• close — cancel open orders → close position',
    {
      action: z.enum(['setup', 'status', 'open', 'close']).describe(
        'setup: save config; status: show state; open: execute trade; close: close position'
      ),
      direction: z.enum(['long', 'short']).optional().describe('REQUIRED for open. Trade direction decided by AI agent'),
      exchange: z.string().optional().describe('Exchange ID override'),
      symbol: z.string().optional().describe('Trading pair override, e.g. BTC/USDT:USDT'),
      market_type: z.enum(['spot', 'future', 'swap']).optional().describe('Market type override'),
      capital_pct: z.number().min(0.01).max(1).optional().describe('Capital allocation ratio (0.01-1.0)'),
      leverage: z.number().int().min(1).max(125).optional().describe('Leverage multiplier'),
      stop_loss_pct: z.number().min(0.001).max(0.5).optional().describe('Stop-loss percentage (e.g. 0.025 = 2.5%)'),
      take_profit_pct: z.number().min(0.001).max(1).optional().describe('Take-profit percentage (e.g. 0.05 = 5%)'),
    },
    async ({ action, direction, exchange, symbol, market_type, capital_pct, leverage, stop_loss_pct, take_profit_pct }) => {
      try {
        // Merge overrides into config
        const overrides: Partial<TradeConfig> = {};
        if (exchange !== undefined) overrides.exchange = exchange;
        if (symbol !== undefined) overrides.symbol = symbol;
        if (market_type !== undefined) overrides.market_type = market_type;
        if (capital_pct !== undefined) overrides.capital_pct = capital_pct;
        if (leverage !== undefined) overrides.leverage = leverage;
        if (stop_loss_pct !== undefined) overrides.stop_loss_pct = stop_loss_pct;
        if (take_profit_pct !== undefined) overrides.take_profit_pct = take_profit_pct;
        const cfg = { ...loadConfig(), ...overrides };

        switch (action) {
          case 'setup': {
            saveConfig(cfg);
            return ok({ saved: CONFIG_PATH, config: cfg });
          }

          case 'status': {
            const result: Record<string, unknown> = { config: cfg };
            const ex = getExchange(cfg.exchange, cfg.market_type);
            try {
              const bal = await ex.fetchBalance();
              const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD'];
              const summary: Record<string, unknown> = {};
              for (const [ccy, amt] of Object.entries(bal.total || {})) {
                const total = Number(amt);
                if (total <= 0) continue;
                if (stablecoins.includes(ccy) && total < 0.01) continue;
                if (!stablecoins.includes(ccy) && total < 1e-7) continue;
                summary[ccy] = { free: bal.free?.[ccy], used: bal.used?.[ccy], total: bal.total?.[ccy] };
              }
              result.balance = summary;
            } catch (e) {
              result.balance = { error: e instanceof Error ? e.message : String(e) };
            }
            try {
              result.positions = await ex.fetchPositions([cfg.symbol]);
            } catch (e) {
              result.positions = { error: e instanceof Error ? e.message : String(e) };
            }
            try {
              result.open_orders = await ex.fetchOpenOrders(cfg.symbol);
            } catch (e) {
              result.open_orders = { error: e instanceof Error ? e.message : String(e) };
            }
            return ok(result);
          }

          case 'open': {
            if (!direction || !['long', 'short'].includes(direction)) {
              return err('Missing "direction": must be "long" or "short"');
            }

            const ex = getExchange(cfg.exchange, cfg.market_type);

            // 1. Check balance
            const bal = await ex.fetchBalance();
            const quote = cfg.symbol.split('/')[1]?.split(':')[0] || 'USDT';
            const available = Number(bal.free?.[quote] || 0);
            if (available < 1) return err(`Insufficient ${quote} balance: ${available}`);

            // 2. Get current price
            const ticker = await ex.fetchTicker(cfg.symbol);
            const price = ticker.last ?? ticker.close ?? 0;
            if (!price) return err('Could not fetch current price');

            // 3. Load market info for contract size & precision
            await ex.loadMarkets();
            const mkt = ex.markets[cfg.symbol];
            if (!mkt) return err(`Symbol '${cfg.symbol}' not found on ${cfg.exchange}`);
            const contractSize = mkt.contractSize || 1;
            const amountStep = mkt.precision?.amount || 0.01;
            const amountMin = mkt.limits?.amount?.min || amountStep;

            // 4. Calculate position size
            const capital = available * cfg.capital_pct;
            const positionValue = capital * cfg.leverage;
            const amountInBase = positionValue / price;
            const rawAmount = cfg.market_type !== 'spot' && contractSize
              ? amountInBase / contractSize
              : amountInBase;
            const amount = Math.max(Math.floor(rawAmount / amountStep) * amountStep, amountMin);
            if (amount * contractSize * price < 1) {
              return err(`Position too small: ${amount} contracts ≈ ${(amount * contractSize).toFixed(6)} ${mkt.base}`);
            }

            // 5. Set leverage
            try { await ex.setLeverage(cfg.leverage, cfg.symbol); } catch { /* ignore */ }

            // 6. Place market order
            const side = direction === 'long' ? 'buy' : 'sell';
            const order = await ex.createOrder(cfg.symbol, 'market', side, amount);

            // 7. Place SL/TP conditional orders
            const slPrice = direction === 'long'
              ? price * (1 - cfg.stop_loss_pct)
              : price * (1 + cfg.stop_loss_pct);
            const tpPrice = direction === 'long'
              ? price * (1 + cfg.take_profit_pct)
              : price * (1 - cfg.take_profit_pct);
            const closeSide = direction === 'long' ? 'sell' : 'buy';

            let sl: unknown, tp: unknown;
            try {
              sl = await ex.createOrder(cfg.symbol, 'market', closeSide, amount, undefined, {
                stopLossPrice: Number(slPrice.toPrecision(6)),
                reduceOnly: true,
              });
            } catch (e) {
              sl = { error: e instanceof Error ? e.message : String(e) };
            }
            try {
              tp = await ex.createOrder(cfg.symbol, 'market', closeSide, amount, undefined, {
                takeProfitPrice: Number(tpPrice.toPrecision(6)),
                reduceOnly: true,
              });
            } catch (e) {
              tp = { error: e instanceof Error ? e.message : String(e) };
            }

            return ok({
              direction,
              amount,
              amount_base: `${Number((amount * contractSize).toPrecision(4))} ${mkt.base}`,
              contract_size: contractSize !== 1 ? `1 contract = ${contractSize} ${mkt.base}` : null,
              entry_price: price,
              stop_loss: Number(slPrice.toPrecision(6)),
              take_profit: Number(tpPrice.toPrecision(6)),
              order_id: (order as Record<string, unknown>).id,
              sl_order: (sl as Record<string, unknown>)?.id ?? (sl as Record<string, unknown>)?.error,
              tp_order: (tp as Record<string, unknown>)?.id ?? (tp as Record<string, unknown>)?.error,
              capital_used: capital.toFixed(2),
              position_value: positionValue.toFixed(2),
            });
          }

          case 'close': {
            const ex = getExchange(cfg.exchange, cfg.market_type);

            // Cancel open orders first
            try {
              if (ex.has['cancelAllOrders']) {
                await ex.cancelAllOrders(cfg.symbol);
              } else {
                const open = await ex.fetchOpenOrders(cfg.symbol);
                await Promise.allSettled(open.map(o => ex.cancelOrder(o.id, cfg.symbol)));
              }
            } catch { /* ignore */ }

            // Get position
            const positions = await ex.fetchPositions([cfg.symbol]);
            const pos = positions.find(
              (p: Record<string, unknown>) =>
                p.symbol === cfg.symbol && Math.abs(Number(p.contracts || 0)) > 0
            );
            if (!pos) return ok({ closed: false, reason: 'No open position' });

            const amount = Math.abs(Number(pos.contracts));
            const closeSide = Number(pos.contracts) > 0 ? 'sell' : 'buy';
            const order = await ex.createOrder(cfg.symbol, 'market', closeSide, amount);
            return ok({
              closed: true,
              side: closeSide,
              amount,
              order_id: (order as Record<string, unknown>).id,
            });
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );
}
