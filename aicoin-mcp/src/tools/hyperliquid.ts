/**
 * Hyperliquid-specific tools
 * #30 hl_ticker (2→1): hl_get_tickers + hl_get_ticker_by_coin
 * #31 hl_whale (4→1): whale positions + events + directions + history_ratio
 * #32 hl_liquidation (4→1): history + stats + stats_by_coin + top_positions
 * #33 hl_open_interest (3→1): summary + top_coins + history
 * #34 hl_taker (2→1): accumulated_taker_delta + klines_with_taker_vol
 * #35 hl_trader (6→1): stats + best_trades + performance + completed_trades + accounts + statistics
 * #36 hl_fills (4→1): by_address + by_oid + by_twapid + top_trades
 * #37 hl_orders (7→1): latest + by_oid + filled + filled_by_oid + top_open + active_stats + twap_states
 * #38 hl_position (6→1): current_history + completed_history + current_pnl + completed_pnl + current_executions + completed_executions
 * #39 hl_portfolio (4→1): portfolio + pnls + max_drawdown + net_flow
 * #40 hl_advanced (3→1): info + smart_find + discover
 */
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet, apiPost } from '../client/api.js';
import { ok, okList, err, maxItemsParam, parseMax } from './utils.js';

export function registerHyperliquidTools(server: McpServer) {
  // #30 hl_ticker
  server.tool(
    'hl_ticker',
    'Hyperliquid tickers. If coin provided, returns single ticker; otherwise returns all tickers.',
    {
      coin: z.string().optional().describe('Optional. Coin symbol in uppercase, e.g. BTC, ETH. Omit to get all tickers'),
      ...maxItemsParam,
    },
    async ({ coin, _max_items }) => {
      try {
        if (coin) {
          return ok(await apiGet(`/api/upgrade/v2/hl/tickers/coin/${coin}`));
        }
        return okList(await apiGet('/api/upgrade/v2/hl/tickers'), parseMax(_max_items, 50));
      } catch (e) {
        return err(e);
      }
    }
  );

  // #31 hl_whale
  server.tool(
    'hl_whale',
    'Hyperliquid whale data. All actions support optional coin filter.\n• positions — whale open positions\n• events — latest whale events\n• directions — long/short counts\n• history_ratio — historical long ratio',
    {
      action: z.enum(['positions', 'events', 'directions', 'history_ratio']).describe(
        'positions: whale open positions; events: latest whale events; directions: long/short counts; history_ratio: historical long ratio'
      ),
      coin: z.string().optional().describe('Optional. Coin filter in uppercase, e.g. BTC'),
      min_usd: z.string().optional().describe('Optional for positions. Min position size in USD'),
      ...maxItemsParam,
    },
    async ({ action, coin, min_usd, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        switch (action) {
          case 'positions': {
            if (min_usd) params.min_usd = min_usd;
            return okList(
              await apiGet('/api/upgrade/v2/hl/whales/open-positions', params),
              parseMax(_max_items, 50)
            );
          }
          case 'events':
            return okList(
              await apiGet('/api/upgrade/v2/hl/whales/latest-events', params),
              parseMax(_max_items, 50)
            );
          case 'directions':
            return ok(await apiGet('/api/upgrade/v2/hl/whales/directions', params));
          case 'history_ratio':
            return okList(
              await apiGet('/api/upgrade/v2/hl/whales/history-long-ratio', params),
              parseMax(_max_items, 30)
            );
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #32 hl_liquidation
  server.tool(
    'hl_liquidation',
    'Hyperliquid liquidation data. All actions support optional coin filter.\n• history — liquidation history\n• stats — aggregate stats\n• stats_by_coin — per-coin stats\n• top_positions — top liquidated positions. Requires: coin + interval',
    {
      action: z.enum(['history', 'stats', 'stats_by_coin', 'top_positions']).describe(
        'history: liquidation history; stats: aggregate stats; stats_by_coin: per-coin stats; top_positions: top liquidated'
      ),
      coin: z.string().optional().describe('Optional. Coin filter in uppercase, e.g. BTC. REQUIRED for top_positions'),
      interval: z.string().optional().describe('REQUIRED for top_positions. Interval: 4h, 1d'),
      limit: z.string().optional().describe('Optional for top_positions. Max results'),
      ...maxItemsParam,
    },
    async ({ action, coin, interval, limit, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (coin) params.coin = coin;
        switch (action) {
          case 'history':
            return okList(
              await apiGet('/api/upgrade/v2/hl/liquidations/history', params),
              parseMax(_max_items, 50)
            );
          case 'stats':
            return ok(await apiGet('/api/upgrade/v2/hl/liquidations/stat'));
          case 'stats_by_coin':
            return ok(await apiGet('/api/upgrade/v2/hl/liquidations/stat-by-coin', params));
          case 'top_positions': {
            if (!coin) return err('coin is required for top_positions action');
            if (!interval) return err('interval is required for top_positions action (e.g. "4h", "1d")');
            const tpParams: Record<string, string> = { coin, interval };
            if (limit) tpParams.limit = limit;
            return okList(
              await apiGet('/api/upgrade/v2/hl/liquidations/top-positions', tpParams),
              parseMax(_max_items, 50)
            );
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #33 hl_open_interest
  server.tool(
    'hl_open_interest',
    'Hyperliquid open interest.\n• summary — overall OI summary, no params needed\n• top_coins — top coins ranked by OI\n• history — per-coin OI history. Requires: coin',
    {
      action: z.enum(['summary', 'top_coins', 'history']).describe(
        'summary: overall OI summary; top_coins: top coins by OI; history: per-coin OI history'
      ),
      coin: z.string().optional().describe('REQUIRED for history. Coin in uppercase, e.g. BTC'),
      interval: z.string().optional().describe('Optional for history. Time window: 4h, 1d, etc.'),
      limit: z.string().optional().describe('Optional for top_coins. Number of coins to return'),
      ...maxItemsParam,
    },
    async ({ action, coin, interval, limit, _max_items }) => {
      try {
        switch (action) {
          case 'summary':
            return ok(await apiGet('/api/upgrade/v2/hl/open-interest/summary'));
          case 'top_coins': {
            const params: Record<string, string> = {};
            if (limit) params.limit = limit;
            return okList(
              await apiGet('/api/upgrade/v2/hl/open-interest/top-coins', params),
              parseMax(_max_items, 50)
            );
          }
          case 'history': {
            if (!coin) return err('coin is required for history action');
            const params: Record<string, string> = {};
            if (interval) params.interval = interval;
            return okList(
              await apiGet(`/api/upgrade/v2/hl/open-interest/history/${coin}`, params),
              parseMax(_max_items, 50)
            );
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #34 hl_taker
  server.tool(
    'hl_taker',
    'Hyperliquid taker data. Requires: coin for all actions.\n• delta — accumulated taker buy/sell delta\n• klines — K-lines with taker volume',
    {
      action: z.enum(['delta', 'klines']).describe(
        'delta: accumulated taker buy/sell delta; klines: K-lines with taker volume'
      ),
      coin: z.string().describe('REQUIRED. Coin in uppercase, e.g. BTC, ETH'),
      interval: z.string().optional().describe('Optional. Time window: 15m, 4h, 1d. Default 4h for klines'),
      ...maxItemsParam,
    },
    async ({ action, coin, interval, _max_items }) => {
      try {
        const params: Record<string, string> = {};
        if (interval) params.interval = interval;
        switch (action) {
          case 'delta':
            return ok(await apiGet(`/api/upgrade/v2/hl/accumulated-taker-delta/${coin}`, params));
          case 'klines':
            return okList(
              await apiGet(`/api/upgrade/v2/hl/klines-with-taker-vol/${coin}/${interval || '4h'}`),
              parseMax(_max_items, 30)
            );
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #35 hl_trader
  server.tool(
    'hl_trader',
    'Hyperliquid trader analytics.\n• stats — trader stats. Requires: address\n• best_trades — most profitable trades. Requires: address + period\n• performance — per-coin performance. Requires: address + period\n• completed_trades — completed trade list. Requires: address\n• accounts — batch account info. Requires: addresses (JSON array string)\n• statistics — batch stats. Requires: addresses (JSON array string)',
    {
      action: z.enum(['stats', 'best_trades', 'performance', 'completed_trades', 'accounts', 'statistics']).describe(
        'stats: trader stats; best_trades: most profitable; performance: per-coin performance; completed_trades: completed list; accounts: batch account info; statistics: batch stats'
      ),
      address: z.string().optional().describe('REQUIRED for stats, best_trades, performance, completed_trades. Single wallet address (0x...)'),
      addresses: z.string().optional().describe('REQUIRED for accounts, statistics. Must be a JSON array string, e.g. \'["0xabc...","0xdef..."]\'. NOT comma-separated'),
      period: z.string().optional().describe('REQUIRED for best_trades, performance. Optional for stats. Period in days: 7, 30, 90'),
      coin: z.string().optional().describe('Optional for completed_trades. Coin filter in uppercase, e.g. BTC'),
      limit: z.string().optional().describe('Max results'),
      ...maxItemsParam,
    },
    async ({ action, address, addresses, period, coin, limit, _max_items }) => {
      try {
        switch (action) {
          case 'stats': {
            if (!address) return err('address is required for stats action');
            const params: Record<string, string> = {};
            if (period) params.period = period;
            return ok(await apiGet(`/api/upgrade/v2/hl/traders/${address}/addr-stat`, params));
          }
          case 'best_trades': {
            if (!address || !period) return err('address and period are required for best_trades action');
            const params: Record<string, string> = { period };
            if (limit) params.limit = limit;
            return ok(await apiGet(`/api/upgrade/v2/hl/traders/${address}/best-trades`, params));
          }
          case 'performance': {
            if (!address || !period) return err('address and period are required for performance action');
            const params: Record<string, string> = { period };
            if (limit) params.limit = limit;
            return ok(await apiGet(`/api/upgrade/v2/hl/traders/${address}/performance-by-coin`, params));
          }
          case 'completed_trades': {
            if (!address) return err('address is required for completed_trades action');
            const params: Record<string, string> = {};
            if (coin) params.coin = coin;
            if (limit) params.limit = limit;
            return okList(
              await apiGet(`/api/upgrade/v2/hl/traders/${address}/completed-trades`, params),
              parseMax(_max_items, 50)
            );
          }
          case 'accounts': {
            if (!addresses) return err('addresses is required for accounts action');
            return ok(await apiPost('/api/upgrade/v2/hl/traders/accounts', {
              addresses: JSON.parse(addresses),
            }));
          }
          case 'statistics': {
            if (!addresses) return err('addresses is required for statistics action');
            return ok(await apiPost('/api/upgrade/v2/hl/traders/statistics', {
              addresses: JSON.parse(addresses),
            }));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #36 hl_fills
  server.tool(
    'hl_fills',
    'Hyperliquid trade fills.\n• by_address — fills by wallet. Requires: address\n• by_oid — fills by order ID. Requires: oid\n• by_twapid — fills by TWAP ID. Requires: twapid\n• top_trades — top trades. Requires: interval + coin',
    {
      action: z.enum(['by_address', 'by_oid', 'by_twapid', 'top_trades']).describe(
        'by_address: fills by wallet; by_oid: fills by order ID; by_twapid: fills by TWAP ID; top_trades: top trades'
      ),
      address: z.string().optional().describe('REQUIRED for by_address. Wallet address (0x...)'),
      oid: z.string().optional().describe('REQUIRED for by_oid. Order ID'),
      twapid: z.string().optional().describe('REQUIRED for by_twapid. TWAP ID'),
      coin: z.string().optional().describe('Optional. Coin filter in uppercase, e.g. BTC. REQUIRED for top_trades'),
      interval: z.string().optional().describe('REQUIRED for top_trades. Interval: 4h, 1d'),
      limit: z.string().optional().describe('Max results'),
      ...maxItemsParam,
    },
    async ({ action, address, oid, twapid, coin, interval, limit, _max_items }) => {
      try {
        switch (action) {
          case 'by_address': {
            if (!address) return err('address is required for by_address action');
            const params: Record<string, string> = {};
            if (coin) params.coin = coin;
            if (limit) params.limit = limit;
            return okList(
              await apiGet(`/api/upgrade/v2/hl/fills/${address}`, params),
              parseMax(_max_items, 50)
            );
          }
          case 'by_oid': {
            if (!oid) return err('oid is required for by_oid action');
            return ok(await apiGet(`/api/upgrade/v2/hl/fills/oid/${oid}`));
          }
          case 'by_twapid': {
            if (!twapid) return err('twapid is required for by_twapid action');
            return ok(await apiGet(`/api/upgrade/v2/hl/fills/twapid/${twapid}`));
          }
          case 'top_trades': {
            if (!coin) return err('coin is required for top_trades action');
            if (!interval) return err('interval is required for top_trades action (e.g. "4h", "1d")');
            const params: Record<string, string> = { coin, interval };
            if (limit) params.limit = limit;
            return okList(
              await apiGet('/api/upgrade/v2/hl/fills/top-trades', params),
              parseMax(_max_items, 50)
            );
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #37 hl_orders
  server.tool(
    'hl_orders',
    'Hyperliquid orders.\n• latest — latest orders. Requires: address\n• by_oid — single order. Requires: oid\n• filled — filled orders. Requires: address\n• filled_by_oid — filled order. Requires: oid\n• top_open — top open orders\n• active_stats — active order stats\n• twap_states — TWAP states. Requires: address',
    {
      action: z.enum(['latest', 'by_oid', 'filled', 'filled_by_oid', 'top_open', 'active_stats', 'twap_states']).describe(
        'latest: latest orders by address; by_oid: order by ID; filled: filled orders; filled_by_oid: filled order by ID; top_open: top open orders; active_stats: active order stats; twap_states: TWAP states'
      ),
      address: z.string().optional().describe('REQUIRED for latest, filled, twap_states. Wallet address (0x...)'),
      oid: z.string().optional().describe('REQUIRED for by_oid, filled_by_oid. Order ID'),
      coin: z.string().optional().describe('Optional. Coin filter in uppercase'),
      min_val: z.string().optional().describe('Optional for top_open. Min order value in USD'),
      whale_threshold: z.string().optional().describe('Optional for active_stats. Whale threshold in USD'),
      limit: z.string().optional().describe('Max results'),
      ...maxItemsParam,
    },
    async ({ action, address, oid, coin, min_val, whale_threshold, limit, _max_items }) => {
      try {
        switch (action) {
          case 'latest': {
            if (!address) return err('address is required for latest action');
            const params: Record<string, string> = {};
            if (coin) params.coin = coin;
            if (limit) params.limit = limit;
            return okList(
              await apiGet(`/api/upgrade/v2/hl/orders/${address}/latest`, params),
              parseMax(_max_items, 50)
            );
          }
          case 'by_oid': {
            if (!oid) return err('oid is required for by_oid action');
            return ok(await apiGet(`/api/upgrade/v2/hl/orders/oid/${oid}`));
          }
          case 'filled': {
            if (!address) return err('address is required for filled action');
            const params: Record<string, string> = {};
            if (coin) params.coin = coin;
            if (limit) params.limit = limit;
            return okList(
              await apiGet(`/api/upgrade/v2/hl/filled-orders/${address}/latest`, params),
              parseMax(_max_items, 50)
            );
          }
          case 'filled_by_oid': {
            if (!oid) return err('oid is required for filled_by_oid action');
            return ok(await apiGet(`/api/upgrade/v2/hl/filled-orders/oid/${oid}`));
          }
          case 'top_open': {
            const params: Record<string, string> = {};
            if (coin) params.coin = coin;
            if (min_val) params.min_val = min_val;
            if (limit) params.limit = limit;
            return okList(
              await apiGet('/api/upgrade/v2/hl/orders/top-open-orders', params),
              parseMax(_max_items, 50)
            );
          }
          case 'active_stats': {
            const params: Record<string, string> = {};
            if (coin) params.coin = coin;
            if (whale_threshold) params.whale_threshold = whale_threshold;
            return ok(await apiGet('/api/upgrade/v2/hl/orders/active-stats', params));
          }
          case 'twap_states': {
            if (!address) return err('address is required for twap_states action');
            return ok(await apiGet(`/api/upgrade/v2/hl/twap-states/${address}/latest`));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #38 hl_position
  server.tool(
    'hl_position',
    'Hyperliquid position data. Requires: address + coin for all actions.\n• current_history — current position history\n• completed_history — closed position history. Optional: startTime, endTime\n• current_pnl — current PnL. Requires: interval\n• completed_pnl — closed PnL. Requires: interval. Optional: startTime, endTime\n• current_executions — current execution trace. Requires: interval\n• completed_executions — closed execution trace. Requires: interval. Optional: startTime, endTime',
    {
      action: z.enum(['current_history', 'completed_history', 'current_pnl', 'completed_pnl', 'current_executions', 'completed_executions']).describe(
        'current_history: current position history; completed_history: closed position history; current_pnl/completed_pnl: PnL data; current_executions/completed_executions: execution trace'
      ),
      address: z.string().describe('REQUIRED. Wallet address (0x...)'),
      coin: z.string().describe('REQUIRED. Coin in uppercase, e.g. BTC'),
      interval: z.string().optional().describe('REQUIRED for current_pnl, completed_pnl, current_executions, completed_executions. Interval: 1h, 4h, 1d'),
      startTime: z.string().optional().describe('Optional for completed_* actions. Start time in ms'),
      endTime: z.string().optional().describe('Optional for completed_* actions. End time in ms'),
    },
    async ({ action, address, coin, interval, startTime, endTime }) => {
      try {
        switch (action) {
          case 'current_history':
            return ok(await apiGet(`/api/upgrade/v2/hl/traders/${address}/current-position-history/${coin}`));
          case 'completed_history': {
            const params: Record<string, string> = {};
            if (startTime) params.startTime = startTime;
            if (endTime) params.endTime = endTime;
            return ok(await apiGet(`/api/upgrade/v2/hl/traders/${address}/completed-position-history/${coin}`, params));
          }
          case 'current_pnl': {
            if (!interval) return err('interval is required for current_pnl action');
            return ok(await apiGet(`/api/upgrade/v2/hl/traders/${address}/current-position-pnl/${coin}`, { interval }));
          }
          case 'completed_pnl': {
            if (!interval) return err('interval is required for completed_pnl action');
            const params: Record<string, string> = { interval };
            if (startTime) params.startTime = startTime;
            if (endTime) params.endTime = endTime;
            return ok(await apiGet(`/api/upgrade/v2/hl/traders/${address}/completed-position-pnl/${coin}`, params));
          }
          case 'current_executions': {
            if (!interval) return err('interval is required for current_executions action');
            return ok(await apiGet(`/api/upgrade/v2/hl/traders/${address}/current-position-executions/${coin}`, { interval }));
          }
          case 'completed_executions': {
            if (!interval) return err('interval is required for completed_executions action');
            const params: Record<string, string> = { interval };
            if (startTime) params.startTime = startTime;
            if (endTime) params.endTime = endTime;
            return ok(await apiGet(`/api/upgrade/v2/hl/traders/${address}/completed-position-executions/${coin}`, params));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #39 hl_portfolio
  server.tool(
    'hl_portfolio',
    'Hyperliquid portfolio data. Requires: address for all actions.\n• portfolio — account value curve. Requires: window (NOT days)\n• pnls — PNL curve. Optional: period\n• max_drawdown — max drawdown. Requires: days (NOT window)\n• net_flow — ledger net flow. Requires: days (NOT window)',
    {
      action: z.enum(['portfolio', 'pnls', 'max_drawdown', 'net_flow']).describe(
        'portfolio: account value curve; pnls: PNL curve; max_drawdown: max drawdown; net_flow: ledger net flow'
      ),
      address: z.string().describe('REQUIRED. Wallet address (0x...)'),
      window: z.string().optional().describe('REQUIRED for portfolio ONLY. Time window: "day", "week", "month", "allTime". NOT used by max_drawdown/net_flow'),
      period: z.string().optional().describe('Optional for pnls. Period in days: 0=allTime, 1, 7, 30'),
      days: z.string().optional().describe('REQUIRED for max_drawdown, net_flow. Number of days: 7, 30, 90. NOT used by portfolio'),
      scope: z.string().optional().describe('Optional for max_drawdown. Scope: "perp" (default), "all"'),
      ...maxItemsParam,
    },
    async ({ action, address, window: win, period, days, scope, _max_items }) => {
      try {
        switch (action) {
          case 'portfolio': {
            if (!win) return err('window is required for portfolio action');
            return okList(
              await apiGet(`/api/upgrade/v2/hl/portfolio/${address}/${win}`),
              parseMax(_max_items, 30)
            );
          }
          case 'pnls': {
            const params: Record<string, string> = {};
            if (period) params.period = period;
            return okList(
              await apiGet(`/api/upgrade/v2/hl/pnls/${address}`, params),
              parseMax(_max_items, 100)
            );
          }
          case 'max_drawdown': {
            if (!days) return err('days is required for max_drawdown action');
            const params: Record<string, string> = { days, scope: scope || 'perp' };
            return ok(await apiGet(`/api/upgrade/v2/hl/max-drawdown/${address}`, params));
          }
          case 'net_flow': {
            if (!days) return err('days is required for net_flow action');
            return ok(await apiGet(`/api/upgrade/v2/hl/ledger-updates/net-flow/${address}`, { days }));
          }
        }
      } catch (e) {
        return err(e);
      }
    }
  );

  // #40 hl_advanced
  server.tool(
    'hl_advanced',
    'Hyperliquid advanced.\n• info — generic Hyperliquid Info API. Requires: type\n• smart_find — smart money discovery. Optional: params_json\n• discover — trader discovery. Optional: params_json',
    {
      action: z.enum(['info', 'smart_find', 'discover']).describe(
        'info: generic Hyperliquid Info API; smart_find: smart money addresses; discover: trader discovery'
      ),
      type: z.string().optional().describe('REQUIRED for info. Info type: metaAndAssetCtxs, clearinghouseState, allMids, etc.'),
      user: z.string().optional().describe('Optional for info. User wallet address (0x...)'),
      extra_params: z.string().optional().describe('Optional for info. Extra params as JSON string'),
      params_json: z.string().optional().describe('Optional for smart_find, discover. Search params as JSON string'),
      ...maxItemsParam,
    },
    async ({ action, type, user, extra_params, params_json, _max_items }) => {
      try {
        switch (action) {
          case 'info': {
            if (!type) return err('type is required for info action');
            const body: Record<string, unknown> = { type };
            if (user) body.user = user;
            if (extra_params) Object.assign(body, JSON.parse(extra_params));
            return okList(await apiPost('/api/upgrade/v2/hl/info', body), parseMax(_max_items, 20));
          }
          case 'smart_find':
            return okList(
              await apiPost('/api/upgrade/v2/hl/smart/find', JSON.parse(params_json || '{}')),
              parseMax(_max_items, 20)
            );
          case 'discover':
            return okList(
              await apiPost('/api/upgrade/v2/hl/traders/discover', JSON.parse(params_json || '{}')),
              parseMax(_max_items, 20)
            );
        }
      } catch (e) {
        return err(e);
      }
    }
  );
}
