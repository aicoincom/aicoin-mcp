#!/usr/bin/env node
/**
 * 测试 3 个返回 500 的 Hyperliquid 接口
 * 使用方式：node test-500-endpoints.mjs
 */
import { createHmac, randomBytes } from 'node:crypto';

const DOMAIN = 'https://open.aicoin.com';
const ADDR = '0x72793d7a0a25fabc6cd68e5927bff39636e6a5de';

// 专业版 key
const KEY_ID = '21SN880VCJNGPzkY0CIypdksrK238FvQ';
const SECRET = 'QBUHSE57ikxfydTs0VCJNHk2NoAr9uls';

function sign() {
  const nonce = randomBytes(4).toString('hex');
  const ts = Math.floor(Date.now() / 1000).toString();
  const str = `AccessKeyId=${KEY_ID}&SignatureNonce=${nonce}&Timestamp=${ts}`;
  const hex = createHmac('sha1', SECRET).update(str).digest('hex');
  const sig = Buffer.from(hex, 'binary').toString('base64');
  return { AccessKeyId: KEY_ID, SignatureNonce: nonce, Timestamp: ts, Signature: sig };
}

const ENDPOINTS = [
  {
    name: 'hl_get_top_liquidated_positions',
    path: '/api/upgrade/v2/hl/liquidations/top-positions',
    params: {},
  },
  {
    name: 'hl_get_max_drawdown',
    path: `/api/upgrade/v2/hl/max-drawdown/${ADDR}`,
    params: { days: '30' },
  },
  {
    name: 'hl_get_top_trades',
    path: '/api/upgrade/v2/hl/fills/top-trades',
    params: {},
  },
];

async function test(ep) {
  const qs = new URLSearchParams({ ...ep.params, ...sign() });
  const url = `${DOMAIN}${ep.path}?${qs}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const body = await res.text();
  return { status: res.status, body: body.slice(0, 200) };
}

console.log('Testing 3 endpoints with Professional key...\n');

for (const ep of ENDPOINTS) {
  const { status, body } = await test(ep);
  const icon = status === 200 ? '✅' : '❌';
  console.log(`${icon} ${ep.name}`);
  console.log(`   HTTP ${status}  ${body}`);
  console.log(`   ${DOMAIN}${ep.path}`);
  console.log();
}
