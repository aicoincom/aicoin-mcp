#!/usr/bin/env node
/**
 * opendata-mcp 一键测试脚本
 * 用法: node test-tools.mjs [filter]
 *
 * 示例:
 *   node test-tools.mjs          # 测试全部工具
 *   node test-tools.mjs hl_      # 只测 Hyperliquid 工具
 *   node test-tools.mjs get_coin # 只测匹配的工具
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// ── 预设参数 ──────────────────────────────────────────────
// 每个工具的测试参数，未列出的工具用空参数 {} 调用
const PRESETS = {
  // Coins
  get_coin_list: { _max_items: '3' },
  get_coin_ticker: { coin_list: 'bitcoin' },
  get_coin_config: { coin_list: 'bitcoin' },
  get_ai_coin_analysis: { coin_keys: '["bitcoin"]', language: 'CN' },
  get_funding_rate_history: { symbol: 'btcswapusdt:binance', interval: '8h', limit: '3' },
  get_weighted_funding_rate_history: { symbol: 'btcswapusdt', interval: '8h', limit: '3' },
  get_liquidation_map: { dbkey: 'binance_perp_btcusdt', cycle: '24h', _max_items: '3' },
  get_liquidation_history: { symbol: 'btcswapusdt:binance', interval: '30m', limit: '3' },
  get_estimated_liquidation_history: { dbkey: 'btcswapusdt:binance', cycle: '24h', _max_items: '3' },
  get_aggregated_stablecoin_oi_history: { symbol: 'BTC', interval: '30m', limit: '3' },
  get_aggregated_coin_margin_oi_history: { symbol: 'BTC', interval: '30m', limit: '3' },
  get_historical_depth: { key: 'btcswapusdt:binance', limit: '3' },
  get_super_depth_history: { key: 'btcswapusdt:binance', limit: '3' },
  get_trade_data: { dbkey: 'binance_perp_btcusdt', limit: '3' },

  // Contents
  get_newsflash: { language: 'cn' },
  get_news_list: { page: '1', pageSize: '2' },
  get_news_detail: { id: '518864' },
  get_rss_news_list: { page: '1', pageSize: '2' },
  get_flash_list: { language: 'cn', _max_items: '3' },
  get_exchange_listing_flash: { language: 'cn', pageSize: '2' },

  // Markets
  get_kline_data: { symbol: 'binance_perp_btcusdt', period: '3600', size: '3' },
  get_market_ticker: { market_list: 'binance' },
  get_markets: {},
  get_futures_interest: { lan: 'cn', page: '1', pageSize: '3' },
  get_index_price: { key: 'i:diniw:ice' },
  get_index_info: { key: 'i:diniw:ice' },
  get_index_list: { _max_items: '3' },
  get_hot_tab_coins: { key: 'defi', _max_items: '3' },
  get_crypto_stock_quotes: { tickers: 'i:mstr:nasdaq' },
  get_crypto_stock_top_gainer: { us_stock: true, limit: 3 },
  get_crypto_company_info: { symbol: 'i:mstr:nasdaq' },
  get_indicator_kline_trading_pair: { coinType: 'BTC', indicator_key: 'fundflow' },
  get_indicator_kline_data: { symbol: 'binance_perp_btcusdt', indicator_key: 'fundflow', period: '3600', size: '3' },
  get_coin_treasury_entities: { coin: 'BTC', page: '1', page_size: '3' },
  get_coin_treasury_history: { coin: 'BTC', page: '1', page_size: '3' },
  get_coin_treasury_accumulated: { coin: 'BTC', interval: 'monthly' },
  get_latest_coin_treasury_entities: { coin: 'BTC', _max_items: '3' },
  get_latest_coin_treasury_history: { coin: 'BTC', _max_items: '3' },
  get_coin_treasury_summary: { coin: 'BTC' },
  get_latest_depth: { dbKey: 'btcswapusdt:binance', size: '5' },
  get_full_depth: { dbKey: 'btcswapusdt:binance', _max_items: '5' },
  get_full_depth_grouped: { dbKey: 'btcswapusdt:binance', groupSize: '100', _max_items: '5' },

  // Features
  get_ls_ratio: {},
  get_liquidation_data: { currency: 'usd', type: '1' },
  get_big_orders: { symbol: 'btcswapusdt:binance', _max_items: '3' },
  get_agg_trades: { symbol: 'btcswapusdt:binance', _max_items: '3' },
  get_trading_pair_ticker: { key_list: 'binance_perp_btcusdt' },
  get_strategy_signal: { coin_type: 'bitcoin', signal_key: 'depth_win_one', _max_items: '3' },
  get_nav: { lan: 'cn' },
  get_grayscale_trust: {},
  get_gray_scale: { coins: 'btc,eth' },
  get_stock_market: { _max_items: '3' },
  get_signal_alert: { _max_items: '3' },
  get_signal_alert_config: { lan: 'cn', _max_items: '3' },
  get_signal_alert_list: {},
  get_change_signal: { type: '1', currency: 'usd', _max_items: '3' },
  get_trading_pair: { market: 'binance', _max_items: '3' },
  get_trading_pairs: { market: 'binance', _max_items: '3' },
  // skip add/delete signal alert (side effects)

  // Hyperliquid
  hl_get_tickers: { _max_items: '3' },
  hl_get_ticker_by_coin: { coin: 'BTC' },
  hl_get_whale_positions: { coin: 'BTC', _max_items: '3' },
  hl_get_whale_events: { coin: 'BTC', _max_items: '3' },
  hl_get_whale_directions: { coin: 'BTC' },
  hl_get_whale_history_long_ratio: { coin: 'BTC', _max_items: '3' },
  hl_get_liquidations: { coin: 'BTC', _max_items: '3' },
  hl_get_liquidation_stats: {},
  hl_get_liquidation_stats_by_coin: { coin: 'BTC' },
  hl_get_liquidation_top_positions: { coin: 'BTC', _max_items: '3' },
  hl_get_oi_summary: {},
  hl_get_oi_top_coins: { limit: '3', _max_items: '3' },
  hl_get_oi_history: { coin: 'BTC', interval: '4h', _max_items: '3' },
  hl_get_accumulated_taker_delta: { coin: 'BTC', interval: '4h' },
  hl_get_klines_with_taker_vol: { coin: 'BTC', interval: '4h', _max_items: '3' },
  hl_get_trader_stats: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', period: '7' },
  hl_get_best_trades: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', period: '7' },
  hl_get_performance_by_coin: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', period: '7' },
  hl_get_fills_by_address: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', _max_items: '3' },
  hl_get_completed_trades: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', _max_items: '3' },
  hl_get_orders: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', _max_items: '3' },
  hl_get_filled_orders: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', _max_items: '3' },
  hl_get_top_trades: { coin: 'BTC', interval: '1d', _max_items: '3' },
  hl_get_top_open_orders: { coin: 'BTC', _max_items: '3' },
  hl_get_active_stats: { coin: 'BTC' },
  hl_get_portfolio: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', window: 'week', _max_items: '3' },
  hl_get_pnls: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', period: '7', _max_items: '3' },
  hl_get_max_drawdown: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', days: '7' },
  hl_get_net_flow: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', days: '7' },
  hl_info: { type: 'allMids', _max_items: '3' },
  hl_smart_find: { params_json: '{}', _max_items: '3' },
  hl_discover_traders: { params_json: '{}', _max_items: '3' },
  hl_get_fills_by_oid: { oid: '0' },
  hl_get_fills_by_twapid: { twapid: '0' },
  hl_get_filled_order_by_oid: { oid: '0' },
  hl_get_order_by_oid: { oid: '0' },
  hl_get_current_position_history: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', coin: 'BTC' },
  hl_get_completed_position_history: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', coin: 'BTC', endTime: String(Date.now()) },
  hl_get_current_position_pnl: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', coin: 'BTC', interval: '4h' },
  hl_get_completed_position_pnl: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', coin: 'BTC', interval: '4h', endTime: String(Date.now()) },
  hl_get_current_position_executions: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', coin: 'BTC', interval: '4h' },
  hl_get_completed_position_executions: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983', coin: 'BTC', interval: '4h', endTime: String(Date.now()) },
  hl_get_traders_accounts: { addresses: '["0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983"]' },
  hl_get_traders_statistics: { addresses: '["0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983"]' },
  hl_get_twap_states: { address: '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983' },

  // Guide (no API call, always works)
  guide_get_api_key: {},
  guide_upgrade_tier: {},
  guide_setup_ccxt_trade: {},
};

// ── 跳过列表（有副作用的工具）──────────────────────────────
const SKIP = new Set([
  'add_signal_alert',
  'delete_signal_alert',
]);

// ── 主流程 ────────────────────────────────────────────────
const filter = process.argv[2] || '';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['build/index.js'],
  env: {
    ...process.env,
    AICOIN_ACCESS_KEY_ID: process.env.AICOIN_ACCESS_KEY_ID || '',
    AICOIN_ACCESS_SECRET: process.env.AICOIN_ACCESS_SECRET || '',
  },
});

const client = new Client({ name: 'test-runner', version: '1.0.0' });
await client.connect(transport);

const { tools } = await client.listTools();
const filtered = tools
  .filter(t => t.name.includes(filter))
  .filter(t => !SKIP.has(t.name));

console.log(`\n🧪 Testing ${filtered.length}/${tools.length} tools${filter ? ` (filter: "${filter}")` : ''}...\n`);

const results = [];
for (const tool of filtered) {
  const params = PRESETS[tool.name] || {};
  const start = Date.now();
  try {
    const res = await client.callTool({ name: tool.name, arguments: params });
    const ms = Date.now() - start;
    const text = res.content?.[0]?.text || '';
    const isErr = res.isError || text.startsWith('Error:');
    const is403 = text.includes('没有权限') || text.includes('403');
    const isExpected = text.includes('no current position') || text.includes('position not found');
    let status, preview;
    if (isErr && !is403 && !isExpected) {
      status = '❌ ERROR';
      preview = text.substring(0, 120);
    } else if (is403) {
      status = '🔒 403';
      preview = 'needs higher tier';
    } else if (isExpected) {
      status = '⚠️ EXPECTED';
      preview = 'no current position (valid response)';
    } else {
      status = '✅ OK';
      preview = text.substring(0, 120);
    }
    results.push({ name: tool.name, status, ms, preview });
    console.log(`${status}  ${tool.name} (${ms}ms)`);
  } catch (e) {
    const ms = Date.now() - start;
    results.push({ name: tool.name, status: '💥 CRASH', ms, preview: e.message });
    console.log(`💥 CRASH  ${tool.name} (${ms}ms) - ${e.message}`);
  }
}

// ── 汇总 ──────────────────────────────────────────────────
const ok_count = results.filter(r => r.status === '✅ OK').length;
const locked = results.filter(r => r.status === '🔒 403').length;
const expected = results.filter(r => r.status === '⚠️ EXPECTED').length;
const errors = results.filter(r => r.status === '❌ ERROR').length;
const crashes = results.filter(r => r.status === '💥 CRASH').length;

console.log('\n' + '='.repeat(60));
console.log(`📊 Results: ${ok_count} ok, ${locked} locked(403), ${expected} expected, ${errors} errors, ${crashes} crashes / ${results.length} total`);

if (errors + crashes > 0) {
  console.log('\n⚠️  Failed tools:');
  for (const r of results.filter(r => r.status === '❌ ERROR' || r.status === '💥 CRASH')) {
    console.log(`  ${r.name}: ${r.preview}`);
  }
}

console.log('');
await client.close();
process.exit(errors + crashes > 0 ? 1 : 0);
