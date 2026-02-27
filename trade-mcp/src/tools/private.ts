/**
 * Private trading tools - require exchange API key in env
 */
import { z } from 'zod';
import * as ccxt from 'ccxt';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getExchange } from '../exchange/manager.js';
import { ok, err } from './utils.js';

const marketTypeSchema = z
  .enum(['spot', 'future', 'swap', 'margin'])
  .optional()
  .describe('Market type, default spot');

export function registerPrivateTools(server: McpServer) {
  // ── get_balance ──
  server.tool(
    'get_balance',
    'Get account balance from exchange',
    {
      exchange: z.string().describe('Exchange ID'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        const bal = await ex.fetchBalance();
        return ok({
          total: bal.total,
          free: bal.free,
          used: bal.used,
        });
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── create_order ──
  server.tool(
    'create_order',
    'Place a new order (market or limit)',
    {
      exchange: z.string().describe('Exchange ID'),
      symbol: z
        .string()
        .describe('Trading pair, e.g. BTC/USDT'),
      type: z.enum(['market', 'limit']).describe('Order type'),
      side: z.enum(['buy', 'sell']).describe('Order side'),
      amount: z.number().positive().describe('Order amount'),
      price: z
        .number()
        .positive()
        .optional()
        .describe('Limit price (required for limit orders)'),
      pos_side: z
        .enum(['long', 'short'])
        .optional()
        .describe('Position side for hedge mode (okx): long/short'),
      margin_mode: z
        .enum(['cross', 'isolated'])
        .optional()
        .describe('Margin mode for derivatives (okx): cross/isolated'),
      market_type: marketTypeSchema,
    },
    async ({
      exchange, symbol, type, side, amount, price, pos_side, margin_mode, market_type,
    }) => {
      try {
        if (type === 'limit' && price == null) {
          return err('price is required for limit orders');
        }
        const ex = getExchange(exchange, market_type);
        const params: Record<string, unknown> = {};
        if (pos_side) params.posSide = pos_side;
        if (margin_mode) params.tdMode = margin_mode;
        const order = await ex.createOrder(
          symbol, type, side, amount, price, params
        );
        return ok(order);
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── cancel_order ──
  server.tool(
    'cancel_order',
    'Cancel an open order',
    {
      exchange: z.string().describe('Exchange ID'),
      order_id: z.string().describe('Order ID to cancel'),
      symbol: z
        .string()
        .describe('Trading pair, e.g. BTC/USDT'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, order_id, symbol, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        return ok(await ex.cancelOrder(order_id, symbol));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── get_open_orders ──
  server.tool(
    'get_open_orders',
    'Get all open (unfilled) orders',
    {
      exchange: z.string().describe('Exchange ID'),
      symbol: z
        .string()
        .optional()
        .describe('Trading pair filter, e.g. BTC/USDT'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, symbol, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        return ok(await ex.fetchOpenOrders(symbol));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── get_closed_orders ──
  server.tool(
    'get_closed_orders',
    'Get closed (filled/cancelled) orders',
    {
      exchange: z.string().describe('Exchange ID'),
      symbol: z
        .string()
        .optional()
        .describe('Trading pair filter'),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe('Number of orders to return'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, symbol, limit, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        return ok(
          await ex.fetchClosedOrders(symbol, undefined, limit)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── get_positions ──
  server.tool(
    'get_positions',
    'Get open positions (futures/swap only)',
    {
      exchange: z.string().describe('Exchange ID'),
      symbols: z
        .array(z.string())
        .optional()
        .describe('Filter by symbols, e.g. ["BTC/USDT:USDT"]'),
      market_type: z
        .enum(['swap', 'future'])
        .optional()
        .default('swap')
        .describe('Market type: swap (default) or future'),
    },
    async ({ exchange, symbols, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        return ok(await ex.fetchPositions(symbols));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── get_order ──
  server.tool(
    'get_order',
    'Get a single order by ID',
    {
      exchange: z.string().describe('Exchange ID'),
      order_id: z.string().describe('Order ID'),
      symbol: z
        .string()
        .describe('Trading pair, e.g. BTC/USDT'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, order_id, symbol, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        return ok(await ex.fetchOrder(order_id, symbol));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── get_my_trades ──
  server.tool(
    'get_my_trades',
    'Get your trade history (filled executions)',
    {
      exchange: z.string().describe('Exchange ID'),
      symbol: z
        .string()
        .optional()
        .describe('Trading pair filter'),
      limit: z
        .number()
        .optional()
        .default(50)
        .describe('Number of trades to return'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, symbol, limit, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        return ok(
          await ex.fetchMyTrades(symbol, undefined, limit)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── cancel_all_orders ──
  server.tool(
    'cancel_all_orders',
    'Cancel all open orders for a symbol',
    {
      exchange: z.string().describe('Exchange ID'),
      symbol: z
        .string()
        .describe('Trading pair, e.g. BTC/USDT'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, symbol, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        if (ex.has['cancelAllOrders']) {
          return ok(await ex.cancelAllOrders(symbol));
        }
        // Fallback: fetch open orders then cancel each in parallel
        const open = await ex.fetchOpenOrders(symbol);
        const results = await Promise.allSettled(
          open.map(o => ex.cancelOrder(o.id, symbol))
        );
        const cancelled = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        return ok({ cancelled, failed, total: open.length });
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── set_leverage ──
  server.tool(
    'set_leverage',
    'Set leverage for a trading pair (futures/swap)',
    {
      exchange: z.string().describe('Exchange ID'),
      leverage: z
        .number()
        .int()
        .positive()
        .describe('Leverage multiplier, e.g. 10'),
      symbol: z
        .string()
        .describe('Trading pair, e.g. BTC/USDT:USDT'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, leverage, symbol, market_type }) => {
      try {
        const ex = getExchange(
          exchange, market_type || 'swap'
        );
        return ok(await ex.setLeverage(leverage, symbol));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── set_margin_mode ──
  server.tool(
    'set_margin_mode',
    'Set margin mode (cross or isolated) for futures/swap',
    {
      exchange: z.string().describe('Exchange ID'),
      margin_mode: z
        .enum(['cross', 'isolated'])
        .describe('Margin mode'),
      symbol: z
        .string()
        .describe('Trading pair, e.g. BTC/USDT:USDT'),
      leverage: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Leverage to set alongside margin mode. If omitted, auto-reads current leverage from the exchange'),
      market_type: z
        .enum(['swap', 'future'])
        .optional()
        .default('swap')
        .describe('Market type: swap (default) or future'),
    },
    async ({ exchange, margin_mode, symbol, leverage, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        let lever = leverage;
        if (lever == null) {
          const info = await ex.fetchLeverage(symbol, { marginMode: margin_mode });
          lever = info?.longLeverage ?? info?.shortLeverage;
        }
        const params: Record<string, unknown> = {};
        if (lever != null) params.lever = String(lever);
        return ok(
          await ex.setMarginMode(margin_mode, symbol, params)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── get_ledger ──
  server.tool(
    'get_ledger',
    'Get account ledger / transaction history',
    {
      exchange: z.string().describe('Exchange ID'),
      code: z
        .string()
        .optional()
        .describe('Currency code filter, e.g. USDT'),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe('Number of entries'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, code, limit, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        return ok(
          await ex.fetchLedger(code, undefined, limit)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── get_deposits ──
  server.tool(
    'get_deposits',
    'Get deposit history',
    {
      exchange: z.string().describe('Exchange ID'),
      code: z
        .string()
        .optional()
        .describe('Currency code filter, e.g. USDT'),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe('Number of records'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, code, limit, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        return ok(
          await ex.fetchDeposits(code, undefined, limit)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── get_withdrawals ──
  server.tool(
    'get_withdrawals',
    'Get withdrawal history',
    {
      exchange: z.string().describe('Exchange ID'),
      code: z
        .string()
        .optional()
        .describe('Currency code filter, e.g. USDT'),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe('Number of records'),
      market_type: marketTypeSchema,
    },
    async ({ exchange, code, limit, market_type }) => {
      try {
        const ex = getExchange(exchange, market_type);
        return ok(
          await ex.fetchWithdrawals(code, undefined, limit)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  // ── transfer ──
  server.tool(
    'transfer',
    'Transfer funds between accounts (e.g. spot to futures)',
    {
      exchange: z.string().describe('Exchange ID'),
      code: z.string().describe('Currency code, e.g. USDT'),
      amount: z.number().positive().describe('Amount'),
      from_account: z
        .string()
        .describe('Source account: spot, swap, future'),
      to_account: z
        .string()
        .describe('Target account: spot, swap, future'),
      market_type: marketTypeSchema,
    },
    async ({
      exchange, code, amount, from_account, to_account, market_type,
    }) => {
      try {
        const ex = getExchange(exchange, market_type);
        return ok(
          await ex.transfer(
            code, amount, from_account, to_account
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );
}
