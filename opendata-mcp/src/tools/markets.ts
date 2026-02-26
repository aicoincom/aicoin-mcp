/**
 * Market data tools
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet, apiPost } from '../client/api.js';

function ok(data: unknown) {
  return {
    content: [
      { type: 'text' as const, text: JSON.stringify(data) },
    ],
  };
}

function err(e: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error: ${(e as Error).message}`,
      },
    ],
    isError: true as const,
  };
}

export function registerMarketTools(server: McpServer) {
  server.tool(
    'get_kline_data',
    'Get K-line (candlestick) data for a trading pair',
    {
      trading_pair: z
        .string()
        .describe('Trading pair key'),
      period: z
        .string()
        .optional()
        .describe('Period: 1min,5min,15min,1hour,4hour,1day,1week'),
      limit: z
        .string()
        .optional()
        .describe('Number of candles'),
    },
    async ({ trading_pair, period, limit }) => {
      try {
        const params: Record<string, string> = {
          trading_pair,
        };
        if (period) params.period = period;
        if (limit) params.limit = limit;
        return ok(
          await apiGet(
            '/api/v2/commonKline/dataRecords',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_market_ticker',
    'Get ticker data for a specific exchange platform',
    {
      platform: z
        .string()
        .describe('Exchange platform key, e.g. binance'),
      type: z
        .string()
        .optional()
        .describe('Market type filter'),
    },
    async ({ platform, type }) => {
      try {
        const params: Record<string, string> = { platform };
        if (type) params.type = type;
        return ok(
          await apiGet('/api/v2/market/ticker', params)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_markets',
    'Get list of all supported exchange platforms',
    {},
    async () => {
      try {
        return ok(await apiGet('/api/v2/market'));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_futures_interest',
    'Get futures open interest data',
    {
      coin: z
        .string()
        .describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet('/api/v2/futures/interest', { coin })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_crypto_stock_quotes',
    'Get crypto-related stock quotes (MSTR, COIN, etc.)',
    {
      tickers: z
        .string()
        .optional()
        .describe(
          'Stock tickers, e.g. i:mstr:nasdaq,i:coin:nasdaq'
        ),
    },
    async ({ tickers }) => {
      try {
        const params: Record<string, string> = {};
        if (tickers) params.tickers = tickers;
        return ok(
          await apiGet(
            '/api/upgrade/v2/crypto_stock/quotes',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_index_price',
    'Get index price data',
    {
      index_key: z
        .string()
        .describe('Index key'),
    },
    async ({ index_key }) => {
      try {
        return ok(
          await apiGet('/api/v2/index/indexPrice', {
            index_key,
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_hot_tab_coins',
    'Get trending/hot coins list by category',
    {
      tab: z
        .string()
        .optional()
        .describe('Tab/category filter'),
    },
    async ({ tab }) => {
      try {
        const params: Record<string, string> = {};
        if (tab) params.tab = tab;
        return ok(
          await apiGet(
            '/api/v2/market/hotTabCoins',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_crypto_company_info',
    'Get crypto-related company details by stock symbol',
    {
      symbol: z
        .string()
        .describe('Stock symbol, e.g. mstr, coin'),
    },
    async ({ symbol }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/crypto_stock/company/${symbol}`
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_index_info',
    'Get index detail information',
    {
      index_key: z
        .string()
        .describe('Index key'),
    },
    async ({ index_key }) => {
      try {
        return ok(
          await apiGet('/api/v2/index/indexInfo', {
            index_key,
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_index_list',
    'Get list of all available indexes',
    {},
    async () => {
      try {
        return ok(
          await apiGet('/api/v2/index/getIndex')
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_indicator_kline_trading_pair',
    'Get trading pairs for indicator K-line',
    {
      indicator: z
        .string()
        .optional()
        .describe('Indicator name filter'),
    },
    async ({ indicator }) => {
      try {
        const params: Record<string, string> = {};
        if (indicator) params.indicator = indicator;
        return ok(
          await apiGet(
            '/api/v2/indicatorKline/getTradingPair',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_indicator_kline_data',
    'Get indicator K-line data records',
    {
      trading_pair: z
        .string()
        .describe('Trading pair key'),
      indicator: z
        .string()
        .describe('Indicator name'),
      period: z
        .string()
        .optional()
        .describe('Period: 1min,5min,15min,1hour,4hour,1day'),
      limit: z
        .string()
        .optional()
        .describe('Number of records'),
    },
    async ({ trading_pair, indicator, period, limit }) => {
      try {
        const params: Record<string, string> = {
          trading_pair,
          indicator,
        };
        if (period) params.period = period;
        if (limit) params.limit = limit;
        return ok(
          await apiGet(
            '/api/v2/indicatorKline/dataRecords',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_coin_treasury_entities',
    'Get coin treasury entity data (e.g. MicroStrategy BTC holdings)',
    {
      coin: z
        .string()
        .describe('Coin key, e.g. bitcoin'),
      entity_type: z
        .string()
        .optional()
        .describe('Entity type filter'),
    },
    async ({ coin, entity_type }) => {
      try {
        const body: Record<string, unknown> = { coin };
        if (entity_type) body.entity_type = entity_type;
        return ok(
          await apiPost(
            '/api/upgrade/v2/coin-treasuries/entities',
            body
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_coin_treasury_history',
    'Get coin treasury historical data',
    {
      coin: z
        .string()
        .describe('Coin key, e.g. bitcoin'),
      entity_id: z
        .string()
        .optional()
        .describe('Entity ID filter'),
    },
    async ({ coin, entity_id }) => {
      try {
        const body: Record<string, unknown> = { coin };
        if (entity_id) body.entity_id = entity_id;
        return ok(
          await apiPost(
            '/api/upgrade/v2/coin-treasuries/history',
            body
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_coin_treasury_accumulated',
    'Get accumulated coin treasury historical data',
    {
      coin: z
        .string()
        .describe('Coin key, e.g. bitcoin'),
      entity_id: z
        .string()
        .optional()
        .describe('Entity ID filter'),
    },
    async ({ coin, entity_id }) => {
      try {
        const body: Record<string, unknown> = { coin };
        if (entity_id) body.entity_id = entity_id;
        return ok(
          await apiPost(
            '/api/upgrade/v2/coin-treasuries/history/accumulated',
            body
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_latest_coin_treasury_entities',
    'Get latest coin treasury entity data',
    {
      coin: z
        .string()
        .describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/coin-treasuries/latest/entities',
            { coin }
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_latest_coin_treasury_history',
    'Get latest coin treasury history data',
    {
      coin: z
        .string()
        .describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/coin-treasuries/latest/history',
            { coin }
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_coin_treasury_summary',
    'Get coin treasury data summary',
    {
      coin: z
        .string()
        .describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/coin-treasuries/summary',
            { coin }
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_latest_depth',
    'Get latest order book depth data for futures',
    {
      coin: z
        .string()
        .describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/latest-depth',
            { coin }
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_full_depth',
    'Get full order book depth data for futures',
    {
      coin: z
        .string()
        .describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/full-depth',
            { coin }
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_full_depth_grouped',
    'Get full depth data grouped by price level',
    {
      coin: z
        .string()
        .describe('Coin key, e.g. bitcoin'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(
            '/api/upgrade/v2/futures/full-depth/grouped',
            { coin }
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );
}