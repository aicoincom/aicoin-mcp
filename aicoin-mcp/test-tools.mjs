#!/usr/bin/env node
/**
 * aicoin-mcp 一键测试脚本
 * 用法: node test-tools.mjs [filter]
 *
 * 示例:
 *   node test-tools.mjs          # 测试全部工具
 *   node test-tools.mjs hl_      # 只测 Hyperliquid 工具
 *   node test-tools.mjs trade    # 只测交易工具
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const HL_ADDR = '0x1fa75e3b47acbf1a0b14ed446119e24dbbe8e983';
const EX = process.env.DEFAULT_EXCHANGE || 'okx';

// ── 预设参数 ──────────────────────────────────────────────
const PRESETS = {
  // === Trade (CCXT) ===
  exchange_info: { action: 'exchanges' },
  // exchange_info markets requires network, skip in default
  exchange_ticker: { exchange: EX, symbol: 'BTC/USDT' },
  exchange_market_data: { action: 'ohlcv', exchange: EX, symbol: 'BTC/USDT', timeframe: '1d', limit: 3 },
  exchange_funding: { action: 'history', exchange: EX, symbol: 'BTC/USDT:USDT', limit: 3 },
  account_status: { action: 'balance', exchange: EX },
  account_orders: { action: 'open', exchange: EX },
  account_history: { action: 'ledger', exchange: EX, limit: 3 },
  // create_order - skip (side effect)
  // cancel_order - skip (side effect)
  set_trading_config: { action: 'leverage', exchange: EX, symbol: 'BTC/USDT:USDT', leverage: 10 },
  // transfer - skip (side effect)

  // === Coins ===
  coin_info: { action: 'list', _max_items: '3' },
  coin_funding_rate: { symbol: 'btcswapusdt:binance', interval: '8h', limit: '3' },
  coin_liquidation: { action: 'map', dbkey: 'binance_perp_btcusdt', cycle: '24h', _max_items: '3' },
  coin_open_interest: { symbol: 'BTC', interval: '30m', margin_type: 'stablecoin', limit: '3' },
  coin_futures_data: { action: 'trade_data', dbkey: 'binance_perp_btcusdt', limit: '3' },

  // === Contents ===
  news: { action: 'list', page: '1', pageSize: '2' },
  flash: { action: 'newsflash', language: 'cn' },

  // === Markets ===
  market_info: { action: 'exchanges' },
  kline: { action: 'data', symbol: 'binance_perp_btcusdt', period: '3600', size: '3' },
  index_data: { action: 'price', key: 'i:diniw:ice' },
  crypto_stock: { action: 'quotes', tickers: 'i:mstr:nasdaq' },
  coin_treasury: { action: 'summary', coin: 'BTC' },
  depth: { action: 'latest', dbKey: 'btcswapusdt:binance', size: '5' },

  // === Features ===
  market_overview: { action: 'nav', lan: 'cn' },
  order_flow: { action: 'big_orders', symbol: 'btcswapusdt:binance', _max_items: '3' },
  trading_pair: { action: 'ticker', key_list: 'binance_perp_btcusdt' },
  signal_data: { action: 'strategy', coin_type: 'bitcoin', signal_key: 'depth_win_one', _max_items: '3' },
  // signal_manage - skip (side effects)

  // === Hyperliquid ===
  hl_ticker: { coin: 'BTC' },
  hl_whale: { action: 'positions', coin: 'BTC', _max_items: '3' },
  hl_liquidation: { action: 'history', coin: 'BTC', _max_items: '3' },
  hl_open_interest: { action: 'summary' },
  hl_taker: { action: 'delta', coin: 'BTC', interval: '4h' },
  hl_trader: { action: 'stats', address: HL_ADDR, period: '7' },
  hl_fills: { action: 'by_address', address: HL_ADDR, _max_items: '3' },
  hl_orders: { action: 'latest', address: HL_ADDR, _max_items: '3' },
  hl_position: { action: 'current_history', address: HL_ADDR, coin: 'BTC' },
  hl_portfolio: { action: 'portfolio', address: HL_ADDR, window: 'week', _max_items: '3' },
  hl_advanced: { action: 'info', type: 'allMids', _max_items: '3' },

  // === Guide ===
  guide: { action: 'api_key' },
};

// ── 跳过列表（有副作用的工具）──────────────────────────────
const SKIP = new Set([
  'create_order',
  'cancel_order',
  'transfer',
  'signal_manage',
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
    const isExpected = text.includes('no current position') || text.includes('position not found')
      || text.includes('requires API key') || text.includes('API key');
    let status, preview;
    if (isErr && !is403 && !isExpected) {
      status = '❌ ERROR';
      preview = text.substring(0, 120);
    } else if (is403) {
      status = '🔒 403';
      preview = 'needs higher tier';
    } else if (isExpected) {
      status = '⚠️ EXPECTED';
      preview = text.substring(0, 80);
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
console.log(`📦 Total tools registered: ${tools.length}`);

if (errors + crashes > 0) {
  console.log('\n⚠️  Failed tools:');
  for (const r of results.filter(r => r.status === '❌ ERROR' || r.status === '💥 CRASH')) {
    console.log(`  ${r.name}: ${r.preview}`);
  }
}

console.log('');
await client.close();
process.exit(errors + crashes > 0 ? 1 : 0);
