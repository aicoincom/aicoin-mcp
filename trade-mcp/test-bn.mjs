#!/usr/bin/env node
/**
 * Binance Full Integration Test for trade-mcp
 * Communicates via MCP stdio protocol (JSON-RPC over stdin/stdout)
 */
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

// ── Config ──
const ENV = {
  DEFAULT_EXCHANGE: 'binance',
  BINANCE_API_KEY: 'MyHHftlqBTCVPpknzuefjmmo6IuGrv46lfkLPiFEiiCbpnV0mv5VMOq0XtuZrGoG',
  BINANCE_SECRET: 'PR6oQWwUb5LR99aUKVx2wBb9k9SsL0Mm6ZdpmtIJy5HsvPNF92LCH8olnPVgk0b5',
  BINANCEUSDM_API_KEY: 'MyHHftlqBTCVPpknzuefjmmo6IuGrv46lfkLPiFEiiCbpnV0mv5VMOq0XtuZrGoG',
  BINANCEUSDM_SECRET: 'PR6oQWwUb5LR99aUKVx2wBb9k9SsL0Mm6ZdpmtIJy5HsvPNF92LCH8olnPVgk0b5',
  USE_PROXY: 'true',
  PROXY_URL: 'socks5://127.0.0.1:7890',
  PATH: process.env.PATH,
  HOME: process.env.HOME,
};

let child;
let buffer = '';
const pending = new Map();
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
  buffer = lines.pop();
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

async function callTool(name, args = {}) {
  return sendRequest('tools/call', { name, arguments: args });
}

function parseResult(result) {
  if (!result || !result.content || !result.content[0]) return null;
  const text = result.content[0].text;
  if (result.isError) throw new Error(text);
  try { return JSON.parse(text); } catch { return text; }
}

async function test(name, fn) {
  process.stdout.write(`  ... ${name} ... `);
  try {
    const data = await fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`PASS`);
    return data;
  } catch (e) {
    failed++;
    results.push({ name, status: 'FAIL', error: e.message });
    console.log(`FAIL: ${e.message}`);
    return null;
  }
}

function skip(name, reason) {
  skipped++;
  results.push({ name, status: 'SKIP', reason });
  console.log(`  SKIP ${name} ... ${reason}`);
}

// ── Main ──
async function main() {
  console.log('\nStarting trade-mcp Binance integration test\n');

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

  console.log('-- Initializing MCP session --');
  const initResult = await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' },
  });
  console.log(`  Server: ${initResult.serverInfo?.name} v${initResult.serverInfo?.version}`);
  sendNotification('notifications/initialized', {});

  console.log('\n-- Listing available tools --');
  const toolsResult = await sendRequest('tools/list', {});
  const toolNames = toolsResult.tools.map(t => t.name);
  console.log(`  Found ${toolNames.length} tools: ${toolNames.join(', ')}\n`);

  console.log('=== PART 1: Public Market Data Tools ===\n');
  await runPublicTests();

  console.log('\n=== PART 2: Private Trading Tools ===\n');
  await runPrivateTests();

  console.log('\n=== PART 3: Order Lifecycle Test ===\n');
  await runOrderLifecycleTests();

  printSummary();
  child.kill();
  process.exit(failed > 0 ? 1 : 0);
}

// ===================================
// Public Tools Tests
// ===================================
async function runPublicTests() {
  await test('list_exchanges', async () => {
    const r = await callTool('list_exchanges');
    const data = parseResult(r);
    if (!Array.isArray(data) || !data.includes('binance'))
      throw new Error(`Expected array with "binance"`);
    console.log(`    -> ${data.length} exchanges`);
    return data;
  });

  await test('get_ticker [spot BTC/USDT]', async () => {
    const r = await callTool('get_ticker', {
      exchange: 'binance', symbol: 'BTC/USDT', market_type: 'spot',
    });
    const d = parseResult(r);
    if (!d.last || !d.symbol) throw new Error('Missing last/symbol');
    console.log(`    -> last=${d.last} bid=${d.bid} ask=${d.ask}`);
    return d;
  });

  await test('get_ticker [futures BTC/USDT:USDT]', async () => {
    const r = await callTool('get_ticker', {
      exchange: 'binanceusdm', symbol: 'BTC/USDT:USDT', market_type: 'swap',
    });
    const d = parseResult(r);
    if (!d.last) throw new Error('Missing last price');
    console.log(`    -> futures last=${d.last}`);
    return d;
  });

  await test('get_tickers [BTC+ETH spot]', async () => {
    const r = await callTool('get_tickers', {
      exchange: 'binance', symbols: ['BTC/USDT', 'ETH/USDT'], market_type: 'spot',
    });
    const d = parseResult(r);
    if (!d || typeof d !== 'object') throw new Error('Expected object');
    console.log(`    -> keys: ${Object.keys(d).join(', ')}`);
    return d;
  });

  await test('get_orderbook [BTC/USDT limit=5]', async () => {
    const r = await callTool('get_orderbook', {
      exchange: 'binance', symbol: 'BTC/USDT', limit: 5,
    });
    const d = parseResult(r);
    if (!d.bids || !d.asks) throw new Error('Missing bids/asks');
    console.log(`    -> bids=${d.bids.length} asks=${d.asks.length}`);
    return d;
  });

  await test('get_trades [BTC/USDT limit=5]', async () => {
    const r = await callTool('get_trades', {
      exchange: 'binance', symbol: 'BTC/USDT', limit: 5,
    });
    const d = parseResult(r);
    if (!Array.isArray(d) || d.length === 0) throw new Error('Expected non-empty array');
    console.log(`    -> ${d.length} trades`);
    return d;
  });

  await test('get_markets [spot]', async () => {
    const r = await callTool('get_markets', {
      exchange: 'binance', market_type: 'spot',
    });
    const d = parseResult(r);
    const arr = Array.isArray(d) ? d : (d && d.data ? d.data : null);
    if (!arr || arr.length === 0) throw new Error('Expected non-empty markets');
    console.log(`    -> ${arr.length} spot markets`);
    return d;
  });

  await test('get_ohlcv [BTC/USDT 1d limit=5]', async () => {
    const r = await callTool('get_ohlcv', {
      exchange: 'binance', symbol: 'BTC/USDT', timeframe: '1d', limit: 5,
    });
    const d = parseResult(r);
    if (!Array.isArray(d) || d.length === 0) throw new Error('Expected candle array');
    console.log(`    -> ${d.length} candles`);
    return d;
  });

  await test('get_funding_rates [BTC/USDT:USDT]', async () => {
    const r = await callTool('get_funding_rates', {
      exchange: 'binanceusdm', symbols: ['BTC/USDT:USDT'],
    });
    const d = parseResult(r);
    const key = Object.keys(d)[0];
    if (!key) throw new Error('No funding rate returned');
    console.log(`    -> ${key} rate=${d[key].fundingRate}`);
    return d;
  });

  await test('get_funding_rate_history [BTC/USDT:USDT limit=3]', async () => {
    const r = await callTool('get_funding_rate_history', {
      exchange: 'binanceusdm', symbol: 'BTC/USDT:USDT', limit: 3,
    });
    const d = parseResult(r);
    if (!Array.isArray(d) || d.length === 0) throw new Error('Expected array');
    console.log(`    -> ${d.length} records`);
    return d;
  });
}

// ===================================
// Private Tools Tests
// ===================================
async function runPrivateTests() {
  await test('get_balance [spot]', async () => {
    const r = await callTool('get_balance', {
      exchange: 'binance', market_type: 'spot',
    });
    const d = parseResult(r);
    if (!d.total) throw new Error('Missing total');
    const nonZero = Object.entries(d.total).filter(([, v]) => v > 0);
    console.log(`    -> ${nonZero.length} assets with balance`);
    for (const [k] of nonZero.slice(0, 5)) {
      console.log(`      ${k}: total=${d.total[k]} free=${d.free[k]} used=${d.used[k]}`);
    }
    return d;
  });

  await test('get_balance [futures]', async () => {
    const r = await callTool('get_balance', {
      exchange: 'binanceusdm', market_type: 'swap',
    });
    const d = parseResult(r);
    if (!d.total) throw new Error('Missing total');
    console.log(`    -> futures account retrieved`);
    return d;
  });

  await test('get_positions', async () => {
    const r = await callTool('get_positions', { exchange: 'binanceusdm' });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    -> ${d.length} open positions`);
    return d;
  });

  await test('get_open_orders [spot]', async () => {
    const r = await callTool('get_open_orders', {
      exchange: 'binance', symbol: 'BTC/USDT', market_type: 'spot',
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    -> ${d.length} open spot orders`);
    return d;
  });

  await test('get_open_orders [futures]', async () => {
    const r = await callTool('get_open_orders', {
      exchange: 'binanceusdm', symbol: 'BTC/USDT:USDT', market_type: 'swap',
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    -> ${d.length} open futures orders`);
    return d;
  });

  await test('get_closed_orders [spot BTC/USDT limit=3]', async () => {
    const r = await callTool('get_closed_orders', {
      exchange: 'binance', symbol: 'BTC/USDT', market_type: 'spot', limit: 3,
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    -> ${d.length} closed spot orders`);
    return d;
  });

  await test('get_my_trades [spot BTC/USDT limit=3]', async () => {
    const r = await callTool('get_my_trades', {
      exchange: 'binance', symbol: 'BTC/USDT', market_type: 'spot', limit: 3,
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    -> ${d.length} recent spot trades`);
    return d;
  });

  await test('get_ledger [USDT limit=3]', async () => {
    const r = await callTool('get_ledger', {
      exchange: 'binanceusdm', code: 'USDT', limit: 3,
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    -> ${d.length} ledger entries`);
    return d;
  });

  await test('get_deposits [limit=3]', async () => {
    const r = await callTool('get_deposits', {
      exchange: 'binance', limit: 3,
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    -> ${d.length} deposit records`);
    return d;
  });

  await test('get_withdrawals [limit=3]', async () => {
    const r = await callTool('get_withdrawals', {
      exchange: 'binance', limit: 3,
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    -> ${d.length} withdrawal records`);
    return d;
  });

  await test('set_leverage [BTC/USDT:USDT 3x]', async () => {
    const r = await callTool('set_leverage', {
      exchange: 'binanceusdm', leverage: 3, symbol: 'BTC/USDT:USDT',
    });
    const d = parseResult(r);
    console.log(`    -> result:`, JSON.stringify(d).slice(0, 200));
    return d;
  });

  await test('set_margin_mode [cross BTC/USDT:USDT]', async () => {
    const r = await callTool('set_margin_mode', {
      exchange: 'binanceusdm', margin_mode: 'cross', symbol: 'BTC/USDT:USDT', leverage: 3,
    });
    const d = parseResult(r);
    console.log(`    -> result:`, JSON.stringify(d).slice(0, 200));
    return d;
  });

  await test('transfer [USDT spot->future 1]', async () => {
    const r = await callTool('transfer', {
      exchange: 'binance', code: 'USDT', amount: 1,
      from_account: 'spot', to_account: 'future',
    });
    const d = parseResult(r);
    console.log(`    -> result:`, JSON.stringify(d).slice(0, 200));
    return d;
  });

  await test('transfer [USDT future->spot 1]', async () => {
    const r = await callTool('transfer', {
      exchange: 'binance', code: 'USDT', amount: 1,
      from_account: 'future', to_account: 'spot',
    });
    const d = parseResult(r);
    console.log(`    -> result:`, JSON.stringify(d).slice(0, 200));
    return d;
  });
}


// ===================================
// Order Lifecycle Tests
// ===================================
async function runOrderLifecycleTests() {
  // Prep: move 6 USDT from futures to spot for spot order tests
  console.log('  -- Prep: Transfer 6 USDT futures->spot --\n');
  await test('Prep: transfer 6 USDT future->spot', async () => {
    const r = await callTool('transfer', {
      exchange: 'binance', code: 'USDT', amount: 6,
      from_account: 'future', to_account: 'spot',
    });
    const d = parseResult(r);
    console.log(`    -> result:`, JSON.stringify(d).slice(0, 200));
    return d;
  });

  console.log('\n  -- A: Spot Limit Order Lifecycle --\n');

  let btcPrice = 0;
  await test('A1: get BTC/USDT price', async () => {
    const r = await callTool('get_ticker', {
      exchange: 'binance', symbol: 'BTC/USDT', market_type: 'spot',
    });
    const d = parseResult(r);
    btcPrice = d.last;
    console.log(`    -> current price: ${btcPrice}`);
    return d;
  });

  let spotOrderId = null;
  if (btcPrice > 0) {
    const limitPrice = Math.round(btcPrice * 0.8);
    await test(`A2: create_order [spot limit buy 0.0001 @ ~80%]`, async () => {
      const r = await callTool('create_order', {
        exchange: 'binance', symbol: 'BTC/USDT', type: 'limit',
        side: 'buy', amount: 0.0001, price: limitPrice,
        market_type: 'spot',
      });
      const d = parseResult(r);
      spotOrderId = d.id;
      console.log(`    -> order id=${d.id} status=${d.status} price=${limitPrice}`);
      return d;
    });
  }

  if (spotOrderId) {
    await test('A3: get_order [spot]', async () => {
      const r = await callTool('get_order', {
        exchange: 'binance', order_id: spotOrderId,
        symbol: 'BTC/USDT', market_type: 'spot',
      });
      const d = parseResult(r);
      console.log(`    -> id=${d.id} status=${d.status} filled=${d.filled}`);
      return d;
    });

    await test('A4: get_open_orders shows our order', async () => {
      const r = await callTool('get_open_orders', {
        exchange: 'binance', symbol: 'BTC/USDT', market_type: 'spot',
      });
      const d = parseResult(r);
      const found = d.find(o => o.id === spotOrderId);
      if (!found) throw new Error(`Order ${spotOrderId} not found`);
      console.log(`    -> found in open orders`);
      return d;
    });

    await test('A5: cancel_order [spot]', async () => {
      const r = await callTool('cancel_order', {
        exchange: 'binance', order_id: spotOrderId, symbol: 'BTC/USDT',
      });
      const d = parseResult(r);
      console.log(`    -> cancel: id=${d.id} status=${d.status}`);
      return d;
    });

    await test('A6: verify order cancelled', async () => {
      const r = await callTool('get_order', {
        exchange: 'binance', order_id: spotOrderId,
        symbol: 'BTC/USDT', market_type: 'spot',
      });
      const d = parseResult(r);
      if (d.status !== 'canceled' && d.status !== 'cancelled')
        throw new Error(`Expected canceled, got ${d.status}`);
      console.log(`    -> confirmed status=${d.status}`);
      return d;
    });
  } else {
    skip('A3-A6: spot order lifecycle', 'No spot order created');
  }

  // -- Prep B: Transfer spot USDT back to futures for margin tests --
  console.log('\n  -- Prep B: Transfer 3 USDT spot->futures --\n');
  await test('Prep B: transfer 3 USDT spot->future', async () => {
    const r = await callTool('transfer', {
      exchange: 'binance', code: 'USDT', amount: 3,
      from_account: 'spot', to_account: 'future',
    });
    const d = parseResult(r);
    console.log(`    -> result:`, JSON.stringify(d).slice(0, 200));
    return d;
  });

  // -- Test B: Futures limit order + cancel_all (use ETH, smaller notional) --
  console.log('\n  -- B: Futures Limit Order + cancel_all --\n');

  let ethSwapPrice = 0;
  await test('B1: get ETH/USDT:USDT futures price', async () => {
    const r = await callTool('get_ticker', {
      exchange: 'binanceusdm', symbol: 'ETH/USDT:USDT', market_type: 'swap',
    });
    const d = parseResult(r);
    ethSwapPrice = d.last;
    console.log(`    -> ETH futures price: ${ethSwapPrice}`);
    return d;
  });

  if (ethSwapPrice > 0) {
    const swapLimitPrice = Math.round(ethSwapPrice * 0.8 * 100) / 100;
    let swapOrderId = null;

    await test(`B2: create_order [futures limit buy long 0.02 ETH]`, async () => {
      const r = await callTool('create_order', {
        exchange: 'binanceusdm', symbol: 'ETH/USDT:USDT', type: 'limit',
        side: 'buy', amount: 0.02, price: swapLimitPrice,
        pos_side: 'long', market_type: 'swap',
      });
      const d = parseResult(r);
      swapOrderId = d.id;
      console.log(`    -> order id=${d.id} status=${d.status}`);
      return d;
    });

    if (swapOrderId) {
      await test('B3: cancel_all_orders [futures ETH/USDT:USDT]', async () => {
        const r = await callTool('cancel_all_orders', {
          exchange: 'binanceusdm', symbol: 'ETH/USDT:USDT', market_type: 'swap',
        });
        const d = parseResult(r);
        console.log(`    -> cancel_all result:`, JSON.stringify(d).slice(0, 200));
        return d;
      });
    }
  } else {
    skip('B2-B3: futures order lifecycle', 'No futures price');
  }

  // -- Test C: Spot market order (real trade) --
  console.log('\n  -- C: Spot Market Order (real trade) --\n');

  // Use 0.003 ETH (~$6 notional, just above 5 USDT min)
  let ethBought = false;
  await test('C1: create_order [spot market buy ETH/USDT 0.003]', async () => {
    const r = await callTool('create_order', {
      exchange: 'binance', symbol: 'ETH/USDT', type: 'market',
      side: 'buy', amount: 0.003, market_type: 'spot',
    });
    const d = parseResult(r);
    ethBought = true;
    console.log(`    -> id=${d.id} status=${d.status} filled=${d.filled} cost=${d.cost}`);
    return d;
  });

  if (ethBought) {
    await test('C2: create_order [spot market sell ETH/USDT 0.003]', async () => {
      const r = await callTool('create_order', {
        exchange: 'binance', symbol: 'ETH/USDT', type: 'market',
        side: 'sell', amount: 0.003, market_type: 'spot',
      });
      const d = parseResult(r);
      console.log(`    -> id=${d.id} status=${d.status} filled=${d.filled} cost=${d.cost}`);
      return d;
    });
  }

  await test('C3: get_my_trades shows recent ETH trades', async () => {
    const r = await callTool('get_my_trades', {
      exchange: 'binance', symbol: 'ETH/USDT', market_type: 'spot', limit: 5,
    });
    const d = parseResult(r);
    if (!Array.isArray(d)) throw new Error('Expected array');
    console.log(`    -> ${d.length} recent ETH/USDT trades`);
    return d;
  });

  // -- Test D: Futures market order (open + close, use ETH for smaller notional) --
  console.log('\n  -- D: Futures Market Order (open+close ETH) --\n');

  // Set ETH leverage first
  await test('D0: set_leverage [ETH/USDT:USDT 3x]', async () => {
    const r = await callTool('set_leverage', {
      exchange: 'binanceusdm', leverage: 3, symbol: 'ETH/USDT:USDT',
    });
    const d = parseResult(r);
    console.log(`    -> result:`, JSON.stringify(d).slice(0, 200));
    return d;
  });

  let dOpened = false;
  await test('D1: create_order [futures market buy long ETH 0.01]', async () => {
    const r = await callTool('create_order', {
      exchange: 'binanceusdm', symbol: 'ETH/USDT:USDT', type: 'market',
      side: 'buy', amount: 0.01, pos_side: 'long',
      market_type: 'swap',
    });
    const d = parseResult(r);
    dOpened = true;
    console.log(`    -> id=${d.id} status=${d.status}`);
    return d;
  });

  await test('D2: get_positions after open', async () => {
    const r = await callTool('get_positions', {
      exchange: 'binanceusdm', symbols: ['ETH/USDT:USDT'],
    });
    const d = parseResult(r);
    console.log(`    -> ${d.length} ETH positions`);
    for (const p of d) {
      console.log(`      side=${p.side} contracts=${p.contracts} pnl=${p.unrealizedPnl}`);
    }
    return d;
  });

  if (dOpened) {
    await test('D3: create_order [futures market sell long ETH 0.01 close]', async () => {
      const r = await callTool('create_order', {
        exchange: 'binanceusdm', symbol: 'ETH/USDT:USDT', type: 'market',
        side: 'sell', amount: 0.01, pos_side: 'long',
        market_type: 'swap',
      });
      const d = parseResult(r);
      console.log(`    -> id=${d.id} status=${d.status}`);
      return d;
    });
  } else {
    skip('D3: close futures position', 'D1 failed to open');
  }

  // Cleanup: transfer remaining USDT back from spot to futures
  console.log('\n  -- Cleanup: Transfer 3 USDT spot->futures --\n');
  await test('Cleanup: transfer 3 USDT spot->future', async () => {
    const r = await callTool('transfer', {
      exchange: 'binance', code: 'USDT', amount: 3,
      from_account: 'spot', to_account: 'future',
    });
    const d = parseResult(r);
    console.log(`    -> result:`, JSON.stringify(d).slice(0, 200));
    return d;
  });
}

// ===================================
// Summary
// ===================================
function printSummary() {
  console.log('\n=======================================');
  console.log('           TEST SUMMARY');
  console.log('=======================================\n');

  for (const r of results) {
    const icon = r.status === 'PASS' ? '[PASS]' : r.status === 'FAIL' ? '[FAIL]' : '[SKIP]';
    const extra = r.error ? ` (${r.error.slice(0, 80)})` : r.reason ? ` (${r.reason})` : '';
    console.log(`  ${icon} ${r.name}${extra}`);
  }

  console.log(`\n  Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}\n`);
}

main().catch(e => {
  console.error('Fatal:', e);
  if (child) child.kill();
  process.exit(1);
});
