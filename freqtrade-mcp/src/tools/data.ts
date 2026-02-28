/**
 * Data management tools — candles, pairs, whitelist, blacklist, locks
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getFreqtradeClient } from '../freqtrade/client.js';
import { ok, err } from './utils.js';

export function registerDataTools(server: McpServer) {
  server.tool(
    'ft_pair_candles',
    'Get live candlestick (K-line) data for a trading pair',
    {
      pair: z.string().describe('Trading pair, e.g. BTC/USDT'),
      timeframe: z.string().describe('Candle timeframe, e.g. 5m, 1h, 1d'),
      limit: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Max number of candles to return'),
    },
    async ({ pair, timeframe, limit }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.pairCandles(pair, timeframe, limit);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_pair_history',
    'Get historical analyzed data for a pair (with strategy indicators)',
    {
      pair: z.string().describe('Trading pair, e.g. BTC/USDT'),
      timeframe: z.string().describe('Candle timeframe, e.g. 5m, 1h, 1d'),
      strategy: z.string().describe('Strategy name to analyze with'),
      timerange: z
        .string()
        .optional()
        .describe('Time range, e.g. 20240101-20240601'),
    },
    async ({ pair, timeframe, strategy, timerange }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.pairHistory(
          pair,
          timeframe,
          strategy,
          timerange
        );
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_available_pairs',
    'Get available trading pairs with downloaded data',
    {
      timeframe: z
        .string()
        .optional()
        .describe('Filter by timeframe, e.g. 5m, 1h'),
      stake_currency: z
        .string()
        .optional()
        .describe('Filter by stake currency, e.g. USDT'),
    },
    async ({ timeframe, stake_currency }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.availablePairs(timeframe, stake_currency);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_whitelist',
    'Get the current trading whitelist',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.whitelist();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_blacklist',
    'View or add pairs to the blacklist',
    {
      add: z
        .array(z.string())
        .optional()
        .describe('Pairs to add to blacklist, e.g. ["BNB/BTC"]'),
    },
    async ({ add }) => {
      try {
        const client = getFreqtradeClient();
        const result = await client.blacklist(add);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'ft_locks',
    'View current pair trading locks',
    {},
    async () => {
      try {
        const client = getFreqtradeClient();
        const result = await client.locks();
        return ok(result);
      } catch (e) {
        return err(e);
      }
    }
  );
}
