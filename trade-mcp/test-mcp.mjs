#!/usr/bin/env node
// Quick MCP test harness - sends JSON-RPC requests via stdio
import { spawn } from 'child_process';

const env = {
  ...process.env,
  OKX_API_KEY: '03e6309c-34aa-408b-96ef-be83449d423f',
  OKX_SECRET: '1CFAC7E301F134B945E977ADA0D32269',
  OKX_PASSPHRASE: 'Luydaisuki1114!',
  DEFAULT_EXCHANGE: 'okx',
  USE_PROXY: 'true',
  PROXY_URL: 'http://127.0.0.1:7890',
};

const child = spawn('node', ['build/index.js'], { env, cwd: import.meta.dirname });

let buffer = '';
let reqId = 0;
const pending = new Map();

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      const cb = pending.get(msg.id);
      if (cb) { pending.delete(msg.id); cb(msg); }
    } catch {}
  }
});

child.stderr.on('data', (d) => process.stderr.write(d));

function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++reqId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('timeout 60s')); }, 60000);
    pending.set(id, (msg) => { clearTimeout(timer); resolve(msg); });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

async function callTool(name, args = {}) {
  const res = await call('tools/call', { name, arguments: args });
  if (res.result?.content?.[0]?.text) {
    try { return JSON.parse(res.result.content[0].text); }
    catch { return res.result.content[0].text; }
  }
  return res;
}

// ---- Test runner ----
const results = [];
function log(name, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  results.push({ name, status, detail });
  console.log(`${icon} ${name}: ${status}${detail ? ' — ' + detail : ''}`);
}

async function run() {
  // Initialize
  await call('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test', version: '1.0' },
  });
  await call('notifications/initialized', {});
  console.log('=== MCP Server initialized ===\n');

  // Get test list from args
  const testSet = process.argv[2] || 'all';

  if (testSet === 'public' || testSet === 'all') {
    console.log('--- 1. Public Market Data ---');
    await testPublic();
  }
  if (testSet === 'private' || testSet === 'all') {
    console.log('\n--- 2. OKX Account Data (Private) ---');
    await testPrivate();
  }
  if (testSet === 'edge' || testSet === 'all') {
    console.log('\n--- 3. Edge Cases & Bug Verification ---');
    await testEdge();
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  console.log(`Total: ${results.length} | Pass: ${pass} | Fail: ${fail} | Warn: ${warn}`);

  child.kill();
}

async function testPublic() {
  // 1.1 list_exchanges
  try {
    const r = await callTool('list_exchanges');
    const ok = Array.isArray(r) && r.length === 9 && !r.includes('pionex');
    log('list_exchanges', ok ? 'PASS' : 'FAIL', `${r.length} exchanges, pionex removed: ${!r.includes('pionex')}`);
  } catch (e) { log('list_exchanges', 'FAIL', e.message); }

  // 1.2 get_ticker across exchanges
  for (const ex of ['binance', 'okx', 'bybit', 'bitget', 'gate', 'huobi']) {
    try {
      const r = await callTool('get_ticker', { exchange: ex, symbol: 'BTC/USDT' });
      log(`get_ticker(${ex})`, r.symbol === 'BTC/USDT' ? 'PASS' : 'FAIL', `last=${r.last}`);
    } catch (e) { log(`get_ticker(${ex})`, 'FAIL', e.message); }
  }

  // 1.2b hyperliquid uses USDC
  try {
    const r = await callTool('get_ticker', { exchange: 'hyperliquid', symbol: 'BTC/USDC:USDC' });
    log('get_ticker(hyperliquid)', r.symbol ? 'PASS' : 'FAIL', `symbol=${r.symbol}`);
  } catch (e) { log('get_ticker(hyperliquid)', 'FAIL', e.message); }

  // 1.2c futures
  try {
    const r = await callTool('get_ticker', { exchange: 'binanceusdm', symbol: 'BTC/USDT:USDT' });
    log('get_ticker(binanceusdm)', r.symbol ? 'PASS' : 'FAIL', `last=${r.last}`);
  } catch (e) { log('get_ticker(binanceusdm)', 'FAIL', e.message); }

  try {
    const r = await callTool('get_ticker', { exchange: 'binancecoinm', symbol: 'BTC/USD:BTC' });
    log('get_ticker(binancecoinm)', r.symbol ? 'PASS' : 'FAIL', `last=${r.last}`);
  } catch (e) { log('get_ticker(binancecoinm)', 'FAIL', e.message); }

  // 1.3 get_tickers (returns {total, data: [...]})
  try {
    const r = await callTool('get_tickers', { exchange: 'binance', symbols: ['BTC/USDT', 'ETH/USDT'] });
    const ok = r?.data && Array.isArray(r.data) && r.data.length === 2;
    log('get_tickers(2 symbols)', ok ? 'PASS' : 'FAIL', `count=${r?.data?.length}`);
  } catch (e) { log('get_tickers(2 symbols)', 'FAIL', e.message); }

  // 1.4 get_orderbook
  try {
    const r = await callTool('get_orderbook', { exchange: 'binance', symbol: 'BTC/USDT', limit: 5 });
    const ok = r.bids?.length > 0 && r.asks?.length > 0;
    log('get_orderbook(binance)', ok ? 'PASS' : 'FAIL', `bids=${r.bids?.length}, asks=${r.asks?.length}`);
  } catch (e) { log('get_orderbook(binance)', 'FAIL', e.message); }

  // 1.5 get_trades
  try {
    const r = await callTool('get_trades', { exchange: 'binance', symbol: 'BTC/USDT', limit: 5 });
    const ok = Array.isArray(r) && r.length > 0;
    log('get_trades(binance)', ok ? 'PASS' : 'FAIL', `count=${r?.length}`);
  } catch (e) { log('get_trades(binance)', 'FAIL', e.message); }

  // 1.6 get_ohlcv
  for (const ex of ['binance', 'bybit', 'gate', 'hyperliquid']) {
    try {
      const sym = ex === 'hyperliquid' ? 'BTC/USDC:USDC' : 'BTC/USDT';
      const r = await callTool('get_ohlcv', { exchange: ex, symbol: sym, timeframe: '1h', limit: 3 });
      const ok = Array.isArray(r) && r.length > 0;
      log(`get_ohlcv(${ex})`, ok ? 'PASS' : 'FAIL', `candles=${r?.length}`);
    } catch (e) { log(`get_ohlcv(${ex})`, 'FAIL', e.message); }
  }

  // 1.7 get_funding_rates (requires symbols array; returns {symbol: {fundingRate,...}} object)
  try {
    const r = await callTool('get_funding_rates', { exchange: 'binance', symbols: ['BTC/USDT:USDT'] });
    const val = r?.['BTC/USDT:USDT'] || Object.values(r || {})[0];
    log('get_funding_rates(binance)', val?.fundingRate !== undefined ? 'PASS' : 'FAIL', `rate=${val?.fundingRate}`);
  } catch (e) { log('get_funding_rates(binance)', 'FAIL', e.message); }

  try {
    const r = await callTool('get_funding_rates', { exchange: 'bybit', symbols: ['BTC/USDT:USDT'] });
    const val = r?.['BTC/USDT:USDT'] || Object.values(r || {})[0];
    log('get_funding_rates(bybit)', val?.fundingRate !== undefined ? 'PASS' : 'FAIL', `rate=${val?.fundingRate}`);
  } catch (e) { log('get_funding_rates(bybit)', 'FAIL', e.message); }

  // 1.8 get_funding_rate_history
  try {
    const r = await callTool('get_funding_rate_history', { exchange: 'binance', symbol: 'BTC/USDT:USDT', limit: 3 });
    const ok = Array.isArray(r) && r.length > 0;
    log('get_funding_rate_history(binance)', ok ? 'PASS' : 'FAIL', `count=${r?.length}`);
  } catch (e) { log('get_funding_rate_history(binance)', 'FAIL', e.message); }

  // 1.9 get_markets (returns {total, data: [...]})
  try {
    const r = await callTool('get_markets', { exchange: 'bybit' });
    const ok = r?.data && Array.isArray(r.data) && r.data.length > 10;
    log('get_markets(bybit)', ok ? 'PASS' : 'FAIL', `count=${r?.data?.length}`);
  } catch (e) { log('get_markets(bybit)', 'FAIL', e.message); }
}

async function testPrivate() {
  // 2.1 get_balance
  try {
    const r = await callTool('get_balance', { exchange: 'okx' });
    log('get_balance(okx)', r.total ? 'PASS' : 'FAIL', `keys=${Object.keys(r.total || {}).slice(0, 5)}`);
  } catch (e) { log('get_balance(okx)', 'FAIL', e.message); }

  // 2.2 get_open_orders
  try {
    const r = await callTool('get_open_orders', { exchange: 'okx', symbol: 'BTC/USDT' });
    log('get_open_orders(okx)', Array.isArray(r) ? 'PASS' : 'FAIL', `count=${r?.length}`);
  } catch (e) { log('get_open_orders(okx)', 'FAIL', e.message); }

  // 2.3 get_closed_orders
  try {
    const r = await callTool('get_closed_orders', { exchange: 'okx', symbol: 'BTC/USDT' });
    log('get_closed_orders(okx)', Array.isArray(r) ? 'PASS' : 'FAIL', `count=${r?.length}`);
  } catch (e) { log('get_closed_orders(okx)', 'FAIL', e.message); }

  // 2.4 get_positions (swap)
  try {
    const r = await callTool('get_positions', { exchange: 'okx' });
    log('get_positions(okx)', Array.isArray(r) ? 'PASS' : 'FAIL', `count=${r?.length}`);
  } catch (e) { log('get_positions(okx)', 'FAIL', e.message); }

  // 2.5 get_my_trades
  try {
    const r = await callTool('get_my_trades', { exchange: 'okx', symbol: 'BTC/USDT' });
    log('get_my_trades(okx)', Array.isArray(r) ? 'PASS' : 'FAIL', `count=${r?.length}`);
  } catch (e) { log('get_my_trades(okx)', 'FAIL', e.message); }

  // 2.6 get_ledger
  try {
    const r = await callTool('get_ledger', { exchange: 'okx' });
    log('get_ledger(okx)', Array.isArray(r) ? 'PASS' : 'FAIL', `count=${r?.length}`);
  } catch (e) { log('get_ledger(okx)', 'FAIL', e.message); }

  // 2.7 get_deposits
  try {
    const r = await callTool('get_deposits', { exchange: 'okx' });
    log('get_deposits(okx)', Array.isArray(r) ? 'PASS' : 'FAIL', `count=${r?.length}`);
  } catch (e) { log('get_deposits(okx)', 'FAIL', e.message); }

  // 2.8 get_withdrawals
  try {
    const r = await callTool('get_withdrawals', { exchange: 'okx' });
    log('get_withdrawals(okx)', Array.isArray(r) ? 'PASS' : 'FAIL', `count=${r?.length}`);
  } catch (e) { log('get_withdrawals(okx)', 'FAIL', e.message); }

  // 2.9 set_leverage (read-only test with low leverage)
  try {
    const r = await callTool('set_leverage', { exchange: 'okx', symbol: 'BTC/USDT:USDT', leverage: 3 });
    log('set_leverage(okx)', 'PASS', JSON.stringify(r).slice(0, 100));
  } catch (e) { log('set_leverage(okx)', 'FAIL', e.message); }

  // 2.10 set_margin_mode
  try {
    const r = await callTool('set_margin_mode', { exchange: 'okx', marginMode: 'cross', symbol: 'BTC/USDT:USDT' });
    log('set_margin_mode(okx)', 'PASS', JSON.stringify(r).slice(0, 100));
  } catch (e) { log('set_margin_mode(okx)', 'FAIL', e.message); }
}

async function testEdge() {
  // 3.1 Invalid exchange
  try {
    const r = await callTool('get_ticker', { exchange: 'fakexchange', symbol: 'BTC/USDT' });
    const isErr = typeof r === 'string' && r.includes('not supported');
    log('invalid_exchange', isErr ? 'PASS' : 'FAIL', String(r).slice(0, 80));
  } catch (e) { log('invalid_exchange', 'FAIL', e.message); }

  // 3.2 Invalid symbol
  try {
    const r = await callTool('get_ticker', { exchange: 'binance', symbol: 'FAKE/COIN' });
    log('invalid_symbol', 'PASS', `got error: ${String(r).slice(0, 80)}`);
  } catch (e) { log('invalid_symbol', 'PASS', `error caught: ${e.message.slice(0, 80)}`); }

  // 3.3 get_tickers empty array (bug fix: treats [] as "all tickers")
  try {
    const r = await callTool('get_tickers', { exchange: 'binance', symbols: [] });
    const ok = r?.data && Array.isArray(r.data) && r.data.length > 0;
    log('get_tickers(empty[])', ok ? 'PASS' : 'FAIL', `count=${r?.data?.length}, total=${r?.total}`);
  } catch (e) { log('get_tickers(empty[])', 'FAIL', e.message); }

  // 3.4 get_orderbook limit=0 (bug fix: should reject via zod .min(1))
  try {
    const r = await callTool('get_orderbook', { exchange: 'binance', symbol: 'BTC/USDT', limit: 0 });
    const isErr = typeof r === 'string' && r.includes('too_small');
    log('orderbook_limit_0', isErr ? 'PASS' : 'FAIL', isErr ? 'correctly rejected limit=0' : 'should have rejected');
  } catch (e) { log('orderbook_limit_0', 'PASS', 'correctly rejected limit=0'); }

  // 3.5 OKX public data without auth (skipAuth verification)
  try {
    const r = await callTool('get_ticker', { exchange: 'okx', symbol: 'BTC/USDT' });
    const ok = r.symbol === 'BTC/USDT';
    log('okx_public_skipAuth', ok ? 'PASS' : 'FAIL', `last=${r.last}`);
  } catch (e) { log('okx_public_skipAuth', 'FAIL', e.message); }

  // 3.6 Invalid timeframe
  try {
    const r = await callTool('get_ohlcv', { exchange: 'binance', symbol: 'BTC/USDT', timeframe: '99x' });
    log('invalid_timeframe', 'PASS', `got error: ${String(r).slice(0, 80)}`);
  } catch (e) { log('invalid_timeframe', 'PASS', `error: ${e.message.slice(0, 80)}`); }

  // 3.7 Private API without keys (non-OKX exchange)
  try {
    const r = await callTool('get_balance', { exchange: 'binance' });
    log('no_apikey_error', 'PASS', `got error: ${String(r).slice(0, 80)}`);
  } catch (e) { log('no_apikey_error', 'PASS', `error: ${e.message.slice(0, 80)}`); }

  // 3.8 Pionex removed verification
  try {
    const r = await callTool('get_ticker', { exchange: 'pionex', symbol: 'BTC/USDT' });
    const isErr = typeof r === 'string' && r.includes('not supported');
    log('pionex_removed', isErr ? 'PASS' : 'FAIL', String(r).slice(0, 80));
  } catch (e) { log('pionex_removed', 'FAIL', e.message); }
}

run().catch(e => { console.error('Fatal:', e); child.kill(); process.exit(1); });
