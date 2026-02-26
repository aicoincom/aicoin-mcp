/**
 * Private trading tools - require exchange API key in env
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getExchange } from '../exchange/manager.js';

const marketTypeSchema = z
  .enum(['spot', 'future', 'swap', 'margin'])
  .optional()
  .describe('Market type, default spot');

function errResult(e: unknown) {
  return {
    content: [
      { type: 'text' as const, text: `Error: ${(e as Error).message}` },
    ],
    isError: true as const,
  };
}

function ok(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
  };
}

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
        return errResult(e);
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
      market_type: marketTypeSchema,
    },
    async ({
      exchange, symbol, type, side, amount, price, market_type,
    }) => {
      try {
        const ex = getExchange(exchange, market_type);
        const order = await ex.createOrder(
          symbol, type, side, amount, price
        );
        return ok(order);
      } catch (e) {
        return errResult(e);
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
    },
    async ({ exchange, order_id, symbol }) => {
      try {
        const ex = getExchange(exchange);
        return ok(await ex.cancelOrder(order_id, symbol));
      } catch (e) {
        return errResult(e);
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
        return errResult(e);
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
        return errResult(e);
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
    },
    async ({ exchange, symbols }) => {
      try {
        const ex = getExchange(exchange, 'swap');
        return ok(await ex.fetchPositions(symbols));
      } catch (e) {
        return errResult(e);
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
        return errResult(e);
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
        return errResult(e);
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
        return ok(await ex.cancelAllOrders(symbol));
      } catch (e) {
        return errResult(e);
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
        return errResult(e);
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
    },
    async ({ exchange, margin_mode, symbol }) => {
      try {
        const ex = getExchange(exchange, 'swap');
        return ok(
          await ex.setMarginMode(margin_mode, symbol)
        );
      } catch (e) {
        return errResult(e);
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
        return errResult(e);
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
    },
    async ({ exchange, code, limit }) => {
      try {
        const ex = getExchange(exchange);
        return ok(
          await ex.fetchDeposits(code, undefined, limit)
        );
      } catch (e) {
        return errResult(e);
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
    },
    async ({ exchange, code, limit }) => {
      try {
        const ex = getExchange(exchange);
        return ok(
          await ex.fetchWithdrawals(code, undefined, limit)
        );
      } catch (e) {
        return errResult(e);
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
    },
    async ({
      exchange, code, amount, from_account, to_account,
    }) => {
      try {
        const ex = getExchange(exchange);
        return ok(
          await ex.transfer(
            code, amount, from_account, to_account
          )
        );
      } catch (e) {
        return errResult(e);
      }
    }
  );
}
