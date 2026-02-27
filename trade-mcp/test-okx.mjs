#!/usr/bin/env node
/**
 * OKX Full Integration Test for trade-mcp
 * Communicates via MCP stdio protocol (JSON-RPC over stdin/stdout)
 */
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

// ── Config ──
const ENV = {
  DEFAULT_EXCHANGE: 'okx',
  OKX_API_KEY: '317ceb0a-5fe6-4949-b7ba-ffa8e040704c',
  OKX_SECRET: 'F060B959C51004DFACE3F25DEC4F474C',
  OKX_PASSPHRASE: 'Aicoin!666',
  USE_PROXY: 'true',
  PROXY_URL: 'socks5://127.0.0.1:7890',
  PATH: process.env.PATH,
  HOME: process.env.HOME,
};

let child;
let buffer = '';
const pending = new Map(); // id -> { resolve, reject }
let passed = 0, failed = 0, skipped = 0;
const results = [];

// ── MCP Protocol Helpers ──
function sendRequest(method, params = {}) {
  const id = randomUUID();
  const msg = { jsonrpc: '2.0', id, method, params };
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timeout: ${method}`));
    }, 30000);
    pending.set(id, {
      resolve: (v) => { clearTimeout(timer); resolve(v); },
      reject: (e) => { clearTimeout(timer); reject(e); },
    });
    child.stdin.write(JSON.stringify(msg) + '\n');
  });
}

function handleData(chunk) {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop(); // keep incomplete line
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    } catch {}
  }
}

function sendNotification(method, params = {}) {
  const msg = { jsonrpc: '2.0', method, params };
  child.stdin.write(JSON.stringify(msg) + '\n');
}

// ── Call MCP Tool ──
async function callTool(name, args = {}) {
  return sendRequest('tools/call', { name, arguments: args });
}

function parseResult(result) {
  if (!result || !result.content || !result.content[0]) return null;
  const text = result.content[0].text;
  if (result.isError) throw new Error(text);
  try { return JSON.parse(text); } catch { return text; }
}

// ── Test Runner ──
async function test(name, fn) {
  process.stdout.write(`  ⏳ ${name} ... `);
  try {
    const data = await fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`✅ PASS`);
    return data;
  } catch (e) {
    failed++;
    results.push({ name, status: 'FAIL', error: e.message });
    console.log(`❌ FAIL: ${e.message}`);
    return null;
  }
}

function skip(name, reason) {
  skipped++;
  results.push({ name, status: 'SKIP', reason });
  console.log(`  ⏭️  ${name} ... SKIP: ${reason}`);
}

// ── Main ──
async function main() {
  console.log('\n🚀 Starting trade-mcp OKX integration test\n');

  // Spawn MCP server
  child = spawn('node', ['build/index.js'], {
    cwd: '/Users/applychart/Desktop/develop/aicoin-mcp/trade-mcp',
    env: ENV,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  child.stdout.on('data', handleData);
  child.stderr.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg) console.log(`  [stderr] ${msg}`);
  });

  // Initialize MCP session
  console.log('── Initializing MCP session ──');
  const initResult = await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' },
  });
  console.log(`  Server: ${initResult.serverInfo?.name} v${initResult.serverInfo?.version}`);
  sendNotification('notifications/initialized', {});

  // List tools
  console.log('\n── Listing available tools ──');
  const toolsResult = await sendRequest('tools/list', {});
  const toolNames = toolsResult.tools.map(t => t.name);
  console.log(`  Found ${toolNames.length} tools: ${toolNames.join(', ')}\n`);

  // ═══════════════════════════════════════
  // PART 1: Public Tools (no auth needed)
  // ═══════════════════════════════════════
  console.log('═══ PART 1: Public Market Data Tools ═══\n');

  await runPublicTests();

  // ═══════════════════════════════════════
  // PART 2: Private Tools (auth required)
  // ═══════════════════════════════════════
  console.log('\n═══ PART 2: Private Trading Tools ═══\n');

  await runPrivateTests();

  // ═══════════════════════════════════════
  // PART 3: Trading Flow (order lifecycle)
  // ═══════════════════════════════════════
  console.log('\n═══ PART 3: Order Lifecycle Test ═══\n');

  await runOrderLifecycleTests();

  // Summary
  printSummary();

  child.kill();
  process.exit(failed > 0 ? 1 : 0);
}

// ═══════════════════════════════════════
// Public Tools Tests
// ═══════════════════════════════════════
async function runPublicTests() {
  // 1. list_exchanges
  await test('list_exchanges', async () => {
    const r = await callTool('list_exchanges');
    const data = parseResult(r);
    if (!Array.isArray(data) || !data.includes('okx'))
      throw new Error(`Expected array with "okx", got: ${JSON.stringify(data)}`);
    console.log(`    → ${data.length} exchanges: ${data.join(', ')}`);
    return data;
  });

  // 2. get_ticker (spot)
  await test('get_ticker [spot BTC/USDT]', async () => {
    const r = await callTool('get_ticker', {
      exchange: 'okx', symbol: 'BTC/USDT', market_type: 'spot',
    });
    const d = parseResult(r);
    if (!d.last || !d.symbol) throw new Error('Missing last/symbol');
    console.log(`    → BTC/USDT last=${d.last} bid=${d.bid} ask=${d.ask}`);
    return d;
  });

  // 3. get_ticker (swap)
  await test('get_ticker [swap BTC/USDT:USDT]', async () => {
    const r = await callTool('get_ticker', {
      exchange: 'okx', symbol: 'BTC/USDT:USDT', market_type: 'swap',
    });
    const d = parseResult(r);
    if (!d.last) throw new Error('Missing last price');
    console.log(`    → BTC/USDT:USDT swap last=${d.last}`);
    return d;
  });

  // 4. get_tickers
  await test('get_tickers [BTC+ETH spot]', async () => {
    const r = await callTool('get_tickers', {
      exchange: 'okx',
      symbols: ['BTC/USDT', 'ETH/USDT'],
      market_type: 'spot',
    });
    const d = parseResult(r);
    const keys = Object.keys(d);
    if (keys.length < 2) throw new Error(`Expected >=2 tickers, got ${keys.length}`);
    console.log(`    → Got tickers for: ${keys.join(', ')}`);
    return d;
  });

  // 5. get_orderbook
  await test('get_orderbook [BTC/USDT limit=5]', async () => {
    const r = await callTool('get_orderbook', {
      exchange: 'okx', symbol: 'BTC/USDT', limit: 5,
    });
    const d = parseResult(r);
    if (!d.bids || !d.asks) throw new Error('Missing bids/asks');
    console.log(`    → bids=${d.bids.length} asks=${d.asks.length} top_bid=${d.bids[0]?.[0]} top_ask=${d.asks[0]?.[0]}`);
    return d;
  });

  // 6. get_trades
  await test('get_trades [BTC/USDT limit=5]', async () => {
    const r = await callTool('get_trades', {
      exchange: 'okx', symbol: 'BTC/USDT', limit: 5,
    });
    const d = parseResult(r);
    if (!Array.isArray(d) || d.length === 0) throw new Error('Expected non-empty array');
    console.log(`    → ${d.length} trades, latest: price=${d[0].price} amount=${d[0].amount}`);
    return d;
  });

  // 7. get_markets (spot, only count)
  await test('get_markets [spot]', async () => {
    const r = await callTool('get_markets', {
      exchange: 'okx', market_type: 'spot',
    });
    const d = parseResult(r);
    if (!Array.isArray(d) || d.length === 0) throw new Error('Expected non-empty array');
    console.log(`    → ${d.length} spot markets`);
    return d;
  });

  // 8. get_ohlcv
  await test('get_ohlcv [BTC/USDT 1d limit=5]', async () => {
    const r = await callTool('get_ohlcv', {
      exchange: 'okx', symbol: 'BTC/USDT', timeframe: '1d', limit: 5,
    });
    const d = parseResult(r);
    if (!Array.isArray(d) || d.length === 0) throw new Error('Expected candle array');
    console.log(`    → ${d.length} candles, latest: O=${d[d.length-1][1]} H=${d[d.length-1][2]} L=${d[d.length-1][3]} C=${d[d.length-1][4]}`);
    return d;
  });

  // 9. get_funding_rates
  await test('get_funding_rates [BTC/USDT:USDT]', async () => {
    const r = await callTool('get_funding_rates', {
      exchange: 'okx', symbols: ['BTC/USDT:USDT'],
    });
    const d = parseResult(r);
    const key = Object.keys(d)[0];
    if (!key) throw new Error('No funding rate returned');
    console.log(`    → ${key} rate=${d[key].fundingRate}`);
    return d;
  });

  // 10. get_funding_rate_history
  await test('get_funding_rate_history [BTC/USDT:USDT limit=3]', async () => {
    const r = await callTool('get_funding_rate_history', {
      exchange: 'okx', symbol: 'BTC/USDT:USDT', limit: 3,
    });
    const d = parseResult(r);
    if (!Array.isArray(d) || d.length === 0) throw new Error('Expected array');
    console.log(`    → ${d.length} records, latest rate=${d[0].fundingRate}`);
    return d;
  });
}

// ═══════════════════════════════════════
// Private Tools Tests
// ═══════════════════════════════════════
async function runPrivateTests() {
  // 1. get_balance (spot)
  await test('get_balance [spot]', async () => {
    const r = await callTool('get_balance', {
      exchange: 'okx', market_type: 'spot',
    });
    const d = parseResult(r);
    if (!d.total) throw new Error('Missing total');
    const nonZero = Object.entries(d.total).filter(([, v]) => v > 0);
    console.log(`    → ${nonZero.length} assets with balance`);
    for (const [k, v] of nonZero.slice(0, 5)) {
      console.log(`      ${k}: total=${d.total[k]} free=${d.free[k]} used=${d.used[k]}`);
    }
    return d;
  });

  // 2. get_balance (swap)
  await test('get_balance [swap]', async () => {
    const r = await callTool('get_balance', {
      exchange: 'okx', market_type: 'swap',
    });
    const d = parseResult(r);
    if (!d.total) throw new Error('Missing total');
    console.log(`    → swap account retrieved`);
    return d;
  });

  // 3. get_positions
  await test('get_positions', async () => {
    const r = await callTool('get_positions', { exchange: 'okx' });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    → ${d.length} open positions`);
    for (const p of d.slice(0, 3)) {
      console.log(`      ${p.symbol} side=${p.side} size=${p.contracts} pnl=${p.unrealizedPnl}`);
    }
    return d;
  });

  // 4. get_open_orders (spot)
  await test('get_open_orders [spot]', async () => {
    const r = await callTool('get_open_orders', {
      exchange: 'okx', market_type: 'spot',
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    → ${d.length} open spot orders`);
    return d;
  });

  // 5. get_open_orders (swap)
  await test('get_open_orders [swap]', async () => {
    const r = await callTool('get_open_orders', {
      exchange: 'okx', market_type: 'swap',
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    → ${d.length} open swap orders`);
    return d;
  });

  // 6. get_closed_orders (spot)
  await test('get_closed_orders [spot limit=3]', async () => {
    const r = await callTool('get_closed_orders', {
      exchange: 'okx', market_type: 'spot', limit: 3,
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    → ${d.length} closed spot orders`);
    return d;
  });

  // 7. get_my_trades (spot)
  await test('get_my_trades [spot limit=3]', async () => {
    const r = await callTool('get_my_trades', {
      exchange: 'okx', market_type: 'spot', limit: 3,
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    → ${d.length} recent spot trades`);
    return d;
  });

  // 8. get_ledger
  await test('get_ledger [USDT limit=3]', async () => {
    const r = await callTool('get_ledger', {
      exchange: 'okx', code: 'USDT', limit: 3,
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    → ${d.length} ledger entries`);
    return d;
  });

  // 9. get_deposits
  await test('get_deposits [limit=3]', async () => {
    const r = await callTool('get_deposits', {
      exchange: 'okx', limit: 3,
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    → ${d.length} deposit records`);
    return d;
  });

  // 10. get_withdrawals
  await test('get_withdrawals [limit=3]', async () => {
    const r = await callTool('get_withdrawals', {
      exchange: 'okx', limit: 3,
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    → ${d.length} withdrawal records`);
    return d;
  });

  // 11. set_leverage
  await test('set_leverage [BTC/USDT:USDT 3x]', async () => {
    const r = await callTool('set_leverage', {
      exchange: 'okx', leverage: 3, symbol: 'BTC/USDT:USDT',
    });
    const d = parseResult(r);
    console.log(`    → leverage set result:`, JSON.stringify(d).slice(0, 200));
    return d;
  });

  // 12. set_margin_mode
  await test('set_margin_mode [cross BTC/USDT:USDT]', async () => {
    const r = await callTool('set_margin_mode', {
      exchange: 'okx', margin_mode: 'cross', symbol: 'BTC/USDT:USDT',
    });
    const d = parseResult(r);
    console.log(`    → margin mode result:`, JSON.stringify(d).slice(0, 200));
    return d;
  });

  // 13. transfer (spot -> swap, tiny amount)
  await test('transfer [USDT spot→swap 1]', async () => {
    const r = await callTool('transfer', {
      exchange: 'okx', code: 'USDT', amount: 1,
      from_account: 'spot', to_account: 'swap',
    });
    const d = parseResult(r);
    console.log(`    → transfer result:`, JSON.stringify(d).slice(0, 200));
    return d;
  });

  // 13b. transfer back
  await test('transfer [USDT swap→spot 1]', async () => {
    const r = await callTool('transfer', {
      exchange: 'okx', code: 'USDT', amount: 1,
      from_account: 'swap', to_account: 'spot',
    });
    const d = parseResult(r);
    console.log(`    → transfer back result:`, JSON.stringify(d).slice(0, 200));
    return d;
  });
}

// ═══════════════════════════════════════
// Order Lifecycle Tests
// ═══════════════════════════════════════
async function runOrderLifecycleTests() {
  console.log('  ── A: Spot Limit Order Lifecycle ──\n');

  let btcPrice = 0;
  await test('A1: get BTC/USDT price', async () => {
    const r = await callTool('get_ticker', {
      exchange: 'okx', symbol: 'BTC/USDT', market_type: 'spot',
    });
    const d = parseResult(r);
    btcPrice = d.last;
    console.log(`    → current price: ${btcPrice}`);
    return d;
  });

  let spotOrderId = null;
  if (btcPrice > 0) {
    const limitPrice = Math.round(btcPrice * 0.5);
    await test(`A2: create_order [spot limit buy 0.00001 @ ~50%]`, async () => {
      const r = await callTool('create_order', {
        exchange: 'okx', symbol: 'BTC/USDT', type: 'limit',
        side: 'buy', amount: 0.00001, price: limitPrice,
        market_type: 'spot',
      });
      const d = parseResult(r);
      spotOrderId = d.id;
      console.log(`    → order id=${d.id} status=${d.status} price=${limitPrice}`);
      return d;
    });
  }

  if (spotOrderId) {
    await test('A3: get_order [spot]', async () => {
      const r = await callTool('get_order', {
        exchange: 'okx', order_id: spotOrderId,
        symbol: 'BTC/USDT', market_type: 'spot',
      });
      const d = parseResult(r);
      console.log(`    → id=${d.id} status=${d.status} filled=${d.filled}`);
      return d;
    });

    await test('A4: get_open_orders shows our order', async () => {
      const r = await callTool('get_open_orders', {
        exchange: 'okx', symbol: 'BTC/USDT', market_type: 'spot',
      });
      const d = parseResult(r);
      const found = d.find(o => o.id === spotOrderId);
      if (!found) throw new Error(`Order ${spotOrderId} not found`);
      console.log(`    → found in open orders`);
      return d;
    });

    await test('A5: cancel_order [spot]', async () => {
      const r = await callTool('cancel_order', {
        exchange: 'okx', order_id: spotOrderId, symbol: 'BTC/USDT',
      });
      const d = parseResult(r);
      console.log(`    → cancel: id=${d.id} status=${d.status}`);
      return d;
    });

    await test('A6: verify order cancelled', async () => {
      const r = await callTool('get_order', {
        exchange: 'okx', order_id: spotOrderId,
        symbol: 'BTC/USDT', market_type: 'spot',
      });
      const d = parseResult(r);
      if (d.status !== 'canceled' && d.status !== 'cancelled')
        throw new Error(`Expected canceled, got ${d.status}`);
      console.log(`    → confirmed status=${d.status}`);
      return d;
    });
  } else {
    skip('A2-A6: spot order lifecycle', 'No BTC price');
  }

  // ── Test B: Swap limit order + cancel_all ──
  console.log('\n  ── B: Swap Limit Order + cancel_all ──\n');

  let swapPrice = 0;
  await test('B1: get BTC/USDT:USDT swap price', async () => {
    const r = await callTool('get_ticker', {
      exchange: 'okx', symbol: 'BTC/USDT:USDT', market_type: 'swap',
    });
    const d = parseResult(r);
    swapPrice = d.last;
    console.log(`    → swap price: ${swapPrice}`);
    return d;
  });

  if (swapPrice > 0) {
    const swapLimitPrice = Math.round(swapPrice * 0.5);
    let swapOrderId = null;

    await test(`B2: create_order [swap limit buy long 0.01 BTC]`, async () => {
      const r = await callTool('create_order', {
        exchange: 'okx', symbol: 'BTC/USDT:USDT', type: 'limit',
        side: 'buy', amount: 0.01, price: swapLimitPrice,
        pos_side: 'long', margin_mode: 'cross',
        market_type: 'swap',
      });
      const d = parseResult(r);
      swapOrderId = d.id;
      console.log(`    → order id=${d.id} status=${d.status}`);
      return d;
    });

    if (swapOrderId) {
      await test('B3: cancel_all_orders [swap BTC/USDT:USDT]', async () => {
        const r = await callTool('cancel_all_orders', {
          exchange: 'okx', symbol: 'BTC/USDT:USDT', market_type: 'swap',
        });
        const d = parseResult(r);
        console.log(`    → cancel_all result:`, JSON.stringify(d).slice(0, 200));
        return d;
      });
    }
  } else {
    skip('B2-B3: swap order lifecycle', 'No swap price');
  }

  // ── Test C: Spot market order (real trade, minimum amount) ──
  console.log('\n  ── C: Spot Market Order (real trade) ──\n');

  await test('C1: create_order [spot market buy ETH/USDT 0.001]', async () => {
    const r = await callTool('create_order', {
      exchange: 'okx', symbol: 'ETH/USDT', type: 'market',
      side: 'buy', amount: 0.001, market_type: 'spot',
    });
    const d = parseResult(r);
    console.log(`    → id=${d.id} status=${d.status} filled=${d.filled} cost=${d.cost}`);
    return d;
  });

  // Sell back what we bought
  await test('C2: create_order [spot market sell ETH/USDT 0.001]', async () => {
    const r = await callTool('create_order', {
      exchange: 'okx', symbol: 'ETH/USDT', type: 'market',
      side: 'sell', amount: 0.001, market_type: 'spot',
    });
    const d = parseResult(r);
    console.log(`    → id=${d.id} status=${d.status} filled=${d.filled} cost=${d.cost}`);
    return d;
  });

  // Check trade history reflects our trades
  await test('C3: get_my_trades shows recent ETH trades', async () => {
    const r = await callTool('get_my_trades', {
      exchange: 'okx', symbol: 'ETH/USDT', market_type: 'spot', limit: 5,
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    → ${d.length} recent ETH/USDT trades`);
    return d;
  });

  // ── Test D: Swap market order (open + close) ──
  console.log('\n  ── D: Swap Market Order (open+close) ──\n');

  await test('D1: create_order [swap market buy long BTC 0.01]', async () => {
    const r = await callTool('create_order', {
      exchange: 'okx', symbol: 'BTC/USDT:USDT', type: 'market',
      side: 'buy', amount: 0.01, pos_side: 'long',
      margin_mode: 'cross', market_type: 'swap',
    });
    const d = parseResult(r);
    console.log(`    → id=${d.id} status=${d.status}`);
    return d;
  });

  // Check position opened
  await test('D2: get_positions after open', async () => {
    const r = await callTool('get_positions', {
      exchange: 'okx', symbols: ['BTC/USDT:USDT'],
    });
    const d = parseResult(r);
    console.log(`    → ${d.length} BTC positions`);
    for (const p of d) {
      console.log(`      side=${p.side} contracts=${p.contracts} pnl=${p.unrealizedPnl}`);
    }
    return d;
  });

  // Close the position
  await test('D3: create_order [swap market sell long BTC 0.01 close]', async () => {
    const r = await callTool('create_order', {
      exchange: 'okx', symbol: 'BTC/USDT:USDT', type: 'market',
      side: 'sell', amount: 0.01, pos_side: 'long',
      margin_mode: 'cross', market_type: 'swap',
    });
    const d = parseResult(r);
    console.log(`    → id=${d.id} status=${d.status}`);
    return d;
  });
}

// ═══════════════════════════════════════
// Summary
// ═══════════════════════════════════════
function printSummary() {
  console.log('\n═══════════════════════════════════════');
  console.log('           TEST SUMMARY');
  console.log('═══════════════════════════════════════\n');

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
    const extra = r.error ? ` (${r.error.slice(0, 80)})` : r.reason ? ` (${r.reason})` : '';
    console.log(`  ${icon} ${r.name}${extra}`);
  }

  console.log(`\n  Total: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed} | ⏭️ Skipped: ${skipped}\n`);
}

main().catch(e => {
  console.error('Fatal:', e);
  if (child) child.kill();
  process.exit(1);
});