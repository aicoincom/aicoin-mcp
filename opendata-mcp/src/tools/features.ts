/**
 * Feature data tools (long/short ratio, whale orders, signals)
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet } from '../client/api.js';
import { ok, okList, err, maxItemsParam, parseMax } from './utils.js';

export function registerFeatureTools(server: McpServer) {
  server.tool(
    'get_ls_ratio',
    'Get long/short ratio data',
    {
      coin: z
        .string()
        .describe('Coin key, e.g. bitcoin'),
      period: z
        .string()
        .optional()
        .describe('Period filter'),
    },
    async ({ coin, period }) => {
      try {
        const params: Record<string, string> = { coin };
        if (period) params.period = period;
        return ok(
          await apiGet('/api/v2/mix/ls-ratio', params)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_liquidation_data',
    'Get liquidation/forced-close data',
    {
      coin: z
        .string()
        .optional()
        .describe('Coin key filter'),
      period: z
        .string()
        .optional()
        .describe('Period filter'),
      ...maxItemsParam,
    },
    async ({ coin, period, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        if (period) params.period = period;
        return okList(
          await apiGet('/api/v2/mix/liq', params),
          parseMax(_max_items, 50)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_big_orders',
    'Get whale/large order tracking data',
    {
      symbol: z
        .string()
        .describe(
          'Trading pair, e.g. btcusdt:okex'
        ),
      ...maxItemsParam,
    },
    async ({ symbol, _max_items }) => {
      try {
        return okList(
          await apiGet('/api/v2/order/bigOrder', {
            symbol,
          }),
          parseMax(_max_items, 50)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_agg_trades',
    'Get aggregated large trades data',
    {
      symbol: z
        .string()
        .describe(
          'Trading pair, e.g. btcusdt:okex'
        ),
      ...maxItemsParam,
    },
    async ({ symbol, _max_items }) => {
      try {
        return okList(
          await apiGet('/api/v2/order/aggTrade', {
            symbol,
          }),
          parseMax(_max_items, 50)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_trading_pair_ticker',
    'Get ticker data for specific trading pairs',
    {
      key_list: z
        .string()
        .describe(
          'Trading pair keys, comma-separated, max 100, e.g. btcusdt:okex,btcusdt:huobipro'
        ),
    },
    async ({ key_list }) => {
      try {
        return ok(
          await apiGet('/api/v2/trading-pair/ticker', {
            key_list,
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_strategy_signal',
    'Get indicator win-rate signal data',
    {
      coin_type: z
        .string()
        .optional()
        .describe('Coin type, e.g. bitcoin'),
      signal_key: z
        .string()
        .optional()
        .describe(
          'Signal key: depth_win_one,depth_win_two,depth_buy_one,order_buy_one,td_buy_one,lsur_one'
        ),
      latest_time: z
        .string()
        .optional()
        .describe('Latest time in ms timestamp'),
      ...maxItemsParam,
    },
    async ({ coin_type, signal_key, latest_time, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (coin_type) params.coin_type = coin_type;
        if (signal_key) params.signal_key = signal_key;
        if (latest_time)
          params.latest_time = latest_time;
        return okList(
          await apiGet(
            '/api/v2/signal/strategySignal',
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
    'get_nav',
    'Get navigation bar data (market overview)',
    {},
    async () => {
      try {
        return ok(await apiGet('/api/v2/mix/nav'));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_grayscale_trust',
    'Get Grayscale trust fund data',
    {},
    async () => {
      try {
        return ok(
          await apiGet('/api/v2/mix/grayscale-trust')
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_gray_scale',
    'Get Grayscale holdings data',
    {
      coins: z
        .string()
        .describe(
          'Coin list, comma-separated: btc,ltc,eth,bch,xrp,xlm,zec,zen,etc'
        ),
    },
    async ({ coins }) => {
      try {
        return ok(
          await apiGet('/api/v2/mix/gray-scale', {
            coins,
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_stock_market',
    'Get stock market data (crypto-related)',
    { ...maxItemsParam },
    async ({ _max_items }) => {
      try {
        return okList(
          await apiGet('/api/v2/mix/stock-market'),
          parseMax(_max_items, 50)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_signal_alert',
    'Get signal alert data',
    {
      coin: z
        .string()
        .optional()
        .describe('Coin key filter'),
      ...maxItemsParam,
    },
    async ({ coin, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        return okList(
          await apiGet(
            '/api/v2/signal/signalAlert',
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
    'get_signal_alert_config',
    'Get signal alert configuration options',
    {},
    async () => {
      try {
        return ok(
          await apiGet('/api/v2/signal/signalAlertConf')
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'delete_signal_alert',
    'Delete a signal alert by ID',
    {
      id: z.string().describe('Signal alert ID'),
    },
    async ({ id }) => {
      try {
        return ok(
          await apiGet(
            '/api/v2/signal/delSignalAlert',
            { id }
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'add_signal_alert',
    'Add a new signal alert',
    {
      params_json: z
        .string()
        .describe('Alert params as JSON string'),
    },
    async ({ params_json }) => {
      try {
        const params = JSON.parse(params_json);
        return ok(
          await apiGet(
            '/api/v2/signal/addSignalAlert',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_signal_alert_list',
    'Get signal alert settings list',
    {},
    async () => {
      try {
        return ok(
          await apiGet(
            '/api/v2/signal/getSignalAlertSetList'
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_change_signal',
    'Get abnormal movement signal data',
    {
      type: z
        .string()
        .optional()
        .describe(
          'Signal type: 1-12, 17, 18, 23, 24'
        ),
      currency: z
        .string()
        .optional()
        .describe('Currency: usd (default) or cny'),
      ...maxItemsParam,
    },
    async ({ type, currency, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (type) params.type = type;
        if (currency) params.currency = currency;
        return okList(
          await apiGet(
            '/api/v2/signal/changeSignal',
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
    'get_trading_pair',
    'Get all trading pair info (no filter params)',
    {},
    async () => {
      try {
        return okList(
          await apiGet(
            '/api/v2/trading-pair/getTradingPair'
          ),
          50
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'get_trading_pairs',
    'Get trading pair list for a platform',
    {
      market: z
        .string()
        .describe(
          'Platform key (from /v2/market), e.g. okex, binance'
        ),
      currency: z
        .string()
        .optional()
        .describe('Quote currency filter'),
      show: z
        .string()
        .optional()
        .describe('Coin symbol filter'),
      ...maxItemsParam,
    },
    async ({ market, currency, show, _max_items }) => {
      try {
        const params: Record<string, string> = {
          market,
        };
        if (currency) params.currency = currency;
        if (show) params.show = show;
        return okList(
          await apiGet('/api/v2/trading-pair', params),
          parseMax(_max_items, 100)
        );
      } catch (e) {
        return err(e);
      }
    }
  );
}