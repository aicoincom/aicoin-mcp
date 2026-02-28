/**
 * Performance & statistics tools — profit, daily, weekly, monthly, etc.
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getFreqtradeClient } from '../freqtrade/client.js';
import { ok, err, okList } from './utils.js';

export function registerPerformanceTools(server: McpServer) {
  server.tool(
    'ft_profit',
    'Get profit/loss summary for all trades',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.profit();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_performance',
    'Get per-pair trading performance',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.performance();
        return okList(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_daily',
    'Get daily profit report',
    {
      days: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Number of days to show (default: 7)'),
    },
    async ({ days }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.daily(days);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_weekly',
    'Get weekly profit report',
    {
      weeks: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Number of weeks to show'),
    },
    async ({ weeks }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.weekly(weeks);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_monthly',
    'Get monthly profit report',
    {
      months: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Number of months to show'),
    },
    async ({ months }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.monthly(months);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_stats',
    'Get trading statistics (durations, exit reasons)',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.stats();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_entries',
    'Get entry tag performance analysis',
    {
      pair: z.string().optional().describe('Filter by pair, e.g. BTC/USDT'),
    },
    async ({ pair }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.entries(pair);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_exits',
    'Get exit reason performance analysis',
    {
      pair: z.string().optional().describe('Filter by pair, e.g. BTC/USDT'),
    },
    async ({ pair }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.exits(pair);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );
}
