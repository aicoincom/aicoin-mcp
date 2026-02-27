/**
 * Hyperliquid-specific tools
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet, apiPost } from '../client/api.js';
import { ok, okList, err, maxItemsParam, parseMax } from './utils.js';

export function registerHyperliquidTools(
  server: McpServer
) {
  server.tool(
    'hl_get_tickers',
    'Get Hyperliquid ticker data (truncated to top 50, use hl_get_ticker_by_coin for specific coin)',
    { ...maxItemsParam },
    async ({ _max_items }) => {
      try {
        return okList(
          await apiGet('/api/upgrade/v2/hl/tickers'),
          parseMax(_max_items, 50)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_ticker_by_coin',
    'Get Hyperliquid ticker for a specific coin',
    {
      coin: z
        .string()
        .describe('Coin symbol, e.g. BTC, ETH'),
    },
    async ({ coin }) => {
      try {
        return ok(
          await apiGet(`/api/upgrade/v2/hl/tickers/coin/${coin}`)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_whale_positions',
    'Get Hyperliquid whale open positions',
    {
      coin: z
        .string()
        .optional()
        .describe('Coin filter, e.g. BTC'),
      min_usd: z
        .string()
        .optional()
        .describe('Min position size in USD'),
      ...maxItemsParam,
    },
    async ({ coin, min_usd, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        if (min_usd) params.min_usd = min_usd;
        return okList(
          await apiGet(
            '/api/upgrade/v2/hl/whales/open-positions',
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
    'hl_get_liquidations',
    'Get Hyperliquid liquidation history',
    {
      coin: z
        .string()
        .optional()
        .describe('Coin filter'),
      ...maxItemsParam,
    },
    async ({ coin, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        return okList(
          await apiGet(
            '/api/upgrade/v2/hl/liquidations/history',
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
    'hl_get_trader_stats',
    'Get Hyperliquid trader statistics by address',
    {
      address: z
        .string()
        .describe('Wallet address, e.g. 0x...'),
    },
    async ({ address }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/traders/${address}/addr-stat`
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_info',
    'Generic Hyperliquid Info API (supports all info types)',
    {
      type: z
        .string()
        .describe(
          'Info type, e.g. metaAndAssetCtxs, ' +
          'clearinghouseState, spotMeta, allMids, ' +
          'l2Book, openOrders, userFills, candleSnapshot'
        ),
      user: z
        .string()
        .optional()
        .describe('User wallet address (for user-specific queries)'),
      extra_params: z
        .string()
        .optional()
        .describe('Extra params as JSON string, e.g. {"coin":"BTC"}'),
      ...maxItemsParam,
    },
    async ({ type, user, extra_params, _max_items }) => {
      try {
        const body: Record<string, unknown> = { type };
        if (user) body.user = user;
        if (extra_params) {
          Object.assign(body, JSON.parse(extra_params));
        }
        return okList(
          await apiPost('/api/upgrade/v2/hl/info', body),
          parseMax(_max_items, 50)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_fills_by_address',
    'Get Hyperliquid user trade fills by wallet address',
    {
      address: z
        .string()
        .describe('Wallet address, e.g. 0x...'),
      ...maxItemsParam,
    },
    async ({ address, _max_items }) => {
      try {
        return okList(
          await apiGet(`/api/upgrade/v2/hl/fills/${address}`),
          parseMax(_max_items, 50)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_fills_by_oid',
    'Get Hyperliquid trade fills by order ID',
    {
      oid: z.string().describe('Order ID'),
    },
    async ({ oid }) => {
      try {
        return ok(
          await apiGet(`/api/upgrade/v2/hl/fills/oid/${oid}`)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_fills_by_twapid',
    'Get Hyperliquid trade fills by TWAP ID',
    {
      twapid: z.string().describe('TWAP ID'),
    },
    async ({ twapid }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/fills/twapid/${twapid}`
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_top_trades',
    'Get Hyperliquid top trades',
    {
      coin: z
        .string()
        .optional()
        .describe('Coin filter, e.g. BTC'),
      ...maxItemsParam,
    },
    async ({ coin, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        return okList(
          await apiGet(
            '/api/upgrade/v2/hl/fills/top-trades',
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
    'hl_get_filled_orders',
    'Get filled orders by wallet address',
    {
      address: z
        .string()
        .describe('Wallet address'),
      ...maxItemsParam,
    },
    async ({ address, _max_items }) => {
      try {
        return okList(
          await apiGet(
            `/api/upgrade/v2/hl/filled-orders/${address}/latest`
          ),
          parseMax(_max_items, 50)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_filled_order_by_oid',
    'Get filled order by order ID',
    {
      oid: z.string().describe('Order ID'),
    },
    async ({ oid }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/filled-orders/oid/${oid}`
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_orders',
    'Get latest orders by wallet address',
    {
      address: z
        .string()
        .describe('Wallet address'),
      ...maxItemsParam,
    },
    async ({ address, _max_items }) => {
      try {
        return okList(
          await apiGet(
            `/api/upgrade/v2/hl/orders/${address}/latest`
          ),
          parseMax(_max_items, 50)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_order_by_oid',
    'Get order by order ID',
    {
      oid: z.string().describe('Order ID'),
    },
    async ({ oid }) => {
      try {
        return ok(
          await apiGet(`/api/upgrade/v2/hl/orders/oid/${oid}`)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_top_open_orders',
    'Get top open orders on Hyperliquid',
    {
      coin: z
        .string()
        .optional()
        .describe('Coin filter'),
      ...maxItemsParam,
    },
    async ({ coin, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        return okList(
          await apiGet(
            '/api/upgrade/v2/hl/orders/top-open-orders',
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
    'hl_get_active_stats',
    'Get active order statistics',
    {
      coin: z
        .string()
        .optional()
        .describe('Coin filter'),
    },
    async ({ coin }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        return ok(
          await apiGet(
            '/api/upgrade/v2/hl/orders/active-stats',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_portfolio',
    'Get account value and PNL curves',
    {
      address: z.string().describe('Wallet address'),
      window: z
        .string()
        .describe(
          'Time window: day, week, month, allTime'
        ),
      ...maxItemsParam,
    },
    async ({ address, window: win, _max_items }) => {
      try {
        return okList(
          await apiGet(
            `/api/upgrade/v2/hl/portfolio/${address}/${win}`
          ),
          parseMax(_max_items, 100)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_pnls',
    'Get PNL curve data by address',
    {
      address: z.string().describe('Wallet address'),
      ...maxItemsParam,
    },
    async ({ address, _max_items }) => {
      try {
        return okList(
          await apiGet(`/api/upgrade/v2/hl/pnls/${address}`),
          parseMax(_max_items, 100)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_best_trades',
    'Get most profitable trades by address',
    {
      address: z.string().describe('Wallet address'),
      period: z
        .string()
        .describe('Period in days, e.g. 7, 30, 90'),
      limit: z
        .string()
        .optional()
        .describe('Max results, default 10'),
    },
    async ({ address, period, limit }) => {
      try {
        const params: Record<string, string> = {
          period,
        };
        if (limit) params.limit = limit;
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/traders/${address}/best-trades`,
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_performance_by_coin',
    'Get per-coin trading performance stats',
    {
      address: z.string().describe('Wallet address'),
      period: z
        .string()
        .describe('Period in days, e.g. 7, 30, 90'),
      limit: z
        .string()
        .optional()
        .describe('Max results, default 10'),
    },
    async ({ address, period, limit }) => {
      try {
        const params: Record<string, string> = {
          period,
        };
        if (limit) params.limit = limit;
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/traders/${address}/performance-by-coin`,
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_completed_trades',
    'Get completed trades list by address',
    {
      address: z.string().describe('Wallet address'),
      ...maxItemsParam,
    },
    async ({ address, _max_items }) => {
      try {
        return okList(
          await apiGet(
            `/api/upgrade/v2/hl/traders/${address}/completed-trades`
          ),
          parseMax(_max_items, 50)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_current_position_history',
    'Get current position history for a coin',
    {
      address: z.string().describe('Wallet address'),
      coin: z.string().describe('Coin, e.g. BTC'),
    },
    async ({ address, coin }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/traders/${address}/current-position-history/${coin}`
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_completed_position_history',
    'Get completed position history for a coin',
    {
      address: z.string().describe('Wallet address'),
      coin: z.string().describe('Coin, e.g. BTC'),
    },
    async ({ address, coin }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/traders/${address}/completed-position-history/${coin}`
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_current_position_pnl',
    'Get current position PnL for a coin',
    {
      address: z.string().describe('Wallet address'),
      coin: z.string().describe('Coin, e.g. BTC'),
    },
    async ({ address, coin }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/traders/${address}/current-position-pnl/${coin}`
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_completed_position_pnl',
    'Get completed position PnL for a coin',
    {
      address: z.string().describe('Wallet address'),
      coin: z.string().describe('Coin, e.g. BTC'),
    },
    async ({ address, coin }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/traders/${address}/completed-position-pnl/${coin}`
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_current_position_executions',
    'Get current position execution trace',
    {
      address: z.string().describe('Wallet address'),
      coin: z.string().describe('Coin, e.g. BTC'),
    },
    async ({ address, coin }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/traders/${address}/current-position-executions/${coin}`
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_completed_position_executions',
    'Get completed position execution trace',
    {
      address: z.string().describe('Wallet address'),
      coin: z.string().describe('Coin, e.g. BTC'),
    },
    async ({ address, coin }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/traders/${address}/completed-position-executions/${coin}`
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_traders_accounts',
    'Batch query trader account info',
    {
      addresses: z
        .string()
        .describe('Addresses as JSON array string'),
    },
    async ({ addresses }) => {
      try {
        return ok(
          await apiPost('/api/upgrade/v2/hl/traders/accounts', {
            addresses: JSON.parse(addresses),
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_traders_statistics',
    'Batch query trader statistics',
    {
      addresses: z
        .string()
        .describe('Addresses as JSON array string'),
    },
    async ({ addresses }) => {
      try {
        return ok(
          await apiPost(
            '/api/upgrade/v2/hl/traders/statistics',
            { addresses: JSON.parse(addresses) }
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_whale_events',
    'Get latest whale position events',
    {
      coin: z
        .string()
        .optional()
        .describe('Coin filter'),
      ...maxItemsParam,
    },
    async ({ coin, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        return okList(
          await apiGet(
            '/api/upgrade/v2/hl/whales/latest-events',
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
    'hl_get_whale_directions',
    'Get whale position long/short counts',
    {
      coin: z
        .string()
        .optional()
        .describe('Coin filter'),
    },
    async ({ coin }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        return ok(
          await apiGet(
            '/api/upgrade/v2/hl/whales/directions',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_whale_history_long_ratio',
    'Get historical whale long/short ratio',
    {
      coin: z
        .string()
        .optional()
        .describe('Coin filter'),
      ...maxItemsParam,
    },
    async ({ coin, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        return okList(
          await apiGet(
            '/api/upgrade/v2/hl/whales/history-long-ratio',
            params
          ),
          parseMax(_max_items, 100)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_liquidation_stats',
    'Get Hyperliquid liquidation statistics',
    {},
    async () => {
      try {
        return ok(
          await apiGet('/api/upgrade/v2/hl/liquidations/stat')
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_liquidation_stats_by_coin',
    'Get liquidation statistics by coin',
    {
      coin: z
        .string()
        .optional()
        .describe('Coin filter'),
    },
    async ({ coin }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        return ok(
          await apiGet(
            '/api/upgrade/v2/hl/liquidations/stat-by-coin',
            params
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_liquidation_top_positions',
    'Get top liquidated positions',
    {
      coin: z
        .string()
        .optional()
        .describe('Coin filter'),
      ...maxItemsParam,
    },
    async ({ coin, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        return okList(
          await apiGet(
            '/api/upgrade/v2/hl/liquidations/top-positions',
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
    'hl_smart_find',
    'Discover smart money addresses on Hyperliquid',
    {
      params_json: z
        .string()
        .describe('Search params as JSON string'),
    },
    async ({ params_json }) => {
      try {
        return ok(
          await apiPost(
            '/api/upgrade/v2/hl/smart/find',
            JSON.parse(params_json)
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_discover_traders',
    'Discover traders by criteria',
    {
      params_json: z
        .string()
        .describe('Discovery params as JSON string'),
    },
    async ({ params_json }) => {
      try {
        return ok(
          await apiPost(
            '/api/upgrade/v2/hl/traders/discover',
            JSON.parse(params_json)
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_twap_states',
    'Get TWAP order states by address',
    {
      address: z
        .string()
        .describe('Wallet address'),
    },
    async ({ address }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/twap-states/${address}/latest`
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_max_drawdown',
    'Get max drawdown data by address',
    {
      address: z
        .string()
        .describe('Wallet address'),
      days: z
        .string()
        .describe('Number of days, e.g. 7, 30, 90'),
    },
    async ({ address, days }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/max-drawdown/${address}`,
            { days }
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_net_flow',
    'Get ledger net flow by address',
    {
      address: z
        .string()
        .describe('Wallet address'),
      days: z
        .string()
        .describe('Number of days, e.g. 7, 30, 90'),
    },
    async ({ address, days }) => {
      try {
        return ok(
          await apiGet(
            `/api/upgrade/v2/hl/ledger-updates/net-flow/${address}`,
            { days }
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    'hl_get_klines_with_taker_vol',
    'Get K-line data with taker volume',
    {
      coin: z
        .string()
        .describe('Coin, e.g. BTC'),
      interval: z
        .string()
        .describe('Interval, e.g. 1h, 4h, 1d'),
      ...maxItemsParam,
    },
    async ({ coin, interval, _max_items }) => {
      try {
        return okList(
          await apiGet(
            `/api/upgrade/v2/hl/klines-with-taker-vol/${coin}/${interval}`
          ),
          parseMax(_max_items, 100)
        );
      } catch (e) {
        return err(e);
      }
    }
  );
}