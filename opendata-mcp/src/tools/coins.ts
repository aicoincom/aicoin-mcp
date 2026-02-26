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
    'Get funding rate history for a coin',
    {
      coin: z.string().describe('Coin key, e.g. bitcoin'),
      interval: z
        .string()
        .optional()
        .describe('Interval, e.g. 8h'),
    },
    async ({ coin, interval }) => {
      try {
        const params: Record<string, string> = { coin };
        if (interval) params.interval = interval;
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
    'Get liquidation heatmap data for a coin',
    {
      coin: z.string().describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/liquidation/map',
            { coin }
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
      coin: z.string().describe('Coin key, e.g. bitcoin'),
      interval: z
        .string()
        .optional()
        .describe('Interval, e.g. 8h'),
    },
    async ({ coin, interval }) => {
      try {
        const params: Record<string, string> = { coin };
        if (interval) params.interval = interval;
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
      coin: z.string().describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/open-interest/aggregated-stablecoin-history',
            { coin }
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
      coin: z.string().describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/open-interest/aggregated-coin-margin-history',
            { coin }
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
      coin: z.string().describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/liquidation/history',
            { coin }
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
      coin: z.string().describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/estimated-liquidation/history',
            { coin }
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
      coin: z.string().describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/historical-depth',
            { coin }
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
      coin: z.string().describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/super-depth/history',
            { coin }
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
      coin: z.string().describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/trade-data',
            { coin }
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );
}