/**
 * Trading management tools — balance, status, force enter/exit, etc.
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getFreqtradeClient } from '../freqtrade/client.js';
import { ok, err, okList } from './utils.js';

export function registerTradingTools(server: McpServer) {
  server.tool(
    'ft_balance',
    'Get account balance from Freqtrade',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.balance();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_status',
    'Get status of all open trades',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.status();
        return okList(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_count',
    'Get count of open trades and max allowed',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.count();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_trade',
    'Get details of a specific trade by ID',
    {
      trade_id: z.number().int().positive().describe('Trade ID'),
    },
    async ({ trade_id }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.trade(trade_id);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_trades',
    'Get trade history',
    {
      limit: z.number().int().positive().optional().describe('Max trades to return (max 500)'),
      offset: z.number().int().min(0).optional().describe('Offset for pagination'),
    },
    async ({ limit, offset }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.trades(limit, offset);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_force_enter',
    'Force enter a trade (open a new position)',
    {
      pair: z.string().describe('Trading pair, e.g. BTC/USDT'),
      side: z.enum(['long', 'short']).describe('Trade side: long or short'),
      price: z.number().positive().optional().describe('Entry price (optional, market order if omitted)'),
      order_type: z.enum(['limit', 'market']).optional().describe('Order type'),
      stake_amount: z.number().positive().optional().describe('Stake amount'),
      leverage: z.number().positive().optional().describe('Leverage multiplier'),
      entry_tag: z.string().optional().describe('Entry tag for tracking'),
    },
    async ({ pair, side, price, order_type, stake_amount, leverage, entry_tag }) => {
      try {
        const client = getFreqtradeClient();
        const req: Record<string, unknown> = { pair, side };
        if (price !== undefined) req.price = price;
        if (order_type) req.ordertype = order_type;
        if (stake_amount !== undefined) req.stakeamount = stake_amount;
        if (leverage !== undefined) req.leverage = leverage;
        if (entry_tag) req.entry_tag = entry_tag;
        const result = await client.forceenter(req as never);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_force_exit',
    'Force exit a trade (close a position)',
    {
      trade_id: z.union([z.number(), z.string()]).describe('Trade ID to exit'),
      order_type: z.enum(['limit', 'market']).optional().describe('Order type'),
      amount: z.number().positive().optional().describe('Amount to sell (full sell if omitted)'),
    },
    async ({ trade_id, order_type, amount }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.forceexit({
          tradeid: trade_id as number,
          ordertype: order_type,
          amount,
        });
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_cancel_open_order',
    'Cancel an open order for a trade',
    {
      trade_id: z.number().int().positive().describe('Trade ID'),
    },
    async ({ trade_id }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.cancelOpenOrder(trade_id);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_delete_trade',
    'Delete a trade record from the database (requires manual exchange handling)',
    {
      trade_id: z.number().int().positive().describe('Trade ID to delete'),
    },
    async ({ trade_id }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.deleteTrade(trade_id);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );
}
