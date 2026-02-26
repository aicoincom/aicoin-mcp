/**
 * Coin data tools
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet, apiPost } from '../client/api.js';

function ok(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
  };
}

function err(e: unknown) {
  return {
    content: [
      { type: 'text' as const, text: `Error: ${(e as Error).message}` },
    ],
    isError: true as const,
  };
}

export function registerCoinTools(server: McpServer) {
  server.tool(
    'get_coin_list',
    'Get list of all supported coins with basic info',
    {},
    async () => {
      try {
        return ok(await apiGet('/api/v2/coin'));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_coin_ticker',
    'Get real-time ticker data for coins (price, change, volume)',
    {
      coin_list: z
        .string()
        .describe('Coin keys, comma-separated, e.g. bitcoin,ethereum'),
    },
    async ({ coin_list }) => {
      try {
        return ok(
          await apiGet('/api/v2/coin/ticker', { coin_list })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_coin_config',
    'Get coin profile/description data',
    {
      coin_key: z
        .string()
        .describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin_key }) => {
      try {
        return ok(
          await apiGet('/api/v2/coin/config', { coin_key })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_ai_coin_analysis',
    'Get AI interpretation and prediction for coins',
    {
      coin_keys: z
        .string()
        .describe('Coin keys JSON array, e.g. ["bitcoin","ethereum"]'),
      language: z
        .enum(['CN', 'EN', 'TC'])
        .optional()
        .describe('Language: CN/EN/TC, default CN'),
    },
    async ({ coin_keys, language }) => {
      try {
        const body: Record<string, unknown> = {
          coinKeys: JSON.parse(coin_keys),
        };
        if (language) body.language = language;
        return ok(
          await apiPost('/api/v2/content/ai-coins', body)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_funding_rate_history',
    'Get funding rate history',
    {
      symbol: z
        .string()
        .describe(
          'Trading pair, e.g. btcswapusdt:okcoinfutures'
        ),
      interval: z
        .string()
        .describe(
          'Interval: 1m,3m,5m,15m,30m,1h,4h,6h,8h,12h,1d,1w'
        ),
      limit: z
        .string()
        .optional()
        .describe('Number of records, default 100'),
      start_time: z
        .string()
        .optional()
        .describe('Start time in ms'),
      end_time: z
        .string()
        .optional()
        .describe('End time in ms'),
    },
    async ({ symbol, interval, limit, start_time, end_time }) => {
      try {
        const params: Record<string, string> = {
          symbol,
          interval,
        };
        if (limit) params.limit = limit;
        if (start_time) params.start_time = start_time;
        if (end_time) params.end_time = end_time;
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/funding-rate/history',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_liquidation_map',
    'Get liquidation heatmap data',
    {
      dbkey: z
        .string()
        .describe(
          'Trading pair key, e.g. btcswapusdt:binance'
        ),
      cycle: z
        .string()
        .describe('Cycle: 24h or 7d'),
      leverage: z
        .string()
        .optional()
        .describe(
          'Leverage filter: 10,25,50,100 (empty=all)'
        ),
    },
    async ({ dbkey, cycle, leverage }) => {
      try {
        const params: Record<string, string> = {
          dbkey,
          cycle,
        };
        if (leverage) params.leverage = leverage;
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/liquidation/map',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_weighted_funding_rate_history',
    'Get volume-weighted funding rate history',
    {
      symbol: z
        .string()
        .describe('Symbol, e.g. btcswapusdt'),
      interval: z
        .string()
        .describe('Interval: 1m,3m,5m,15m,30m,1h,4h,6h,8h,12h,1d,1w'),
      limit: z
        .string()
        .optional()
        .describe('Number of records, default 100'),
      start_time: z
        .string()
        .optional()
        .describe('Start time in ms'),
      end_time: z
        .string()
        .optional()
        .describe('End time in ms'),
    },
    async ({ symbol, interval, limit, start_time, end_time }) => {
      try {
        const params: Record<string, string> = {
          symbol,
          interval,
        };
        if (limit) params.limit = limit;
        if (start_time) params.start_time = start_time;
        if (end_time) params.end_time = end_time;
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/funding-rate/vol-weight-history',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_aggregated_stablecoin_oi_history',
    'Get aggregated stablecoin-margined open interest history',
    {
      symbol: z
        .string()
        .describe('Coin symbol, e.g. BTC'),
      interval: z
        .string()
        .describe('Interval: 1m,2m,15m,30m'),
      limit: z
        .string()
        .optional()
        .describe('Number of records, default 100'),
      start_time: z
        .string()
        .optional()
        .describe('Start time in ms'),
      end_time: z
        .string()
        .optional()
        .describe('End time in ms'),
    },
    async ({ symbol, interval, limit, start_time, end_time }) => {
      try {
        const params: Record<string, string> = {
          symbol,
          interval,
        };
        if (limit) params.limit = limit;
        if (start_time) params.start_time = start_time;
        if (end_time) params.end_time = end_time;
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/open-interest/aggregated-stablecoin-history',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_aggregated_coin_margin_oi_history',
    'Get aggregated coin-margined open interest history',
    {
      symbol: z
        .string()
        .describe('Coin symbol, e.g. BTC'),
      interval: z
        .string()
        .describe('Interval: 1m,2m,15m,30m'),
      limit: z
        .string()
        .optional()
        .describe('Number of records, default 100'),
      start_time: z
        .string()
        .optional()
        .describe('Start time in ms'),
      end_time: z
        .string()
        .optional()
        .describe('End time in ms'),
    },
    async ({ symbol, interval, limit, start_time, end_time }) => {
      try {
        const params: Record<string, string> = {
          symbol,
          interval,
        };
        if (limit) params.limit = limit;
        if (start_time) params.start_time = start_time;
        if (end_time) params.end_time = end_time;
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/open-interest/aggregated-coin-margin-history',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_liquidation_history',
    'Get liquidation order history',
    {
      symbol: z
        .string()
        .describe(
          'Trading pair, e.g. btcswapusdt:binance'
        ),
      interval: z
        .string()
        .describe('Interval: 1m,2m,15m,30m'),
      limit: z
        .string()
        .optional()
        .describe('Number of records, default 10'),
      start_time: z
        .string()
        .optional()
        .describe('Start time in ms'),
      end_time: z
        .string()
        .optional()
        .describe('End time in ms'),
    },
    async ({ symbol, interval, limit, start_time, end_time }) => {
      try {
        const params: Record<string, string> = {
          symbol,
          interval,
        };
        if (limit) params.limit = limit;
        if (start_time) params.start_time = start_time;
        if (end_time) params.end_time = end_time;
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/liquidation/history',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_estimated_liquidation_history',
    'Get historical estimated liquidation chart data',
    {
      dbkey: z
        .string()
        .describe(
          'Trading pair key, e.g. btcswapusdt:binance'
        ),
      cycle: z
        .string()
        .describe('Cycle: 24h or 7d'),
      leverage: z
        .string()
        .optional()
        .describe(
          'Leverage filter: 10,25,50,100 (empty=all)'
        ),
      limit: z
        .string()
        .optional()
        .describe('Number of records, default 100'),
      start_time: z
        .string()
        .optional()
        .describe('Start time in ms'),
      end_time: z
        .string()
        .optional()
        .describe('End time in ms'),
    },
    async ({ dbkey, cycle, leverage, limit, start_time, end_time }) => {
      try {
        const params: Record<string, string> = {
          dbkey,
          cycle,
        };
        if (leverage) params.leverage = leverage;
        if (limit) params.limit = limit;
        if (start_time) params.start_time = start_time;
        if (end_time) params.end_time = end_time;
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/estimated-liquidation/history',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_historical_depth',
    'Get historical order book depth data',
    {
      key: z
        .string()
        .describe(
          'Trading pair key, e.g. btcswapusdt:okcoinfutures'
        ),
      limit: z
        .string()
        .optional()
        .describe('Number of records, max 1000'),
      start_time: z
        .string()
        .optional()
        .describe('Start time in ms'),
      end_time: z
        .string()
        .optional()
        .describe('End time in ms'),
    },
    async ({ key, limit, start_time, end_time }) => {
      try {
        const params: Record<string, string> = { key };
        if (limit) params.limit = limit;
        if (start_time) params.start_time = start_time;
        if (end_time) params.end_time = end_time;
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/historical-depth',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_super_depth_history',
    'Get large order depth history',
    {
      key: z
        .string()
        .describe(
          'Trading pair key, e.g. btcswapusdt:okcoinfutures'
        ),
      amount: z
        .string()
        .optional()
        .describe('USD threshold, default 10000'),
      limit: z
        .string()
        .optional()
        .describe('Number of records, max 1000'),
      start_time: z
        .string()
        .optional()
        .describe('Start time in ms'),
      end_time: z
        .string()
        .optional()
        .describe('End time in ms'),
    },
    async ({ key, amount, limit, start_time, end_time }) => {
      try {
        const params: Record<string, string> = { key };
        if (amount) params.amount = amount;
        if (limit) params.limit = limit;
        if (start_time) params.start_time = start_time;
        if (end_time) params.end_time = end_time;
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/super-depth/history',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_trade_data',
    'Get latest trade data for futures',
    {
      dbkey: z
        .string()
        .describe(
          'Trading pair key, e.g. btcswapusdt:okcoinfutures'
        ),
      limit: z
        .string()
        .optional()
        .describe('Number of records, max 1000'),
      start_time: z
        .string()
        .optional()
        .describe('Start time in ms'),
      end_time: z
        .string()
        .optional()
        .describe('End time in ms'),
    },
    async ({ dbkey, limit, start_time, end_time }) => {
      try {
        const params: Record<string, string> = { dbkey };
        if (limit) params.limit = limit;
        if (start_time) params.start_time = start_time;
        if (end_time) params.end_time = end_time;
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/trade-data',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );
}