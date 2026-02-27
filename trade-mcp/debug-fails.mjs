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
    try { const msg = JSON.parse(line); const cb = pending.get(msg.id); if (cb) { pending.delete(msg.id); cb(msg); } } catch {}
  }
});
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++reqId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('timeout')); }, 60000);
    pending.set(id, (msg) => { clearTimeout(timer); resolve(msg); });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}
async function run() {
  await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } });
  await call('notifications/initialized', {});

  // Debug get_tickers
  console.log('=== get_tickers raw response ===');
  const r1 = await call('tools/call', { name: 'get_tickers', arguments: { exchange: 'binance', symbols: ['BTC/USDT', 'ETH/USDT'] } });
  console.log(JSON.stringify(r1.result?.content?.[0]?.text?.slice(0, 500)));

  // Debug get_funding_rates
  console.log('\n=== get_funding_rates raw response ===');
  const r2 = await call('tools/call', { name: 'get_funding_rates', arguments: { exchange: 'binance', symbol: 'BTC/USDT:USDT' } });
  console.log(JSON.stringify(r2.result?.content?.[0]?.text?.slice(0, 500)));

  // Debug get_markets
  console.log('\n=== get_markets raw response (first 500 chars) ===');
  const r3 = await call('tools/call', { name: 'get_markets', arguments: { exchange: 'bybit' } });
  console.log(JSON.stringify(r3.result?.content?.[0]?.text?.slice(0, 500)));

  child.kill();
}
run().catch(e => { console.error(e); child.kill(); process.exit(1); });
