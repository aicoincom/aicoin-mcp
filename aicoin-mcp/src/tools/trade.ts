/**
 * Trade tools (CCXT-based)
 * #1 exchange_info (2→1): list_exchanges + get_markets(trade)
 * #2 exchange_ticker (2→1): get_ticker + get_tickers
 * #3 exchange_market_data (3→1): get_orderbook + get_trades + get_ohlcv
 * #4 exchange_funding (2→1): get_funding_rates + get_funding_rate_history(trade)
 * #5 account_status (2→1): get_balance + get_positions
 * #6 account_orders (4→1): get_open_orders + get_closed_orders + get_order + get_my_trades
 * #7 account_history (3→1): get_ledger + get_deposits + get_withdrawals
 * #8 create_order (keep independent)
 * #9 cancel_order (2→1): cancel_order + cancel_all_orders
 * #10 set_trading_config (2→1): set_leverage + set_margin_mode
 * #11 transfer (keep independent)
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getExchange, SUPPORTED_EXCHANGES } from '../exchange/manager.js';
import { ok, err, okTradeList } from './utils.js';

const marketTypeSchema = z
  .enum(['spot', 'future', 'swap'])
  .optional()
  .describe('Market type, default spot');

const marketTypePrivateSchema = z
  .enum(['spot', 'future', 'swap', 'margin'])
  .optional()
  .describe('Market type, default spot');

export function registerTradeTools(server: McpServer) {
  // #1 exchange_info
  server.tool(
    'exchange_info',
    'Exchange info via CCXT.\n• exchanges — list all supported exchanges, no params needed\n• markets — trading pairs on exchange. Requires: exchange',
    {
      action: z.enum(['exchanges', 'markets']).describe(
        'exchanges: list all supported exchanges; markets: trading pairs on an exchange'
      ),
      exchange: z.string().optional().describe('REQUIRED for markets. Exchange ID, e.g. binance, okx'),
      market_type: marketTypeSchema.describe('For markets: filter by market type'),
      base: z.string().optional().describe('For markets: filter by base currency, e.g. BTC'),
      quote: z.string().optional().describe('For markets: filter by quote currency, e.g. USDT'),
      limit: z.number().int().min(1).max(500).optional().default(100).describe('For markets: max results (1-500)'),
    },
    async ({ action, exchange, market_type, base, quote, limit }) => {
      try {
        switch (action) {
          case 'exchanges':
            return ok(SUPPORTED_EXCHANGES);
          case 'markets': {
            const ex = getExchange(exchange, market_type, { skipAuth: true });
            await ex.loadMarkets();
            let markets = Object.values(ex.markets).map(m => ({
              symbol: m.symbol,
              base: m.base,
              quote: m.quote,
              type: m.type,
              active: m.active,
            }));
            if (market_type) markets = markets.filter(m => m.type === market_type);
            if (base) markets = markets.filter(m => m.base === base.toUpperCase());
            if (quote) markets = markets.filter(m => m.quote === quote.toUpperCase());
            return okTradeList(markets.slice(0, limit), limit);
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #2 exchange_ticker
  server.tool(
    'exchange_ticker',
    'Exchange ticker via CCXT. Requires: exchange.\n• Single ticker: provide symbol\n• Multiple tickers: provide symbols array or omit for all',
    {
      exchange: z.string().describe('Exchange ID, e.g. binance, okx, bybit'),
      symbol: z.string().optional().describe('Single trading pair, e.g. BTC/USDT'),
      symbols: z.array(z.string()).optional().describe('Multiple pairs, e.g. ["BTC/USDT","ETH/USDT"]'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, symbol, symbols, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type, { skipAuth: true });
        if (symbol) {
          return ok(await ex.fetchTicker(symbol));
        }
        const syms = symbols && symbols.length > 0 ? symbols : undefined;
        const tickers = await ex.fetchTickers(syms);
        return okTradeList(Object.values(tickers));
      } catch (e) {
        return err(e);
      }
    }
  );

  // #3 exchange_market_data
  server.tool(
    'exchange_market_data',
    'Exchange market data via CCXT. Requires: exchange + symbol.\n• orderbook — order book depth\n• trades — recent trades\n• ohlcv — candlestick K-line',
    {
      action: z.enum(['orderbook', 'trades', 'ohlcv']).describe(
        'orderbook: order book depth; trades: recent trades; ohlcv: candlestick K-line'
      ),
      exchange: z.string().describe('Exchange ID'),
      symbol: z.string().describe('Trading pair, e.g. BTC/USDT'),
      market_type: marketTypeSchema,
      limit: z.number().optional().describe('Number of records (orderbook default 20, trades default 50, ohlcv default 100, max 1000)'),
      timeframe: z.string().optional().default('1d').describe('For ohlcv: timeframe 1m,5m,15m,1h,4h,1d,1w'),
    },
    async ({ action, exchange, symbol, market_type, limit, timeframe }) => {
      try {
        const ex = getExchange(exchange, market_type, { skipAuth: true });
        switch (action) {
          case 'orderbook':
            return ok(await ex.fetchOrderBook(symbol, limit ?? 20));
          case 'trades':
            return ok(await ex.fetchTrades(symbol, undefined, limit ?? 50));
          case 'ohlcv':
            return ok(await ex.fetchOHLCV(symbol, timeframe, undefined, Math.min(limit ?? 100, 1000)));
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #4 exchange_funding
  server.tool(
    'exchange_funding',
    'Exchange funding rates via CCXT.\n• current — current funding rates. Requires: exchange + symbols array\n• history — historical rates. Requires: exchange + symbol (single)',
    {
      action: z.enum(['current', 'history']).describe(
        'current: current funding rates; history: historical rates'
      ),
      exchange: z.string().describe('Exchange ID'),
      symbol: z.string().optional().describe('REQUIRED for history. Single pair, e.g. BTC/USDT:USDT'),
      symbols: z.array(z.string()).optional().describe('REQUIRED for current. Pairs array, e.g. ["BTC/USDT:USDT"]'),
      limit: z.number().optional().default(100).describe('For history: number of records'),
    },
    async ({ action, exchange, symbol, symbols, limit }) => {
      try {
        const ex = getExchange(exchange, 'swap', { skipAuth: true });
        switch (action) {
          case 'current': {
            if (!symbols || symbols.length === 0) return err('symbols array is required for current action');
            return ok(await ex.fetchFundingRates(symbols));
          }
          case 'history': {
            if (!symbol) return err('symbol is required for history action');
            return ok(await ex.fetchFundingRateHistory(symbol, undefined, limit));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #5 account_status
  server.tool(
    'account_status',
    'Account status. Requires: exchange.\n• balance — account balance\n• positions — open futures/swap positions',
    {
      action: z.enum(['balance', 'positions']).describe(
        'balance: account balance; positions: open positions (futures/swap)'
      ),
      exchange: z.string().describe('Exchange ID'),
      market_type: marketTypePrivateSchema,
      symbols: z.array(z.string()).optional().describe('For positions: filter by symbols, e.g. ["BTC/USDT:USDT"]'),
    },
    async ({ action, exchange, market_type, symbols }) => {
      try {
        switch (action) {
          case 'balance': {
            const ex = getExchange(exchange, market_type);
            const bal = await ex.fetchBalance();
            // Return only non-zero balances, filter dust tokens for cleaner output
            const summary: Record<string, unknown> = {};
            const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD'];
            for (const [ccy, amt] of Object.entries(bal.total || {})) {
              const total = Number(amt);
              if (total <= 0) continue;
              // Filter dust: stablecoins < $0.01, others < 1e-7
              if (stablecoins.includes(ccy) && total < 0.01) continue;
              if (!stablecoins.includes(ccy) && total < 1e-7) continue;
              summary[ccy] = { free: bal.free?.[ccy], used: bal.used?.[ccy], total: bal.total?.[ccy] };
            }
            // OKX unified account note
            if (exchange?.toLowerCase() === 'okx') {
              summary._note = 'OKX统一账户：现货和合约共用同一余额，无需划转。';
            }
            return ok(summary);
          }
          case 'positions': {
            const ex = getExchange(exchange, market_type || 'swap');
            return ok(await ex.fetchPositions(symbols));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #6 account_orders
  server.tool(
    'account_orders',
    'Order queries. Requires: exchange.\n• open — unfilled orders\n• closed — filled/cancelled orders\n• by_id — single order. Requires: order_id + symbol\n• my_trades — trade/execution history',
    {
      action: z.enum(['open', 'closed', 'by_id', 'my_trades']).describe(
        'open: unfilled orders; closed: filled/cancelled; by_id: single order; my_trades: filled executions'
      ),
      exchange: z.string().describe('Exchange ID'),
      symbol: z.string().optional().describe('Trading pair filter, e.g. BTC/USDT'),
      order_id: z.string().optional().describe('REQUIRED for by_id. Order ID'),
      limit: z.number().optional().describe('Number of records (default 20 for closed, 50 for my_trades)'),
      market_type: marketTypePrivateSchema,
    },
    async ({ action, exchange, symbol, order_id, limit, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        switch (action) {
          case 'open':
            return ok(await ex.fetchOpenOrders(symbol));
          case 'closed':
            return ok(await ex.fetchClosedOrders(symbol, undefined, limit ?? 20));
          case 'by_id': {
            if (!order_id || !symbol) return err('order_id and symbol are required for by_id action');
            return ok(await ex.fetchOrder(order_id, symbol));
          }
          case 'my_trades':
            return ok(await ex.fetchMyTrades(symbol, undefined, limit ?? 50));
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #7 account_history
  server.tool(
    'account_history',
    'Account history. Requires: exchange.\n• ledger — transaction history\n• deposits — deposit history\n• withdrawals — withdrawal history',
    {
      action: z.enum(['ledger', 'deposits', 'withdrawals']).describe(
        'ledger: transaction history; deposits: deposit history; withdrawals: withdrawal history'
      ),
      exchange: z.string().describe('Exchange ID'),
      code: z.string().optional().describe('Currency code filter, e.g. USDT'),
      limit: z.number().optional().default(20).describe('Number of records'),
      market_type: marketTypePrivateSchema,
    },
    async ({ action, exchange, code, limit, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        switch (action) {
          case 'ledger':
            return ok(await ex.fetchLedger(code, undefined, limit));
          case 'deposits':
            return ok(await ex.fetchDeposits(code, undefined, limit));
          case 'withdrawals':
            return ok(await ex.fetchWithdrawals(code, undefined, limit));
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #8 create_order (keep independent for trading safety)
  server.tool(
    'create_order',
    'Place a new order (market or limit). Default returns a PREVIEW (confirmed=false). Set confirmed=true to actually execute. For conditional SL/TP orders, use stop_loss_price or take_profit_price with type=market.',
    {
      exchange: z.string().describe('Exchange ID'),
      symbol: z.string().describe('Trading pair, e.g. BTC/USDT'),
      type: z.enum(['market', 'limit']).describe('Order type'),
      side: z.enum(['buy', 'sell']).describe('Order side'),
      amount: z.number().positive().describe('Order amount'),
      price: z.number().positive().optional().describe('Limit price (required for limit orders)'),
      confirmed: z.boolean().optional().default(false).describe('false (default) = preview only, true = execute order'),
      pos_side: z.enum(['long', 'short']).optional().describe('Position side for hedge mode: long/short'),
      margin_mode: z.enum(['cross', 'isolated']).optional().describe('Margin mode for derivatives: cross/isolated'),
      stop_loss_price: z.number().positive().optional().describe('Stop-loss trigger price (creates conditional market order)'),
      take_profit_price: z.number().positive().optional().describe('Take-profit trigger price (creates conditional market order)'),
      reduce_only: z.boolean().optional().describe('Reduce-only flag for closing positions (SL/TP orders)'),
      market_type: marketTypePrivateSchema,
    },
    async ({ exchange, symbol, type, side, amount, price, confirmed, pos_side, margin_mode, stop_loss_price, take_profit_price, reduce_only, market_type }) => {
      try {
        if (type === 'limit' && price == null) {
          return err('price is required for limit orders');
        }

        // Preview mode: load market data and return order summary without executing
        if (!confirmed) {
          const pub = getExchange(exchange, market_type, { skipAuth: true });
          await pub.loadMarkets();
          const mkt = pub.markets[symbol];
          if (!mkt) return err(`Symbol '${symbol}' not found on ${exchange}`);

          const ticker = await pub.fetchTicker(symbol);
          const currentPrice = ticker.last ?? ticker.close ?? 0;
          const orderPrice = type === 'limit' ? price! : currentPrice;
          const contractSize = mkt.contractSize ?? 1;
          const isDerivative = market_type && market_type !== 'spot';
          const amountInBase = isDerivative ? amount * contractSize : amount;
          const notional = amountInBase * orderPrice;

          const preview: Record<string, unknown> = {
            _preview: true,
            _confirm_hint: 'Set confirmed=true to execute this order',
            exchange,
            symbol,
            type,
            side,
            amount,
            price: orderPrice,
            current_price: currentPrice,
            notional_value: `${notional.toFixed(2)} ${mkt.quote}`,
          };
          if (isDerivative && contractSize !== 1) {
            preview.contract_size = contractSize;
            preview.amount_in_base = `${amountInBase} ${mkt.base}`;
            preview.unit = `${amount} contracts × ${contractSize} ${mkt.base}/contract = ${amountInBase} ${mkt.base}`;
          }
          if (mkt.limits?.amount?.min) preview.min_amount = mkt.limits.amount.min;
          if (stop_loss_price) preview.stop_loss_price = stop_loss_price;
          if (take_profit_price) preview.take_profit_price = take_profit_price;
          if (pos_side) preview.pos_side = pos_side;
          if (reduce_only) preview.reduce_only = true;
          return ok(preview);
        }

        // Execution mode
        const ex = getExchange(exchange, market_type);
        const params: Record<string, unknown> = {};
        const isBinance = exchange?.toLowerCase().startsWith('binance');
        if (pos_side) {
          if (isBinance) {
            params.positionSide = pos_side.toUpperCase();
          } else {
            params.posSide = pos_side;
          }
        }
        if (margin_mode) {
          if (!isBinance) {
            params.tdMode = margin_mode;
          }
        }
        if (stop_loss_price) params.stopLossPrice = stop_loss_price;
        if (take_profit_price) params.takeProfitPrice = take_profit_price;
        if (reduce_only) params.reduceOnly = true;
        const order = await ex.createOrder(symbol, type, side, amount, price, params);
        // For futures/swap, attach contract size context so callers know actual position
        if (market_type && market_type !== 'spot') {
          try {
            await ex.loadMarkets();
            const mkt = ex.markets[symbol];
            if (mkt?.contractSize) {
              (order as Record<string, unknown>)._contractSize = mkt.contractSize;
              (order as Record<string, unknown>)._amountInBase = amount * mkt.contractSize;
              (order as Record<string, unknown>)._unit = `${amount} contracts × ${mkt.contractSize} ${mkt.base}/contract = ${amount * mkt.contractSize} ${mkt.base}`;
            }
          } catch { /* ignore */ }
        }
        return ok(order);
      } catch (e) {
        return err(e);
      }
    }
  );

  // #9 cancel_order
  server.tool(
    'cancel_order',
    'Cancel orders. Set cancel_all=true to cancel all open orders for a symbol.',
    {
      exchange: z.string().describe('Exchange ID'),
      symbol: z.string().describe('Trading pair, e.g. BTC/USDT'),
      order_id: z.string().optional().describe('Order ID to cancel (not needed if cancel_all=true)'),
      cancel_all: z.boolean().optional().default(false).describe('Cancel all open orders for the symbol'),
      market_type: marketTypePrivateSchema,
    },
    async ({ exchange, symbol, order_id, cancel_all, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        if (cancel_all) {
          if (ex.has['cancelAllOrders']) {
            return ok(await ex.cancelAllOrders(symbol));
          }
          const open = await ex.fetchOpenOrders(symbol);
          const results = await Promise.allSettled(
            open.map(o => ex.cancelOrder(o.id, symbol))
          );
          const cancelled = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;
          return ok({ cancelled, failed, total: open.length });
        }
        if (!order_id) return err('order_id is required when cancel_all is false');
        return ok(await ex.cancelOrder(order_id, symbol));
      } catch (e) {
        return err(e);
      }
    }
  );

  // #10 set_trading_config
  server.tool(
    'set_trading_config',
    'Trading configuration. Requires: exchange + symbol.\n• leverage — set leverage multiplier. Requires: leverage\n• margin_mode — set cross/isolated margin. Requires: margin_mode',
    {
      action: z.enum(['leverage', 'margin_mode']).describe(
        'leverage: set leverage multiplier; margin_mode: set cross/isolated margin'
      ),
      exchange: z.string().describe('Exchange ID'),
      symbol: z.string().describe('Trading pair, e.g. BTC/USDT:USDT'),
      leverage: z.number().int().positive().optional().describe('REQUIRED for leverage action. Multiplier, e.g. 10'),
      margin_mode: z.enum(['cross', 'isolated']).optional().describe('REQUIRED for margin_mode action. Cross or isolated'),
      market_type: z.enum(['swap', 'future']).optional().default('swap').describe('Market type'),
    },
    async ({ action, exchange, symbol, leverage, margin_mode, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        switch (action) {
          case 'leverage': {
            if (leverage == null) return err('leverage is required for leverage action');
            return ok(await ex.setLeverage(leverage, symbol));
          }
          case 'margin_mode': {
            if (!margin_mode) return err('margin_mode is required for margin_mode action');
            let lever = leverage;
            if (lever == null) {
              const info = await ex.fetchLeverage(symbol, { marginMode: margin_mode });
              lever = info?.longLeverage ?? info?.shortLeverage;
            }
            const params: Record<string, unknown> = {};
            if (lever != null) params.lever = String(lever);
            return ok(await ex.setMarginMode(margin_mode, symbol, params));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #11 transfer (keep independent for fund safety)
  server.tool(
    'transfer',
    'Transfer funds between accounts (e.g. spot to futures)',
    {
      exchange: z.string().describe('Exchange ID'),
      code: z.string().describe('Currency code, e.g. USDT'),
      amount: z.number().positive().describe('Amount'),
      from_account: z.string().describe('Source account: spot, swap, future'),
      to_account: z.string().describe('Target account: spot, swap, future'),
      market_type: marketTypePrivateSchema,
    },
    async ({ exchange, code, amount, from_account, to_account, market_type }) => {
      try {
        // OKX unified account: no transfer needed
        if (exchange?.toLowerCase() === 'okx') {
          return ok({
            success: false,
            reason: 'OKX_UNIFIED_ACCOUNT',
            message: 'OKX 是统一账户，现货和合约共用同一个余额，不需要划转。直接下单即可。',
          });
        }
        const ex = getExchange(exchange, market_type);
        // Normalize account names for CCXT (lowercase)
        const from = from_account.toLowerCase();
        const to = to_account.toLowerCase();
        return ok(await ex.transfer(code, amount, from, to));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Binance: API key lacks Universal Transfer permission
        if (exchange?.toLowerCase().startsWith('binance') && (msg.includes('-1002') || msg.includes('not authorized'))) {
          return err(`Binance 划转失败: API Key 没有万向划转(Universal Transfer)权限。请在 Binance API 管理后台开启「Permits Universal Transfer / 允许万向划转」权限。原始错误: ${msg}`);
        }
        return err(e);
      }
    }
  );
}
