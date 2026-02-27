/**
 * Market data tools
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet, apiPost } from '../client/api.js';
import { ok, okList, err, maxItemsParam, parseMax } from './utils.js';

export function registerMarketTools(server: McpServer) {
  server.tool(
    'get_kline_data',
    'Get K-line (candlestick) data for a trading pair',
    {
      symbol: z
        .string()
        .describe(
          'Symbol, e.g. btcusdt:okex or i:ixic:nasdaq'
        ),
      period: z
        .string()
        .optional()
        .describe(
          'Period in seconds: 900=15min, 3600=1h, 14400=4h, 86400=1d'
        ),
      size: z
        .string()
        .optional()
        .describe('Number of candles, 1-500'),
      since: z
        .string()
        .optional()
        .describe('Start timestamp'),
      open_time: z
        .string()
        .optional()
        .describe('Open time offset: 0 or 8'),
    },
    async ({ symbol, period, size, since, open_time }) => {
      try {
        const params: Record<string, string> = {
          symbol,
        };
        if (period) params.period = period;
        params.size = size ?? '100';
        if (since) params.since = since;
        if (open_time) params.open_time = open_time;
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
    'Get ticker data for exchange platforms',
    {
      market_list: z
        .string()
        .describe(
          'Comma-separated exchange keys, max 100, e.g. okex,binance'
        ),
    },
    async ({ market_list }) => {
      try {
        return ok(
          await apiGet('/api/v2/market/ticker', {
            market_list,
          })
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
        .describe('Coin ticker, e.g. BTC, ETH'),
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
    'get_crypto_stock_top_gainer',
    'Get top gaining crypto-related stocks (US and/or HK market)',
    {
      us_stock: z
        .boolean()
        .optional()
        .describe('Include US stocks (default false)'),
      hk_stock: z
        .boolean()
        .optional()
        .describe('Include HK stocks (default false)'),
      limit: z
        .number()
        .optional()
        .describe('Number of results (default 50)'),
    },
    async ({ us_stock, hk_stock, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (us_stock != null)
          params.us_stock = String(us_stock);
        if (hk_stock != null)
          params.hk_stock = String(hk_stock);
        params.limit = String(limit ?? 30);
        return ok(
          await apiGet(
            '/api/upgrade/v2/crypto_stock/top-gainer',
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
      key: z
        .string()
        .describe('Index key, e.g. i:diniw:ice'),
      currency: z
        .string()
        .optional()
        .describe('Currency: cny or usd'),
    },
    async ({ key, currency }) => {
      try {
        const params: Record<string, string> = { key };
        if (currency) params.currency = currency;
        return ok(
          await apiGet('/api/v2/index/indexPrice', params)
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
      key: z
        .string()
        .describe(
          'Category key: gamefi,anonymous,market,web,newcoin,stable,defi'
        ),
      currency: z
        .string()
        .optional()
        .describe('Currency: cny or usd'),
      ...maxItemsParam,
    },
    async ({ key, currency, _max_items }) => {
      try {
        const params: Record<string, string> = { key };
        if (currency) params.currency = currency;
        return okList(
          await apiGet(
            '/api/v2/market/hotTabCoins',
            params
          ),
          parseMax(_max_items, 50)
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
        .describe(
          'Symbol in i:ticker:market format, e.g. i:mstr:nasdaq'
        ),
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
      key: z
        .string()
        .describe('Index key, e.g. i:diniw:ice'),
      lan: z
        .string()
        .optional()
        .describe('Language: en or cn'),
    },
    async ({ key, lan }) => {
      try {
        const params: Record<string, string> = { key };
        if (lan) params.lan = lan;
        return ok(
          await apiGet('/api/v2/index/indexInfo', params)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_index_list',
    'Get list of all available indexes',
    { ...maxItemsParam },
    async ({ _max_items }) => {
      try {
        return okList(
          await apiGet('/api/v2/index/getIndex'),
          parseMax(_max_items, 50)
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
      coinType: z
        .string()
        .optional()
        .describe('Coin type, e.g. bitcoin'),
      indicator_key: z
        .string()
        .optional()
        .describe(
          'Indicator key: fundflow,aiaggtrade,fr,etc.'
        ),
    },
    async ({ coinType, indicator_key }) => {
      try {
        const params: Record<string, string> = {};
        if (coinType) params.coinType = coinType;
        if (indicator_key)
          params.indicator_key = indicator_key;
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
      symbol: z
        .string()
        .describe(
          'Trading pair, e.g. btcswapusdt:binance'
        ),
      indicator_key: z
        .string()
        .describe(
          'Indicator key: fundflow, aiaggtrade, fr, etc.'
        ),
      period: z
        .string()
        .optional()
        .describe(
          'Period in seconds: 900=15min, 3600=1h, ' +
            '14400=4h, 86400=1d'
        ),
      size: z
        .string()
        .optional()
        .describe('Number of records, 1-500'),
      since: z
        .string()
        .optional()
        .describe('Start timestamp'),
      open_time: z
        .string()
        .optional()
        .describe('Open time offset: 0 or 8'),
    },
    async ({
      symbol,
      indicator_key,
      period,
      size,
      since,
      open_time,
    }) => {
      try {
        const params: Record<string, string> = {
          symbol,
          indicator_key,
        };
        if (period) params.period = period;
        params.size = size ?? '100';
        if (since) params.since = since;
        if (open_time) params.open_time = open_time;
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
        .describe('Coin ticker, e.g. BTC, ETH'),
      entity_type: z
        .string()
        .optional()
        .describe(
          'Entity type: public-companies, eth-treasuries, etc.'
        ),
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
        .describe('Coin ticker, e.g. BTC, ETH'),
      entity_id: z
        .string()
        .optional()
        .describe('Entity ID filter'),
      ...maxItemsParam,
    },
    async ({ coin, entity_id, _max_items }) => {
      try {
        const body: Record<string, unknown> = { coin };
        if (entity_id) body.entity_id = entity_id;
        return okList(
          await apiPost(
            '/api/upgrade/v2/coin-treasuries/history',
            body
          ),
          parseMax(_max_items, 100)
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
        .describe('Coin ticker, e.g. BTC, ETH'),
      entity_id: z
        .string()
        .optional()
        .describe('Entity ID filter'),
      ...maxItemsParam,
    },
    async ({ coin, entity_id, _max_items }) => {
      try {
        const body: Record<string, unknown> = { coin };
        if (entity_id) body.entity_id = entity_id;
        return okList(
          await apiPost(
            '/api/upgrade/v2/coin-treasuries/history/accumulated',
            body
          ),
          parseMax(_max_items, 100)
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
        .describe('Coin ticker, e.g. BTC, ETH'),
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
        .describe('Coin ticker, e.g. BTC, ETH'),
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
        .describe('Coin ticker, e.g. BTC, ETH'),
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
        .describe('Coin ticker, e.g. BTC, ETH'),
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
        .describe('Coin ticker, e.g. BTC, ETH'),
      ...maxItemsParam,
    },
    async ({ coin, _max_items }) => {
      try {
        return okList(
          await apiGet(
            '/api/upgrade/v2/futures/full-depth',
            { coin }
          ),
          parseMax(_max_items, 50)
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
        .describe('Coin ticker, e.g. BTC, ETH'),
      ...maxItemsParam,
    },
    async ({ coin, _max_items }) => {
      try {
        return okList(
          await apiGet(
            '/api/upgrade/v2/futures/full-depth/grouped',
            { coin }
          ),
          parseMax(_max_items, 50)
        );
      } catch (e) {
        return err(e);
      }
    }
  );
}