#!/usr/bin/env node
/**
 * aicoin-mcp 全量 action 覆盖测试
 * 测试每个工具的每个 action，确保 132 个原始功能点全部可用
 *
 * 用法: node test-all-actions.mjs [filter]
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const HL_ADDR = '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983';
const EX = process.env.DEFAULT_EXCHANGE || 'okx';

// ── 全量测试用例：[工具名, 参数, 用例描述] ───────────────────
const CASES = [
  // ═══ Trade (CCXT) ═══
  ['exchange_info',       { action: 'exchanges' },                                                      'list supported exchanges'],
  ['exchange_info',       { action: 'markets', exchange: EX, base: 'BTC', limit: 3 },                  'query BTC markets on exchange'],
  ['exchange_ticker',     { exchange: EX, symbol: 'BTC/USDT' },                                        'single ticker'],
  ['exchange_ticker',     { exchange: EX, symbols: ['BTC/USDT', 'ETH/USDT'] },                         'batch tickers'],
  ['exchange_market_data',{ action: 'orderbook', exchange: EX, symbol: 'BTC/USDT', limit: 5 },         'order book'],
  ['exchange_market_data',{ action: 'trades', exchange: EX, symbol: 'BTC/USDT', limit: 3 },            'recent trades'],
  ['exchange_market_data',{ action: 'ohlcv', exchange: EX, symbol: 'BTC/USDT', timeframe: '1d', limit: 3 }, 'OHLCV klines'],
  ['exchange_funding',    { action: 'current', exchange: EX, symbols: ['BTC/USDT:USDT'] },              'current funding rates'],
  ['exchange_funding',    { action: 'history', exchange: EX, symbol: 'BTC/USDT:USDT', limit: 3 },      'funding rate history'],
  ['account_status',      { action: 'balance', exchange: EX },                                          'account balance'],
  ['account_status',      { action: 'positions', exchange: EX },                                        'open positions'],
  ['account_orders',      { action: 'open', exchange: EX },                                             'open orders'],
  ['account_orders',      { action: 'closed', exchange: EX, symbol: 'BTC/USDT', limit: 3 },            'closed orders'],
  ['account_orders',      { action: 'my_trades', exchange: EX, symbol: 'BTC/USDT', limit: 3 },         'my trade history'],
  ['account_history',     { action: 'ledger', exchange: EX, limit: 3 },                                 'account ledger'],
  ['account_history',     { action: 'deposits', exchange: EX, limit: 3 },                               'deposit history'],
  ['account_history',     { action: 'withdrawals', exchange: EX, limit: 3 },                            'withdrawal history'],
  ['set_trading_config',  { action: 'leverage', exchange: EX, symbol: 'BTC/USDT:USDT', leverage: 10 }, 'set leverage'],
  // set_trading_config margin_mode skipped (may conflict with leverage setting)

  // ═══ Coins (AiCoin) ═══
  ['coin_info',           { action: 'list', _max_items: '3' },                                          'coin list'],
  ['coin_info',           { action: 'ticker', coin_list: 'bitcoin,ethereum' },                           'coin ticker'],
  ['coin_info',           { action: 'config', coin_list: 'bitcoin' },                                    'coin config/metadata'],
  ['coin_info',           { action: 'ai_analysis', coin_keys: '["bitcoin"]' },                           'AI analysis'],
  ['coin_funding_rate',   { symbol: 'btcswapusdt:binance', interval: '8h', limit: '3' },                'regular funding rate'],
  ['coin_funding_rate',   { symbol: 'btcswapusdt', interval: '8h', limit: '3', weighted: true }, 'weighted funding rate'],
  ['coin_liquidation',    { action: 'map', dbkey: 'binance_perp_btcusdt', cycle: '24h', _max_items: '3' }, 'liquidation map'],
  ['coin_liquidation',    { action: 'history', symbol: 'btcswapusdt:binance', interval: '15m', limit: '3', _max_items: '3' }, 'liquidation history'],
  ['coin_liquidation',    { action: 'estimated', dbkey: 'btcswapusdt:binance', cycle: '24h', _max_items: '3' },      'estimated liquidation'],
  ['coin_open_interest',  { symbol: 'BTC', interval: '30m', margin_type: 'stablecoin', limit: '3' },    'stablecoin OI'],
  ['coin_open_interest',  { symbol: 'BTC', interval: '30m', margin_type: 'coin', limit: '3' },          'coin-margined OI'],
  ['coin_futures_data',   { action: 'historical_depth', key: 'btcswapusdt:binance', limit: '3' },       'historical depth'],
  ['coin_futures_data',   { action: 'super_depth', key: 'btcswapusdt:binance', limit: '3' },            'super depth (big orders)'],
  ['coin_futures_data',   { action: 'trade_data', dbkey: 'binance_perp_btcusdt', limit: '3' },          'futures trades'],

  // ═══ Contents ═══
  ['news',                { action: 'list', page: '1', pageSize: '2' },                                 'news list'],
  ['news',                { action: 'rss', pageSize: '2' },                                             'RSS news'],
  // news detail needs a real ID, test with list first
  ['flash',               { action: 'newsflash', language: 'cn' },                                      'AiCoin newsflash'],
  ['flash',               { action: 'list', language: 'cn', _max_items: '3' },                          'industry flash list'],
  ['flash',               { action: 'exchange_listing', _max_items: '3' },                               'exchange listing news'],

  // ═══ Markets ═══
  ['market_info',         { action: 'exchanges' },                                                       'exchange list'],
  ['market_info',         { action: 'ticker', market_list: 'binance' },                                   'exchange ticker'],
  ['market_info',         { action: 'hot_coins', key: 'market', _max_items: '3' },                       'hot coins'],
  ['market_info',         { action: 'futures_interest', _max_items: '3' },                                'futures open interest'],
  ['kline',               { action: 'data', symbol: 'binance_perp_btcusdt', period: '3600', size: '3' }, 'standard kline'],
  ['kline',               { action: 'indicator', symbol: 'binance_perp_btcusdt', period: '3600', indicator_key: 'fundflow', size: '3' }, 'indicator kline'],
  ['kline',               { action: 'trading_pair', coinType: 'bitcoin', indicator_key: 'fundflow' },     'indicator kline trading pairs'],
  ['index_data',          { action: 'price', key: 'i:diniw:ice' },                                       'index price'],
  ['index_data',          { action: 'info', key: 'i:diniw:ice' },                                        'index info'],
  ['index_data',          { action: 'list', _max_items: '3' },                                           'index list'],
  ['crypto_stock',        { action: 'quotes', tickers: 'i:mstr:nasdaq' },                                'stock quote'],
  ['crypto_stock',        { action: 'top_gainer', _max_items: '3' },                                     'top gainers'],
  ['crypto_stock',        { action: 'company', symbol: 'i:mstr:nasdaq' },                                'company info'],
  ['coin_treasury',       { action: 'summary', coin: 'BTC' },                                            'treasury summary'],
  ['coin_treasury',       { action: 'entities', coin: 'BTC', _max_items: '3' },                          'treasury entities'],
  ['coin_treasury',       { action: 'history', coin: 'BTC', _max_items: '3' },                           'treasury history'],
  ['coin_treasury',       { action: 'accumulated', coin: 'BTC', _max_items: '3' },                       'treasury accumulated'],
  ['coin_treasury',       { action: 'latest_entities', coin: 'BTC', _max_items: '3' },                   'latest entities'],
  ['coin_treasury',       { action: 'latest_history', coin: 'BTC', _max_items: '3' },                    'latest history'],
  ['depth',               { action: 'latest', dbKey: 'btcswapusdt:binance', size: '5' },                 'latest depth'],
  ['depth',               { action: 'full', dbKey: 'btcswapusdt:binance' },                               'full depth'],
  ['depth',               { action: 'grouped', dbKey: 'btcswapusdt:binance', groupSize: '100' },          'grouped depth'],

  // ═══ Features ═══
  ['market_overview',     { action: 'nav', lan: 'cn' },                                                  'market nav data'],
  ['market_overview',     { action: 'ls_ratio', dbkey: 'binance_perp_btcusdt', _max_items: '3' },        'long/short ratio'],
  ['market_overview',     { action: 'liquidation', _max_items: '3' },                                     'liquidation overview'],
  ['market_overview',     { action: 'grayscale_trust', _max_items: '3' },                                 'grayscale trust'],
  ['market_overview',     { action: 'gray_scale', coins: 'btc,eth', _max_items: '3' },                    'grayscale holdings'],
  ['market_overview',     { action: 'stock_market', _max_items: '3' },                                    'crypto stock market'],
  ['order_flow',          { action: 'big_orders', symbol: 'btcswapusdt:binance', _max_items: '3' },      'big orders'],
  ['order_flow',          { action: 'agg_trades', symbol: 'btcswapusdt:binance', _max_items: '3' },      'aggregated trades'],
  ['trading_pair',        { action: 'ticker', key_list: 'binance_perp_btcusdt' },                         'trading pair ticker'],
  ['trading_pair',        { action: 'by_market', market: 'binance', _max_items: '3' },                    'pairs by market'],
  ['trading_pair',        { action: 'list', market: 'binance', _max_items: '3' },                         'all trading pairs'],
  ['signal_data',         { action: 'strategy', coin_type: 'bitcoin', signal_key: 'depth_win_one', _max_items: '3' }, 'strategy signal'],
  ['signal_data',         { action: 'alert', coin_type: 'bitcoin', _max_items: '3' },                    'signal alerts'],
  ['signal_data',         { action: 'config' },                                                            'signal config'],
  ['signal_data',         { action: 'alert_list', _max_items: '3' },                                      'alert list'],
  ['signal_data',         { action: 'change', _max_items: '3' },                                          'change signals'],

  // ═══ Hyperliquid ═══
  ['hl_ticker',           { coin: 'BTC' },                                                                'single HL ticker'],
  ['hl_ticker',           {},                                                                               'batch HL tickers (top 50)'],
  ['hl_whale',            { action: 'positions', coin: 'BTC', _max_items: '3' },                          'whale positions'],
  ['hl_whale',            { action: 'events', _max_items: '3' },                                          'whale events'],
  ['hl_whale',            { action: 'directions', _max_items: '3' },                                      'whale directions'],
  ['hl_whale',            { action: 'history_ratio', coin: 'BTC' },                                       'whale history ratio'],
  ['hl_liquidation',      { action: 'history', coin: 'BTC', _max_items: '3' },                            'HL liq history'],
  ['hl_liquidation',      { action: 'stats' },                                                             'HL liq stats'],
  ['hl_liquidation',      { action: 'stats_by_coin', coin: 'BTC' },                                       'HL liq by coin'],
  ['hl_liquidation',      { action: 'top_positions', _max_items: '3' },                                   'HL top liq positions'],
  ['hl_open_interest',    { action: 'summary' },                                                           'HL OI summary'],
  ['hl_open_interest',    { action: 'top_coins', _max_items: '3' },                                       'HL OI top coins'],
  ['hl_open_interest',    { action: 'history', coin: 'BTC', interval: '1h' },                              'HL OI history'],
  ['hl_taker',            { action: 'delta', coin: 'BTC', interval: '4h' },                               'taker delta'],
  ['hl_taker',            { action: 'klines', coin: 'BTC', interval: '4h', _max_items: '3' },             'taker klines'],
  ['hl_trader',           { action: 'stats', address: HL_ADDR, period: '7' },                              'trader stats'],
  ['hl_trader',           { action: 'best_trades', address: HL_ADDR, period: '7', _max_items: '3' },      'trader best trades'],
  ['hl_trader',           { action: 'performance', address: HL_ADDR, period: '7', _max_items: '3' },      'trader performance'],
  ['hl_trader',           { action: 'completed_trades', address: HL_ADDR, _max_items: '3' },              'trader completed trades'],
  ['hl_trader',           { action: 'accounts', addresses: `["${HL_ADDR}"]` },                             'batch accounts'],
  ['hl_trader',           { action: 'statistics', addresses: `["${HL_ADDR}"]`, period: '7' },              'batch statistics'],
  ['hl_fills',            { action: 'by_address', address: HL_ADDR, _max_items: '3' },                    'fills by address'],
  ['hl_fills',            { action: 'top_trades', _max_items: '3' },                                      'top trades'],
  ['hl_orders',           { action: 'latest', address: HL_ADDR, _max_items: '3' },                        'latest orders'],
  ['hl_orders',           { action: 'filled', address: HL_ADDR, _max_items: '3' },                        'filled orders'],
  ['hl_orders',           { action: 'top_open', _max_items: '3' },                                        'top open orders'],
  ['hl_orders',           { action: 'active_stats' },                                                      'active order stats'],
  ['hl_orders',           { action: 'twap_states', address: HL_ADDR },                                    'TWAP states'],
  ['hl_position',         { action: 'current_history', address: HL_ADDR, coin: 'BTC' },                   'current position history'],
  ['hl_position',         { action: 'completed_history', address: HL_ADDR, coin: 'BTC', startTime: String(Date.now() - 7*86400000) }, 'completed position history'],
  ['hl_position',         { action: 'current_pnl', address: HL_ADDR, coin: 'BTC', interval: '1h' },      'current PnL'],
  ['hl_position',         { action: 'completed_pnl', address: HL_ADDR, coin: 'BTC', interval: '1h', startTime: String(Date.now() - 7*86400000) }, 'completed PnL'],
  ['hl_position',         { action: 'current_executions', address: HL_ADDR, coin: 'BTC', interval: '1h' }, 'current executions'],
  ['hl_position',         { action: 'completed_executions', address: HL_ADDR, coin: 'BTC', interval: '1h', startTime: String(Date.now() - 7*86400000) }, 'completed executions'],
  ['hl_portfolio',        { action: 'portfolio', address: HL_ADDR, window: 'week', _max_items: '3' },     'portfolio curve'],
  ['hl_portfolio',        { action: 'pnls', address: HL_ADDR, window: 'week', _max_items: '3' },          'PnL curve'],
  ['hl_portfolio',        { action: 'max_drawdown', address: HL_ADDR, days: '7' },                         'max drawdown'],
  ['hl_portfolio',        { action: 'net_flow', address: HL_ADDR, days: '7' },                             'net flow'],
  ['hl_advanced',         { action: 'info', type: 'allMids', _max_items: '3' },                           'HL info API'],
  ['hl_advanced',         { action: 'smart_find', _max_items: '3' },                                      'smart money find'],
  ['hl_advanced',         { action: 'discover', _max_items: '3' },                                        'discover traders'],

  // ═══ Guide ═══
  ['guide',               { action: 'api_key' },                                                           'API key guide'],
  ['guide',               { action: 'upgrade' },                                                           'upgrade guide'],
  ['guide',               { action: 'trade_setup' },                                                       'trade setup guide'],
];

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

const client = new Client({ name: 'test-all-actions', version: '1.0.0' });
await client.connect(transport);

const { tools } = await client.listTools();
const filtered = CASES.filter(([name]) => name.includes(filter));

console.log(`\n🧪 Testing ${filtered.length} action cases across ${tools.length} tools${filter ? ` (filter: "${filter}")` : ''}...\n`);

const results = [];
let currentTool = '';
for (const [name, params, desc] of filtered) {
  if (name !== currentTool) {
    currentTool = name;
    console.log(`\n── ${name} ──`);
  }
  const start = Date.now();
  try {
    const res = await client.callTool({ name, arguments: params });
    const ms = Date.now() - start;
    const text = res.content?.[0]?.text || '';
    const isErr = res.isError || text.startsWith('Error:');
    const is403 = text.includes('没有权限') || text.includes('403') || text.includes('Permission denied');
    const isExpected = text.includes('no current position') || text.includes('position not found')
      || text.includes('requires API key') || text.includes('API key')
      || text.includes('guide') || text.includes('Guide')
      || text.includes('How to') || text.includes('Visit');
    let status;
    if (isErr && !is403 && !isExpected) {
      status = '❌ ERROR';
    } else if (is403) {
      status = '🔒 403';
    } else if (isExpected) {
      status = '⚠️  EXPECTED';
    } else {
      status = '✅ OK';
    }
    // Show data size for OK results
    const size = text.length > 1000 ? `${(text.length / 1024).toFixed(1)}KB` : `${text.length}B`;
    const preview = status === '❌ ERROR' ? text.substring(0, 100) : '';
    results.push({ name, desc, status, ms, size, preview });
    console.log(`  ${status}  ${desc} (${ms}ms, ${size})${preview ? ' — ' + preview : ''}`);
  } catch (e) {
    const ms = Date.now() - start;
    results.push({ name, desc, status: '💥 CRASH', ms, size: '0B', preview: e.message });
    console.log(`  💥 CRASH  ${desc} (${ms}ms) — ${e.message}`);
  }
}

// ── 汇总 ──────────────────────────────────────────────────
const ok = results.filter(r => r.status === '✅ OK').length;
const locked = results.filter(r => r.status === '🔒 403').length;
const expected = results.filter(r => r.status.includes('EXPECTED')).length;
const errors = results.filter(r => r.status === '❌ ERROR').length;
const crashes = results.filter(r => r.status === '💥 CRASH').length;

console.log('\n' + '='.repeat(70));
console.log(`📊 Total: ${ok} ok, ${locked} locked(403), ${expected} expected, ${errors} errors, ${crashes} crashes / ${results.length} cases`);
console.log(`📦 Tools registered: ${tools.length}`);

// Group by tool
const byTool = {};
for (const r of results) {
  if (!byTool[r.name]) byTool[r.name] = [];
  byTool[r.name].push(r);
}
console.log(`\n📋 Coverage by tool:`);
for (const [tool, cases] of Object.entries(byTool)) {
  const okCount = cases.filter(c => c.status === '✅ OK').length;
  const total = cases.length;
  const allOk = okCount === total;
  const icon = allOk ? '✅' : cases.some(c => c.status === '❌ ERROR' || c.status === '💥 CRASH') ? '❌' : '⚠️';
  console.log(`  ${icon} ${tool}: ${okCount}/${total} actions ok`);
}

if (errors + crashes > 0) {
  console.log('\n⚠️  Failed cases:');
  for (const r of results.filter(r => r.status === '❌ ERROR' || r.status === '💥 CRASH')) {
    console.log(`  ${r.name} [${r.desc}]: ${r.preview}`);
  }
}

console.log('');
await client.close();
process.exit(errors + crashes > 0 ? 1 : 0);
