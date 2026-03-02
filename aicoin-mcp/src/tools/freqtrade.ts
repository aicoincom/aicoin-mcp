/**
 * Freqtrade tools — 11 consolidated tools (#1–#11)
 * ft_ping, ft_control, ft_info, ft_balance, ft_trades,
 * ft_force_enter, ft_force_exit, ft_trade_action,
 * ft_profit, ft_periodic, ft_stats
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getFreqtradeClient } from '../freqtrade/client.js';
import { ok, okTradeList, err } from './utils.js';

export function registerFreqtradeTools(server: McpServer) {
  // #1 ft_ping — health check
  server.tool(
    'ft_ping',
    'Check if Freqtrade bot is online and responsive',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        return ok(await client.ping());
      } catch (e) {
        return err(e);
      }
    }
  );

  // #2 ft_control — start / stop / reload
  server.tool(
    'ft_control',
    'Freqtrade bot control.\n' +
      '- start: start trading\n' +
      '- stop: stop trading\n' +
      '- reload: reload configuration',
    {
      action: z.enum(['start', 'stop', 'reload']).describe('Bot control action'),
    },
    async ({ action }) => {
      try {
        const client = getFreqtradeClient();
        switch (action) {
          case 'start':
            return ok(await client.start());
          case 'stop':
            return ok(await client.stop());
          case 'reload':
            return ok(await client.reloadConfig());
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #3 ft_info — config / version / sysinfo / health / logs
  server.tool(
    'ft_info',
    'Freqtrade read-only info queries.\n' +
      '- config: show current configuration\n' +
      '- version: get Freqtrade version\n' +
      '- sysinfo: CPU & RAM usage\n' +
      '- health: bot health check\n' +
      '- logs: get bot logs (optional limit)',
    {
      action: z
        .enum(['config', 'version', 'sysinfo', 'health', 'logs'])
        .describe('Info query type'),
      limit: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Max log entries (only for action=logs)'),
    },
    async ({ action, limit }) => {
      try {
        const client = getFreqtradeClient();
        switch (action) {
          case 'config':
            return ok(await client.showConfig());
          case 'version':
            return ok(await client.version());
          case 'sysinfo':
            return ok(await client.sysinfo());
          case 'health':
            return ok(await client.health());
          case 'logs':
            return ok(await client.logs(limit));
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #4 ft_balance — account balance
  server.tool(
    'ft_balance',
    'Get Freqtrade account balance. Requires bot running with a strategy',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        return ok(await client.balance());
      } catch (e) {
        return err(e);
      }
    }
  );

  // #5 ft_trades — open / count / by_id / history
  server.tool(
    'ft_trades',
    'Freqtrade trade queries. Requires bot running with a strategy.\n' +
      '- open: list all open trades\n' +
      '- count: open trade count vs max\n' +
      '- by_id: get single trade by ID (requires trade_id)\n' +
      '- history: closed trade history (optional limit/offset)',
    {
      action: z
        .enum(['open', 'count', 'by_id', 'history'])
        .describe('Trade query type'),
      trade_id: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Trade ID (required for by_id)'),
      limit: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Max trades (for history)'),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe('Pagination offset (for history)'),
    },
    async ({ action, trade_id, limit, offset }) => {
      try {
        const client = getFreqtradeClient();
        switch (action) {
          case 'open':
            return okTradeList(await client.status(), 200);
          case 'count':
            return ok(await client.count());
          case 'by_id': {
            if (!trade_id) return err('trade_id is required for by_id action');
            return ok(await client.trade(trade_id));
          }
          case 'history':
            return ok(await client.trades(limit, offset));
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #6 ft_force_enter — manual open position
  server.tool(
    'ft_force_enter',
    'Force enter a trade (open a new position). Requires bot running with a strategy',
    {
      pair: z.string().describe('Trading pair, e.g. BTC/USDT'),
      side: z.enum(['long', 'short']).describe('Trade side'),
      price: z
        .number()
        .positive()
        .optional()
        .describe('Entry price (market order if omitted)'),
      order_type: z
        .enum(['limit', 'market'])
        .optional()
        .describe('Order type'),
      stake_amount: z
        .number()
        .positive()
        .optional()
        .describe('Stake amount'),
      leverage: z
        .number()
        .positive()
        .optional()
        .describe('Leverage multiplier'),
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
        return ok(await client.forceenter(req as never));
      } catch (e) {
        return err(e);
      }
    }
  );

  // #7 ft_force_exit — manual close position
  server.tool(
    'ft_force_exit',
    'Force exit a trade (close a position). Requires bot running with a strategy',
    {
      trade_id: z
        .union([z.number(), z.string()])
        .describe('Trade ID to exit'),
      order_type: z
        .enum(['limit', 'market'])
        .optional()
        .describe('Order type'),
      amount: z
        .number()
        .positive()
        .optional()
        .describe('Amount to sell (full if omitted)'),
    },
    async ({ trade_id, order_type, amount }) => {
      try {
        const client = getFreqtradeClient();
        return ok(
          await client.forceexit({
            tradeid: trade_id as number,
            ordertype: order_type,
            amount,
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  // #8 ft_trade_action — cancel_order / delete
  server.tool(
    'ft_trade_action',
    'Trade management actions. Requires bot running with a strategy.\n' +
      '- cancel_order: cancel an open order for a trade\n' +
      '- delete: delete a trade record from database',
    {
      action: z
        .enum(['cancel_order', 'delete'])
        .describe('Trade action type'),
      trade_id: z
        .number()
        .int()
        .positive()
        .describe('Trade ID'),
    },
    async ({ action, trade_id }) => {
      try {
        const client = getFreqtradeClient();
        switch (action) {
          case 'cancel_order':
            return ok(await client.cancelOpenOrder(trade_id));
          case 'delete':
            return ok(await client.deleteTrade(trade_id));
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #9 ft_profit — summary / per_pair
  server.tool(
    'ft_profit',
    'Profit/loss analysis. Requires bot running with a strategy.\n' +
      '- summary: overall P&L summary\n' +
      '- per_pair: per-pair performance breakdown',
    {
      action: z
        .enum(['summary', 'per_pair'])
        .describe('Profit query type'),
    },
    async ({ action }) => {
      try {
        const client = getFreqtradeClient();
        switch (action) {
          case 'summary':
            return ok(await client.profit());
          case 'per_pair':
            return okTradeList(await client.performance(), 200);
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #10 ft_periodic — daily / weekly / monthly
  server.tool(
    'ft_periodic',
    'Periodic profit reports. Requires bot running with a strategy.\n' +
      '- daily: daily profit report\n' +
      '- weekly: weekly profit report\n' +
      '- monthly: monthly profit report',
    {
      action: z
        .enum(['daily', 'weekly', 'monthly'])
        .describe('Report period'),
      count: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Number of periods to show'),
    },
    async ({ action, count }) => {
      try {
        const client = getFreqtradeClient();
        switch (action) {
          case 'daily':
            return ok(await client.daily(count));
          case 'weekly':
            return ok(await client.weekly(count));
          case 'monthly':
            return ok(await client.monthly(count));
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #11 ft_stats — overview / entries / exits
  server.tool(
    'ft_stats',
    'Trading statistics. Requires bot running with a strategy.\n' +
      '- overview: durations, exit reasons, etc.\n' +
      '- entries: entry tag performance analysis\n' +
      '- exits: exit reason performance analysis',
    {
      action: z
        .enum(['overview', 'entries', 'exits'])
        .describe('Stats query type'),
      pair: z
        .string()
        .optional()
        .describe('Filter by pair (for entries/exits), e.g. BTC/USDT'),
    },
    async ({ action, pair }) => {
      try {
        const client = getFreqtradeClient();
        switch (action) {
          case 'overview':
            return ok(await client.stats());
          case 'entries':
            return ok(await client.entries(pair));
          case 'exits':
            return ok(await client.exits(pair));
        }
      } catch (e) {
        return err(e);
      }
    }
  );
}
