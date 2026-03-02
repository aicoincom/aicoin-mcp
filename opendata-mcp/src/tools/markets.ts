/**
 * Market data tools
 * #19 market_info (4→1): get_markets(opendata) + get_market_ticker + get_hot_tab_coins + get_futures_interest
 * #20 kline (3→1): get_kline_data + get_indicator_kline_data + get_indicator_kline_trading_pair
 * #21 index_data (3→1): get_index_price + get_index_info + get_index_list
 * #22 crypto_stock (3→1): get_crypto_stock_quotes + get_crypto_stock_top_gainer + get_crypto_company_info
 * #23 coin_treasury (6→1): 6 treasury tools
 * #24 depth (3→1): get_latest_depth + get_full_depth + get_full_depth_grouped
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet, apiPost } from '../client/api.js';
import { ok, okList, okDepth, err, maxItemsParam, parseMax } from './utils.js';

export function registerMarketTools(server: McpServer) {
  // #19 market_info
  server.tool(
    'market_info',
    'Exchange/market data.\n• exchanges — all platforms, no params needed\n• ticker — platform tickers. Requires: market_list (NOT key)\n• hot_coins — trending by category. Requires: key (category key, NOT exchange name)\n• futures_interest — futures OI rankings, no required params',
    {
      action: z.enum(['exchanges', 'ticker', 'hot_coins', 'futures_interest']).describe(
        'exchanges: all supported platforms; ticker: platform ticker data; hot_coins: trending coins; futures_interest: futures open interest'
      ),
      market_list: z.string().optional().describe('REQUIRED for ticker. Comma-separated exchange keys, e.g. "okex,binance". NOT used by hot_coins'),
      key: z.string().optional().describe('REQUIRED for hot_coins. Category key: gamefi, anonymous, market, web, newcoin, stable, defi. This is a category key, NOT an exchange name'),
      currency: z.string().optional().describe('Currency: cny or usd'),
      lan: z.string().optional().describe('For futures_interest: language cn or en'),
      page: z.string().optional().describe('For futures_interest: page number'),
      pageSize: z.string().optional().describe('For futures_interest: page size, max 20'),
      ...maxItemsParam,
    },
    async ({ action, market_list, key, currency, lan, page, pageSize, _max_items }) => {
      try {
        switch (action) {
          case 'exchanges':
            return ok(await apiGet('/api/v2/market'));
          case 'ticker': {
            if (!market_list) return err('market_list is required for ticker action');
            return ok(await apiGet('/api/v2/market/ticker', { market_list }));
          }
          case 'hot_coins': {
            if (!key) return err('key is required for hot_coins action');
            const params: Record<string, string> = { key };
            if (currency) params.currency = currency;
            return okList(await apiGet('/api/v2/market/hotTabCoins', params), parseMax(_max_items, 20));
          }
          case 'futures_interest': {
            const params: Record<string, string> = {};
            if (lan) params.lan = lan;
            if (page) params.page = page;
            if (pageSize) params.pageSize = pageSize;
            if (currency) params.currency = currency;
            return ok(await apiGet('/api/v2/futures/interest', params));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #20 kline
  server.tool(
    'kline',
    'K-line (candlestick) data.\n• data — standard K-line. Requires: symbol\n• indicator — indicator K-line. Requires: symbol + indicator_key\n• trading_pair — available pairs for indicator. Optional: coinType, indicator_key',
    {
      action: z.enum(['data', 'indicator', 'trading_pair']).describe(
        'data: standard K-line data; indicator: indicator K-line data; trading_pair: available pairs for indicator K-line'
      ),
      symbol: z.string().optional().describe('REQUIRED for data, indicator. Trading pair with exchange, e.g. btcusdt:okex or btcswapusdt:binance'),
      indicator_key: z.string().optional().describe('REQUIRED for indicator. Optional for trading_pair. Indicator key: fundflow, aiaggtrade, fr, etc.'),
      coinType: z.string().optional().describe('Optional for trading_pair. Coin type, e.g. bitcoin'),
      period: z.string().optional().describe('Period in seconds: 900=15min, 3600=1h, 14400=4h, 86400=1d'),
      size: z.string().optional().describe('Number of candles, 1-500'),
      since: z.string().optional().describe('Start timestamp'),
      open_time: z.string().optional().describe('Open time offset: 0 or 8'),
    },
    async ({ action, symbol, indicator_key, coinType, period, size, since, open_time }) => {
      try {
        switch (action) {
          case 'data': {
            if (!symbol) return err('symbol is required for data action');
            const params: Record<string, string> = { symbol };
            if (period) params.period = period;
            params.size = size ?? '100';
            if (since) params.since = since;
            if (open_time) params.open_time = open_time;
            return ok(await apiGet('/api/v2/commonKline/dataRecords', params));
          }
          case 'indicator': {
            if (!symbol || !indicator_key) return err('symbol and indicator_key are required for indicator action');
            const params: Record<string, string> = { symbol, indicator_key };
            if (period) params.period = period;
            params.size = size ?? '100';
            if (since) params.since = since;
            if (open_time) params.open_time = open_time;
            return ok(await apiGet('/api/v2/indicatorKline/dataRecords', params));
          }
          case 'trading_pair': {
            const params: Record<string, string> = {};
            if (coinType) params.coinType = coinType;
            if (indicator_key) params.indicator_key = indicator_key;
            return ok(await apiGet('/api/v2/indicatorKline/getTradingPair', params));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #21 index_data
  server.tool(
    'index_data',
    'Index data.\n• price — index price. Requires: key\n• info — index detail. Requires: key\n• list — all available indexes, no params needed',
    {
      action: z.enum(['price', 'info', 'list']).describe(
        'price: index price data; info: index detail; list: all available indexes'
      ),
      key: z.string().optional().describe('REQUIRED for price, info. Index key in "i:symbol:exchange" format, e.g. "i:diniw:ice". Use list action to discover available keys'),
      currency: z.string().optional().describe('For price: currency cny or usd'),
      lan: z.string().optional().describe('For info: language en or cn'),
      ...maxItemsParam,
    },
    async ({ action, key, currency, lan, _max_items }) => {
      try {
        switch (action) {
          case 'price': {
            if (!key) return err('key is required for price action');
            const params: Record<string, string> = { key };
            if (currency) params.currency = currency;
            return ok(await apiGet('/api/v2/index/indexPrice', params));
          }
          case 'info': {
            if (!key) return err('key is required for info action');
            const params: Record<string, string> = { key };
            if (lan) params.lan = lan;
            return ok(await apiGet('/api/v2/index/indexInfo', params));
          }
          case 'list':
            return okList(await apiGet('/api/v2/index/getIndex'), parseMax(_max_items, 20));
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #22 crypto_stock
  server.tool(
    'crypto_stock',
    'Crypto-related stocks.\n• quotes — stock prices. Optional: tickers\n• top_gainer — top gainers. Optional: us_stock, hk_stock\n• company — company details. Requires: symbol (in "i:ticker:market" format)',
    {
      action: z.enum(['quotes', 'top_gainer', 'company']).describe(
        'quotes: stock quotes (MSTR,COIN); top_gainer: top gaining stocks; company: company details'
      ),
      tickers: z.string().optional().describe('Optional for quotes. Comma-separated stock tickers in "i:ticker:market" format, e.g. "i:mstr:nasdaq,i:coin:nasdaq"'),
      symbol: z.string().optional().describe('REQUIRED for company. Stock symbol in "i:ticker:market" format, e.g. "i:mstr:nasdaq"'),
      us_stock: z.boolean().optional().describe('For top_gainer: include US stocks'),
      hk_stock: z.boolean().optional().describe('For top_gainer: include HK stocks'),
      limit: z.number().optional().describe('For top_gainer: number of results, default 30'),
    },
    async ({ action, tickers, symbol, us_stock, hk_stock, limit }) => {
      try {
        switch (action) {
          case 'quotes': {
            const params: Record<string, string> = {};
            if (tickers) params.tickers = tickers;
            return ok(await apiGet('/api/upgrade/v2/crypto_stock/quotes', params));
          }
          case 'top_gainer': {
            const params: Record<string, string> = {};
            if (us_stock != null) params.us_stock = String(us_stock);
            if (hk_stock != null) params.hk_stock = String(hk_stock);
            params.limit = String(limit ?? 30);
            return ok(await apiGet('/api/upgrade/v2/crypto_stock/top-gainer', params));
          }
          case 'company': {
            if (!symbol) return err('symbol is required for company action');
            return ok(await apiGet(`/api/upgrade/v2/crypto_stock/company/${symbol}`));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #23 coin_treasury
  server.tool(
    'coin_treasury',
    'Coin treasury data (corporate holdings). Requires: coin for all actions.\n• entities — treasury entities\n• history — trade history\n• accumulated — accumulated holdings over time\n• latest_entities / latest_history — latest data\n• summary — overview stats',
    {
      action: z.enum(['entities', 'history', 'accumulated', 'latest_entities', 'latest_history', 'summary']).describe(
        'entities: treasury entity data; history: trade history; accumulated: accumulated data; latest_entities/latest_history: latest data; summary: overview'
      ),
      coin: z.string().describe('REQUIRED for all actions. Coin ticker in uppercase, e.g. BTC, ETH'),
      entity_type: z.string().optional().describe('Entity type filter'),
      name: z.string().optional().describe('Entity name filter'),
      ticker: z.string().optional().describe('For entities: stock ticker filter'),
      type: z.string().optional().describe('For history: trade type Buy or Sell'),
      start_date: z.string().optional().describe('Start date, ISO 8601'),
      end_date: z.string().optional().describe('End date, ISO 8601'),
      interval: z.string().optional().describe('For accumulated: daily, weekly, or monthly'),
      page: z.string().optional().describe('Page number, default 1'),
      page_size: z.string().optional().describe('Page size, default 20'),
      sort_by: z.string().optional().describe('For history: sort field, default date'),
      sort_order: z.string().optional().describe('Sort: asc or desc, default desc'),
      ...maxItemsParam,
    },
    async ({ action, coin, entity_type, name, ticker, type, start_date, end_date, interval, page, page_size, sort_by, sort_order, _max_items }) => {
      try {
        switch (action) {
          case 'entities': {
            const body: Record<string, unknown> = { coin };
            if (entity_type) body.entity_type = entity_type;
            if (name) body.name = name;
            if (ticker) body.ticker = ticker;
            if (start_date) body.start_date = start_date;
            if (end_date) body.end_date = end_date;
            if (page) body.page = Number(page);
            if (page_size) body.page_size = Number(page_size);
            if (sort_order) body.sort_order = sort_order;
            return ok(await apiPost('/api/upgrade/v2/coin-treasuries/entities', body));
          }
          case 'history': {
            const body: Record<string, unknown> = { coin };
            if (name) body.name = name;
            if (type) body.type = type;
            if (start_date) body.start_date = start_date;
            if (end_date) body.end_date = end_date;
            if (page) body.page = Number(page);
            if (page_size) body.page_size = Number(page_size);
            if (sort_by) body.sort_by = sort_by;
            if (sort_order) body.sort_order = sort_order;
            return ok(await apiPost('/api/upgrade/v2/coin-treasuries/history', body));
          }
          case 'accumulated': {
            const body: Record<string, unknown> = { coin };
            if (entity_type) body.entity_type = entity_type;
            if (start_date) body.start_date = start_date;
            if (end_date) body.end_date = end_date;
            if (interval) body.interval = interval;
            return ok(await apiPost('/api/upgrade/v2/coin-treasuries/history/accumulated', body));
          }
          case 'latest_entities':
            return okList(
              await apiGet('/api/upgrade/v2/coin-treasuries/latest/entities', { coin }),
              parseMax(_max_items, 20)
            );
          case 'latest_history':
            return okList(
              await apiGet('/api/upgrade/v2/coin-treasuries/latest/history', { coin }),
              parseMax(_max_items, 20)
            );
          case 'summary':
            return ok(await apiGet('/api/upgrade/v2/coin-treasuries/summary', { coin }));
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #24 depth
  server.tool(
    'depth',
    'Order book depth. Requires: dbKey for all actions.\n• latest — real-time snapshot\n• full — complete order book\n• grouped — grouped by price interval. Requires: groupSize',
    {
      action: z.enum(['latest', 'full', 'grouped']).describe(
        'latest: real-time snapshot; full: complete order book; grouped: grouped by price interval'
      ),
      dbKey: z.string().describe('REQUIRED for all actions. Trading pair key, e.g. btcswapusdt:binance'),
      size: z.string().optional().describe('Optional for latest. Depth levels 1-500, default 50'),
      groupSize: z.string().optional().describe('REQUIRED for grouped. Price grouping interval, e.g. "100", "500", "1000"'),
      ...maxItemsParam,
    },
    async ({ action, dbKey, size, groupSize, _max_items }) => {
      try {
        switch (action) {
          case 'latest': {
            const params: Record<string, string> = { dbKey };
            if (size) params.size = size;
            return ok(await apiGet('/api/upgrade/v2/futures/latest-depth', params));
          }
          case 'full':
            return okDepth(
              await apiGet('/api/upgrade/v2/futures/full-depth', { dbKey }),
              parseMax(_max_items, 50)
            );
          case 'grouped': {
            if (!groupSize) return err('groupSize is required for grouped action');
            return okDepth(
              await apiGet('/api/upgrade/v2/futures/full-depth/grouped', { dbKey, groupSize }),
              parseMax(_max_items, 50)
            );
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );
}
