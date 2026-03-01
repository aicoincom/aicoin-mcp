/**
 * Feature data tools
 * #25 market_overview (6→1): get_nav + get_ls_ratio + get_liquidation_data + get_grayscale_trust + get_gray_scale + get_stock_market
 * #26 order_flow (2→1): get_big_orders + get_agg_trades
 * #27 trading_pair (3→1): get_trading_pair_ticker + get_trading_pair + get_trading_pairs
 * #28 signal_data (5→1): get_strategy_signal + get_signal_alert + get_signal_alert_config + get_signal_alert_list + get_change_signal
 * #29 signal_manage (2→1): add_signal_alert + delete_signal_alert
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet } from '../client/api.js';
import { ok, okList, err, maxItemsParam, parseMax } from './utils.js';

export function registerFeatureTools(server: McpServer) {
  // #25 market_overview
  server.tool(
    'market_overview',
    'Market overview data.\n• nav — market overview/navigation\n• ls_ratio — long/short ratio, no params needed\n• liquidation — forced-close data\n• grayscale_trust — trust fund, no params needed\n• gray_scale — grayscale holdings. Requires: coins\n• stock_market — crypto stocks, no params needed',
    {
      action: z.enum(['nav', 'ls_ratio', 'liquidation', 'grayscale_trust', 'gray_scale', 'stock_market']).describe(
        'nav: market overview; ls_ratio: long/short ratio; liquidation: forced-close data; grayscale_trust: trust fund; gray_scale: holdings; stock_market: crypto stocks'
      ),
      lan: z.string().optional().describe('Optional for nav. Language: "cn" or "en"'),
      currency: z.string().optional().describe('Optional for liquidation. Currency: "cny" or "usd"'),
      type: z.string().optional().describe('Optional for liquidation. Group by: "1"=by coin, "2"=by platform'),
      coinKey: z.string().optional().describe('Optional for liquidation. Coin key filter (when type="1")'),
      marketKey: z.string().optional().describe('Optional for liquidation. Market key filter (when type="2")'),
      coins: z.string().optional().describe('REQUIRED for gray_scale. Comma-separated coin symbols in lowercase, e.g. "btc,eth"'),
      ...maxItemsParam,
    },
    async ({ action, lan, currency, type, coinKey, marketKey, coins, _max_items }) => {
      try {
        switch (action) {
          case 'nav': {
            const params: Record<string, string> = {};
            if (lan) params.lan = lan;
            return ok(await apiGet('/api/v2/mix/nav', params));
          }
          case 'ls_ratio':
            return ok(await apiGet('/api/v2/mix/ls-ratio'));
          case 'liquidation': {
            const params: Record<string, string> = {};
            if (currency) params.currency = currency;
            if (type) params.type = type;
            if (coinKey) params.coinKey = coinKey;
            if (marketKey) params.marketKey = marketKey;
            return ok(await apiGet('/api/v2/mix/liq', params));
          }
          case 'grayscale_trust':
            return ok(await apiGet('/api/v2/mix/grayscale-trust'));
          case 'gray_scale': {
            if (!coins) return err('coins is required for gray_scale action');
            return ok(await apiGet('/api/v2/mix/gray-scale', { coins }));
          }
          case 'stock_market':
            return okList(await apiGet('/api/v2/mix/stock-market'), parseMax(_max_items, 50));
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #26 order_flow
  server.tool(
    'order_flow',
    'Order flow data. Requires: symbol for all actions.\n• big_orders — whale/large order tracking\n• agg_trades — aggregated large trades',
    {
      action: z.enum(['big_orders', 'agg_trades']).describe(
        'big_orders: whale/large order tracking; agg_trades: aggregated large trades'
      ),
      symbol: z.string().describe('REQUIRED. Trading pair with exchange, e.g. btcswapusdt:binance'),
      ...maxItemsParam,
    },
    async ({ action, symbol, _max_items }) => {
      try {
        switch (action) {
          case 'big_orders':
            return okList(await apiGet('/api/v2/order/bigOrder', { symbol }), parseMax(_max_items, 20));
          case 'agg_trades':
            return okList(await apiGet('/api/v2/order/aggTrade', { symbol }), parseMax(_max_items, 30));
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #27 trading_pair
  server.tool(
    'trading_pair',
    'Trading pair data.\n• ticker — specific pair tickers. Requires: key_list\n• by_market — all pairs for a platform. Requires: market\n• list — pairs with filters. Requires: market',
    {
      action: z.enum(['ticker', 'by_market', 'list']).describe(
        'ticker: specific pair tickers; by_market: pairs for a platform; list: pairs with filters'
      ),
      key_list: z.string().optional().describe('REQUIRED for ticker. Comma-separated pair keys, e.g. "btcusdt:okex,btcusdt:huobipro"'),
      market: z.string().optional().describe('REQUIRED for by_market, list. Platform/exchange key, e.g. okex, binance'),
      currency: z.string().optional().describe('For list: quote currency filter'),
      show: z.string().optional().describe('For list: coin symbol filter'),
      ...maxItemsParam,
    },
    async ({ action, key_list, market, currency, show, _max_items }) => {
      try {
        switch (action) {
          case 'ticker': {
            if (!key_list) return err('key_list is required for ticker action');
            return ok(await apiGet('/api/v2/trading-pair/ticker', { key_list }));
          }
          case 'by_market': {
            if (!market) return err('market is required for by_market action');
            return okList(
              await apiGet('/api/v2/trading-pair/getTradingPair', { market }),
              parseMax(_max_items, 50)
            );
          }
          case 'list': {
            if (!market) return err('market is required for list action');
            const params: Record<string, string> = { market };
            if (currency) params.currency = currency;
            if (show) params.show = show;
            return okList(await apiGet('/api/v2/trading-pair', params), parseMax(_max_items, 100));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #28 signal_data
  server.tool(
    'signal_data',
    'Signal data.\n• strategy — indicator win-rate signals\n• alert — current signal alerts\n• config — alert configurations\n• alert_list — user alert settings\n• change — abnormal price movements',
    {
      action: z.enum(['strategy', 'alert', 'config', 'alert_list', 'change']).describe(
        'strategy: indicator win-rate signals; alert: signal alert data; config: alert configurations; alert_list: alert settings; change: abnormal movement'
      ),
      coin_type: z.string().optional().describe('Optional for strategy. Coin type, e.g. bitcoin'),
      signal_key: z.string().optional().describe('Optional for strategy. Signal key: depth_win_one, td_buy_one, etc.'),
      latest_time: z.string().optional().describe('Optional for strategy. Latest time filter in ms'),
      lan: z.string().optional().describe('Optional for config. Language: "cn" or "en"'),
      type: z.string().optional().describe('Optional for change. Signal type: 1-12, 17, 18, 23, 24'),
      currency: z.string().optional().describe('Optional for change. Currency: "usd" or "cny"'),
      ...maxItemsParam,
    },
    async ({ action, coin_type, signal_key, latest_time, lan, type, currency, _max_items }) => {
      try {
        switch (action) {
          case 'strategy': {
            const params: Record<string, string> = {};
            if (coin_type) params.coin_type = coin_type;
            if (signal_key) params.signal_key = signal_key;
            if (latest_time) params.latest_time = latest_time;
            return okList(await apiGet('/api/v2/signal/strategySignal', params), parseMax(_max_items, 20));
          }
          case 'alert':
            return okList(await apiGet('/api/v2/signal/signalAlert'), parseMax(_max_items, 20));
          case 'config': {
            const params: Record<string, string> = {};
            if (lan) params.lan = lan;
            return okList(await apiGet('/api/v2/signal/signalAlertConf', params), parseMax(_max_items, 20));
          }
          case 'alert_list':
            return ok(await apiGet('/api/v2/signal/getSignalAlertSetList'));
          case 'change': {
            const params: Record<string, string> = {};
            if (type) params.type = type;
            if (currency) params.currency = currency;
            return okList(await apiGet('/api/v2/signal/changeSignal', params), parseMax(_max_items, 50));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #29 signal_manage
  server.tool(
    'signal_manage',
    'Manage signal alerts.\n• add — create new alert. Requires: subType + symbol\n• delete — remove alert. Requires: id',
    {
      action: z.enum(['add', 'delete']).describe('add: create new alert; delete: remove alert by ID'),
      id: z.string().optional().describe('REQUIRED for delete. Signal alert ID'),
      subType: z.string().optional().describe('REQUIRED for add. Alert sub type'),
      symbol: z.string().optional().describe('REQUIRED for add. Trading pair symbol'),
      remark: z.string().optional().describe('For add: alert remark/note'),
    },
    async ({ action, id, subType, symbol, remark }) => {
      try {
        switch (action) {
          case 'add': {
            if (!subType || !symbol) return err('subType and symbol are required for add action');
            const params: Record<string, string> = { subType, symbol };
            if (remark) params.remark = remark;
            return ok(await apiGet('/api/v2/signal/addSignalAlert', params));
          }
          case 'delete': {
            if (!id) return err('id is required for delete action');
            return ok(await apiGet('/api/v2/signal/delSignalAlert', { id }));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );
}
