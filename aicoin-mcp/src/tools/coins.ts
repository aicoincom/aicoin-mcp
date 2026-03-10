/**
 * Coin data tools
 * #12 coin_info (4→1): get_coin_list + get_coin_ticker + get_coin_config + get_ai_coin_analysis
 * #13 coin_funding_rate (2→1): get_funding_rate_history(opendata) + get_weighted_funding_rate_history
 * #14 coin_liquidation (3→1): get_liquidation_map + get_liquidation_history + get_estimated_liquidation_history
 * #15 coin_open_interest (2→1): get_aggregated_stablecoin_oi_history + get_aggregated_coin_margin_oi_history
 * #16 coin_futures_data (3→1): get_historical_depth + get_super_depth_history + get_trade_data
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet, apiPost } from '../client/api.js';
import { ok, okList, okListDeep, err, maxItemsParam, parseMax } from './utils.js';

export function registerCoinTools(server: McpServer) {
  // #12 coin_info
  server.tool(
    'coin_info',
    'Coin data.\n• search — search coins by keyword, returns coinKey/dbKeys. Requires: search\n• list — all coins, no params needed\n• ticker — real-time prices. Requires: coin_list\n• config — coin profiles. Requires: coin_list\n• ai_analysis — AI predictions. Requires: coin_keys (JSON array string)',
    {
      action: z.enum(['search', 'list', 'ticker', 'config', 'ai_analysis']).describe(
        'search: find coins by keyword; list: top coins; ticker: real-time prices; config: coin profiles; ai_analysis: AI predictions'
      ),
      search: z.string().optional().describe('REQUIRED for search. Keyword like "BTC" or "bitcoin"'),
      coin_list: z.string().optional().describe('REQUIRED for ticker, config. Comma-separated coin keys, e.g. "bitcoin,ethereum". NOT used by ai_analysis'),
      coin_keys: z.string().optional().describe('REQUIRED for ai_analysis. JSON array string, e.g. \'["bitcoin","ethereum"]\'. NOT used by ticker/config'),
      language: z.enum(['CN', 'EN', 'TC']).optional().describe('Optional for ai_analysis: response language, default CN'),
      page: z.number().optional().describe('Optional for search: page number, default 1'),
      page_size: z.number().optional().describe('Optional for search: page size, default 20'),
      ...maxItemsParam,
    },
    async ({ action, search, coin_list, coin_keys, language, page, page_size, _max_items }) => {
      try {
        switch (action) {
          case 'search': {
            if (!search) return err('search is required for search action');
            const params: Record<string, string> = { search };
            if (page) params.page = String(page);
            if (page_size) params.page_size = String(page_size);
            return ok(await apiGet('/api/upgrade/v2/coin/search', params));
          }
          case 'list':
            return okList(await apiGet('/api/v2/coin'), parseMax(_max_items, 100));
          case 'ticker': {
            if (!coin_list) return err('coin_list is required for ticker action');
            return ok(await apiGet('/api/v2/coin/ticker', { coin_list }));
          }
          case 'config': {
            if (!coin_list) return err('coin_list is required for config action');
            return ok(await apiGet('/api/v2/coin/config', { coin_list }));
          }
          case 'ai_analysis': {
            if (!coin_keys) return err('coin_keys is required for ai_analysis action');
            const body: Record<string, unknown> = { coinKeys: JSON.parse(coin_keys) };
            if (language) body.language = language;
            return ok(await apiPost('/api/v2/content/ai-coins', body));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #13 coin_funding_rate
  server.tool(
    'coin_funding_rate',
    'Funding rate history.\n• Default: per-exchange rate. Requires symbol with exchange suffix, e.g. btcswapusdt:binance\n• weighted=true: volume-weighted rate across exchanges. Symbol WITHOUT exchange suffix, e.g. btcswapusdt',
    {
      symbol: z.string().describe('REQUIRED. Trading pair. With exchange suffix for normal (e.g. btcswapusdt:binance), WITHOUT suffix for weighted (e.g. btcswapusdt)'),
      interval: z.string().describe('REQUIRED. Candle interval: 5m, 15m, 30m, 8h (recommended). 1h, 4h, 1d may return empty'),
      weighted: z.boolean().optional().default(false).describe('Use volume-weighted funding rate'),
      limit: z.string().optional().describe('Number of records, default 100'),
      start_time: z.string().optional().describe('Start time in ms'),
      end_time: z.string().optional().describe('End time in ms'),
    },
    async ({ symbol, interval, weighted, limit, start_time, end_time }) => {
      try {
        const params: Record<string, string> = { symbol, interval };
        params.limit = limit ?? '100';
        if (start_time) params.start_time = start_time;
        if (end_time) params.end_time = end_time;
        const path = weighted
          ? '/api/upgrade/v2/futures/funding-rate/vol-weight-history'
          : '/api/upgrade/v2/futures/funding-rate/history';
        return ok(await apiGet(path, params));
      } catch (e) {
        return err(e);
      }
    }
  );

  // #14 coin_liquidation
  server.tool(
    'coin_liquidation',
    'Liquidation data.\n• history — liquidation orders. Requires: symbol + interval\n• map — liquidation heatmap. Requires: dbkey + cycle\n• estimated — estimated liquidation chart. Requires: dbkey + cycle',
    {
      action: z.enum(['map', 'history', 'estimated']).describe(
        'map: liquidation heatmap; history: liquidation orders; estimated: estimated liquidation chart'
      ),
      symbol: z.string().optional().describe('REQUIRED for history. Trading pair with exchange, e.g. btcswapusdt:binance. NOT used by map/estimated'),
      dbkey: z.string().optional().describe('REQUIRED for map, estimated. Trading pair key, e.g. btcswapusdt:binance. NOT used by history'),
      cycle: z.string().optional().describe('REQUIRED for map, estimated. Time cycle: "24h" or "7d"'),
      leverage: z.string().optional().describe('Optional for map, estimated. Leverage filter: 10, 25, 50, 100'),
      interval: z.string().optional().describe('REQUIRED for history. Candle interval: 1m, 2m, 15m, 30m'),
      limit: z.string().optional().describe('Number of records'),
      start_time: z.string().optional().describe('Start time in ms'),
      end_time: z.string().optional().describe('End time in ms'),
      ...maxItemsParam,
    },
    async ({ action, symbol, dbkey, cycle, leverage, interval, limit, start_time, end_time, _max_items }) => {
      try {
        switch (action) {
          case 'map': {
            if (!dbkey || !cycle) return err('dbkey and cycle are required for map action');
            const params: Record<string, string> = { dbkey, cycle };
            if (leverage) params.leverage = leverage;
            return okList(
              await apiGet('/api/upgrade/v2/futures/liquidation/map', params),
              parseMax(_max_items, 50)
            );
          }
          case 'history': {
            if (!symbol || !interval) return err('symbol and interval are required for history action');
            const params: Record<string, string> = { symbol, interval };
            params.limit = limit ?? '100';
            if (start_time) params.start_time = start_time;
            if (end_time) params.end_time = end_time;
            return ok(await apiGet('/api/upgrade/v2/futures/liquidation/history', params));
          }
          case 'estimated': {
            if (!dbkey || !cycle) return err('dbkey and cycle are required for estimated action');
            const params: Record<string, string> = { dbkey, cycle };
            if (leverage) params.leverage = leverage;
            params.limit = limit ?? '5';
            if (start_time) params.start_time = start_time;
            if (end_time) params.end_time = end_time;
            return okListDeep(
              await apiGet('/api/upgrade/v2/futures/estimated-liquidation/history', params),
              parseMax(_max_items, 5), 20
            );
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #15 coin_open_interest
  server.tool(
    'coin_open_interest',
    'Aggregated open interest history. Requires: symbol + interval.\n• margin_type=stablecoin: stablecoin-margined OI (default)\n• margin_type=coin: coin-margined OI',
    {
      symbol: z.string().describe('REQUIRED. Coin symbol in uppercase, e.g. BTC, ETH'),
      interval: z.string().describe('REQUIRED. Candle interval: 1m, 2m, 15m, 30m'),
      margin_type: z.enum(['stablecoin', 'coin']).default('stablecoin').describe(
        'stablecoin: stablecoin-margined OI; coin: coin-margined OI'
      ),
      limit: z.string().optional().describe('Number of records, default 100'),
      start_time: z.string().optional().describe('Start time in ms'),
      end_time: z.string().optional().describe('End time in ms'),
    },
    async ({ symbol, interval, margin_type, limit, start_time, end_time }) => {
      try {
        const params: Record<string, string> = { symbol, interval };
        params.limit = limit ?? '100';
        if (start_time) params.start_time = start_time;
        if (end_time) params.end_time = end_time;
        const path = margin_type === 'coin'
          ? '/api/upgrade/v2/futures/open-interest/aggregated-coin-margin-history'
          : '/api/upgrade/v2/futures/open-interest/aggregated-stablecoin-history';
        return ok(await apiGet(path, params));
      } catch (e) {
        return err(e);
      }
    }
  );

  // #16 coin_futures_data
  server.tool(
    'coin_futures_data',
    'Futures depth & trade data.\n• historical_depth — order book history. Requires: key\n• super_depth — large orders >$10k. Requires: key\n• trade_data — latest trades. Requires: dbkey (NOT key)',
    {
      action: z.enum(['historical_depth', 'super_depth', 'trade_data']).describe(
        'historical_depth: order book history; super_depth: large order depth; trade_data: latest trade data'
      ),
      key: z.string().optional().describe('REQUIRED for historical_depth, super_depth. Trading pair key, e.g. btcswapusdt:okcoinfutures. NOT used by trade_data'),
      dbkey: z.string().optional().describe('REQUIRED for trade_data. Trading pair key, e.g. btcswapusdt:okcoinfutures. NOT used by historical_depth/super_depth'),
      amount: z.string().optional().describe('For super_depth: USD threshold, default 10000'),
      limit: z.string().optional().describe('Number of records, max 1000'),
      start_time: z.string().optional().describe('Start time in ms'),
      end_time: z.string().optional().describe('End time in ms'),
    },
    async ({ action, key, dbkey, amount, limit, start_time, end_time }) => {
      try {
        switch (action) {
          case 'historical_depth': {
            if (!key) return err('key is required for historical_depth action');
            const params: Record<string, string> = { key };
            params.limit = limit ?? '100';
            if (start_time) params.start_time = start_time;
            if (end_time) params.end_time = end_time;
            return ok(await apiGet('/api/upgrade/v2/futures/historical-depth', params));
          }
          case 'super_depth': {
            if (!key) return err('key is required for super_depth action');
            const params: Record<string, string> = { key };
            params.amount = amount ?? '10000';
            params.limit = limit ?? '100';
            if (start_time) params.start_time = start_time;
            if (end_time) params.end_time = end_time;
            return ok(await apiGet('/api/upgrade/v2/futures/super-depth/history', params));
          }
          case 'trade_data': {
            if (!dbkey) return err('dbkey is required for trade_data action');
            const params: Record<string, string> = { dbkey };
            params.limit = limit ?? '100';
            if (start_time) params.start_time = start_time;
            if (end_time) params.end_time = end_time;
            return ok(await apiGet('/api/upgrade/v2/futures/trade-data', params));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );
}
