#!/usr/bin/env node
/**
 * AiCoin API Tier Access Test
 * Tests all AiCoin API endpoints across 5 tier keys (free, basic, normal, premium, professional)
 * Usage: node test-tier-access.mjs
 */
import { createHmac, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const DOMAIN = 'https://open.aicoin.com';
const HL_ADDR = '0x72793d7a0a25fabc6cd68e5927bff39636e6a5de';

// IMPORTANT: api_key → AccessKeyId, access_key → HMAC secret
const TIERS = {
  free:         { keyId: 'ronJ8uI0Yj2soAfGVs5H1YALUIINbE22', secret: 'CWHZcH2us1CLSE7grroR1TpS0Z1JxTwU', rpm: 10 },
  basic:        { keyId: 'GyevLbk0VCJN3EfbZtydrcjW47z6jYQU', secret: 'UWOHFIDKlzSvSKHp0VCJN5RAt3uzEIRE', rpm: 10 },
  normal:       { keyId: 'DISq2bi5h0VCJN8ZzIuy6I58OK7kk16W', secret: 'TGDIGKSBxcfagTec0VCJN94JHw4DqKs0', rpm: 60 },
  premium:      { keyId: 'LWOvoR20VCJNCTnBtY6MnCLeF5OdgIJY', secret: 'YTTQ1OHMumgLbkaq0VCJNDfGWyOIGX3K', rpm: 120 },
  professional: { keyId: '21SN880VCJNGPzkY0CIypdksrK238FvQ', secret: 'QBUHSE57ikxfydTs0VCJNHk2NoAr9uls', rpm: 300 },
};

// ── Signature ──
function sign(keyId, secret) {
  const nonce = randomBytes(4).toString('hex');
  const ts = Math.floor(Date.now() / 1000).toString();
  const str = `AccessKeyId=${keyId}&SignatureNonce=${nonce}&Timestamp=${ts}`;
  const hex = createHmac('sha1', secret).update(str).digest('hex');
  const sig = Buffer.from(hex, 'binary').toString('base64');
  return { AccessKeyId: keyId, SignatureNonce: nonce, Timestamp: ts, Signature: sig };
}

// ── API call ──
const NOT_FOUND = ['not_exist', 'not found', 'no data', 'not_found', 'position not found'];

async function callApi(keyId, secret, method, path, params = {}, body = {}) {
  const auth = sign(keyId, secret);
  let url, opts;
  if (method === 'GET') {
    const qs = new URLSearchParams({ ...params, ...auth });
    url = `${DOMAIN}${path}?${qs}`;
    opts = { signal: AbortSignal.timeout(15000) };
  } else {
    url = `${DOMAIN}${path}`;
    opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, ...auth }),
      signal: AbortSignal.timeout(15000),
    };
  }
  try {
    const res = await fetch(url, opts);
    const status = res.status;
    const text = await res.text();
    if (status === 403) return { status, code: '403' };
    if (status === 401) return { status, code: '401' };
    if (status === 429) return { status, code: '429' };
    if (status === 500) return { status, code: '500' };
    if (status === 400) return { status, code: 'OK' }; // accessible, bad params
    try {
      const json = JSON.parse(text);
      if (json.success === false) {
        const ec = Number(json.errorCode ?? 0);
        const msg = String(json.error || json.message || '');
        // "not found" style errors mean endpoint IS accessible
        if (NOT_FOUND.some(p => msg.toLowerCase().includes(p))) return { status, code: 'OK', note: msg };
        if ([403, 304, 401].includes(ec)) return { status, code: '403', note: msg.slice(0, 80) };
        return { status, code: 'OK', note: `biz_${ec}` };
      }
      return { status, code: 'OK' };
    } catch { return { status, code: 'OK' }; }
  } catch (e) {
    return { status: 0, code: 'ERR', note: e.message?.slice(0, 60) };
  }
}

// ── Endpoint definitions (104 endpoints) ──
const E = [
  // ── v2: Coin Data ──
  { cat: 'Coin Data', tool: 'coin_info', act: 'list', m: 'GET', p: '/api/v2/coin' },
  { cat: 'Coin Data', tool: 'coin_info', act: 'ticker', m: 'GET', p: '/api/v2/coin/ticker', q: { coin_list: 'bitcoin' } },
  { cat: 'Coin Data', tool: 'coin_info', act: 'config', m: 'GET', p: '/api/v2/coin/config', q: { coin_list: 'bitcoin' } },
  { cat: 'Coin Data', tool: 'coin_info', act: 'ai_analysis', m: 'POST', p: '/api/v2/content/ai-coins', b: { coinKeys: ['bitcoin'] } },

  // ── v2: Market Data ──
  { cat: 'Market Data', tool: 'market_info', act: 'exchanges', m: 'GET', p: '/api/v2/market' },
  { cat: 'Market Data', tool: 'market_info', act: 'ticker', m: 'GET', p: '/api/v2/market/ticker', q: { market_list: 'binance' } },
  { cat: 'Market Data', tool: 'market_info', act: 'hot_coins', m: 'GET', p: '/api/v2/market/hotTabCoins', q: { key: 'defi' } },
  { cat: 'Market Data', tool: 'market_info', act: 'futures_interest', m: 'GET', p: '/api/v2/futures/interest' },

  // ── v2: K-line ──
  { cat: 'K-line', tool: 'kline', act: 'data', m: 'GET', p: '/api/v2/commonKline/dataRecords', q: { symbol: 'btcusdt:okex', size: '5' } },
  { cat: 'K-line', tool: 'kline', act: 'indicator', m: 'GET', p: '/api/v2/indicatorKline/dataRecords', q: { symbol: 'btcusdt:okex', indicator_key: 'fundflow', size: '5' } },
  { cat: 'K-line', tool: 'kline', act: 'trading_pair', m: 'GET', p: '/api/v2/indicatorKline/getTradingPair' },

  // ── v2: Index ──
  { cat: 'Index', tool: 'index_data', act: 'price', m: 'GET', p: '/api/v2/index/indexPrice', q: { key: 'i:diniw:ice' } },
  { cat: 'Index', tool: 'index_data', act: 'info', m: 'GET', p: '/api/v2/index/indexInfo', q: { key: 'i:diniw:ice' } },
  { cat: 'Index', tool: 'index_data', act: 'list', m: 'GET', p: '/api/v2/index/getIndex' },

  // ── v2: Content ──
  { cat: 'Content', tool: 'news', act: 'list', m: 'GET', p: '/api/v2/content/news-list', q: { pageSize: '5' } },
  { cat: 'Content', tool: 'news', act: 'detail', m: 'GET', p: '/api/v2/content/news-detail', q: { id: '999999' } },
  { cat: 'Content', tool: 'news', act: 'rss', m: 'GET', p: '/api/v2/content/square/market/news-list', q: { pageSize: '5' } },
  { cat: 'Content', tool: 'flash', act: 'newsflash', m: 'GET', p: '/api/v2/content/newsflash' },
  { cat: 'Content', tool: 'flash', act: 'list', m: 'GET', p: '/api/v2/content/flashList' },
  { cat: 'Content', tool: 'flash', act: 'exchange_listing', m: 'GET', p: '/api/v2/content/exchange-listing-flash' },

  // ── v2: Features ──
  { cat: 'Features', tool: 'market_overview', act: 'nav', m: 'GET', p: '/api/v2/mix/nav' },
  { cat: 'Features', tool: 'market_overview', act: 'ls_ratio', m: 'GET', p: '/api/v2/mix/ls-ratio' },
  { cat: 'Features', tool: 'market_overview', act: 'liquidation', m: 'GET', p: '/api/v2/mix/liq' },
  { cat: 'Features', tool: 'market_overview', act: 'grayscale_trust', m: 'GET', p: '/api/v2/mix/grayscale-trust' },
  { cat: 'Features', tool: 'market_overview', act: 'gray_scale', m: 'GET', p: '/api/v2/mix/gray-scale', q: { coins: 'btc' } },
  { cat: 'Features', tool: 'market_overview', act: 'stock_market', m: 'GET', p: '/api/v2/mix/stock-market' },
  { cat: 'Features', tool: 'order_flow', act: 'big_orders', m: 'GET', p: '/api/v2/order/bigOrder', q: { symbol: 'btcswapusdt:binance' } },
  { cat: 'Features', tool: 'order_flow', act: 'agg_trades', m: 'GET', p: '/api/v2/order/aggTrade', q: { symbol: 'btcswapusdt:binance' } },
  { cat: 'Features', tool: 'trading_pair', act: 'ticker', m: 'GET', p: '/api/v2/trading-pair/ticker', q: { key_list: 'btcusdt:okex' } },
  { cat: 'Features', tool: 'trading_pair', act: 'by_market', m: 'GET', p: '/api/v2/trading-pair/getTradingPair', q: { market: 'binance' } },
  { cat: 'Features', tool: 'trading_pair', act: 'list', m: 'GET', p: '/api/v2/trading-pair', q: { market: 'binance' } },
  { cat: 'Features', tool: 'signal_data', act: 'strategy', m: 'GET', p: '/api/v2/signal/strategySignal' },
  { cat: 'Features', tool: 'signal_data', act: 'alert', m: 'GET', p: '/api/v2/signal/signalAlert' },
  { cat: 'Features', tool: 'signal_data', act: 'config', m: 'GET', p: '/api/v2/signal/signalAlertConf' },
  { cat: 'Features', tool: 'signal_data', act: 'alert_list', m: 'GET', p: '/api/v2/signal/getSignalAlertSetList' },
  { cat: 'Features', tool: 'signal_data', act: 'change', m: 'GET', p: '/api/v2/signal/changeSignal' },
  { cat: 'Features', tool: 'signal_manage', act: 'delete', m: 'GET', p: '/api/v2/signal/delSignalAlert', q: { id: '999999' } },

  // ── Upgrade: Futures ──
  { cat: 'Futures', tool: 'coin_funding_rate', act: 'default', m: 'GET', p: '/api/upgrade/v2/futures/funding-rate/history', q: { symbol: 'btcswapusdt:binance', interval: '8h', limit: '5' } },
  { cat: 'Futures', tool: 'coin_funding_rate', act: 'weighted', m: 'GET', p: '/api/upgrade/v2/futures/funding-rate/vol-weight-history', q: { symbol: 'btcswapusdt', interval: '8h', limit: '5' } },
  { cat: 'Futures', tool: 'coin_liquidation', act: 'history', m: 'GET', p: '/api/upgrade/v2/futures/liquidation/history', q: { symbol: 'btcswapusdt:binance', interval: '15m', limit: '5' } },
  { cat: 'Futures', tool: 'coin_liquidation', act: 'map', m: 'GET', p: '/api/upgrade/v2/futures/liquidation/map', q: { dbkey: 'btcswapusdt:binance', cycle: '24h' } },
  { cat: 'Futures', tool: 'coin_liquidation', act: 'estimated', m: 'GET', p: '/api/upgrade/v2/futures/estimated-liquidation/history', q: { dbkey: 'btcswapusdt:binance', cycle: '24h', limit: '5' } },
  { cat: 'Futures', tool: 'coin_open_interest', act: 'stablecoin', m: 'GET', p: '/api/upgrade/v2/futures/open-interest/aggregated-stablecoin-history', q: { symbol: 'BTC', interval: '15m', limit: '5' } },
  { cat: 'Futures', tool: 'coin_open_interest', act: 'coin', m: 'GET', p: '/api/upgrade/v2/futures/open-interest/aggregated-coin-margin-history', q: { symbol: 'BTC', interval: '15m', limit: '5' } },
  { cat: 'Futures', tool: 'coin_futures_data', act: 'historical_depth', m: 'GET', p: '/api/upgrade/v2/futures/historical-depth', q: { key: 'btcswapusdt:binance', limit: '5' } },
  { cat: 'Futures', tool: 'coin_futures_data', act: 'super_depth', m: 'GET', p: '/api/upgrade/v2/futures/super-depth/history', q: { key: 'btcswapusdt:binance', amount: '10000', limit: '5' } },
  { cat: 'Futures', tool: 'coin_futures_data', act: 'trade_data', m: 'GET', p: '/api/upgrade/v2/futures/trade-data', q: { dbkey: 'btcswapusdt:binance', limit: '5' } },

  // ── Upgrade: Depth ──
  { cat: 'Depth', tool: 'depth', act: 'latest', m: 'GET', p: '/api/upgrade/v2/futures/latest-depth', q: { dbKey: 'btcswapusdt:binance' } },
  { cat: 'Depth', tool: 'depth', act: 'full', m: 'GET', p: '/api/upgrade/v2/futures/full-depth', q: { dbKey: 'btcswapusdt:binance' } },
  { cat: 'Depth', tool: 'depth', act: 'grouped', m: 'GET', p: '/api/upgrade/v2/futures/full-depth/grouped', q: { dbKey: 'btcswapusdt:binance', groupSize: '100' } },

  // ── Upgrade: Crypto Stock ──
  { cat: 'Crypto Stock', tool: 'crypto_stock', act: 'quotes', m: 'GET', p: '/api/upgrade/v2/crypto_stock/quotes' },
  { cat: 'Crypto Stock', tool: 'crypto_stock', act: 'top_gainer', m: 'GET', p: '/api/upgrade/v2/crypto_stock/top-gainer', q: { limit: '5' } },
  { cat: 'Crypto Stock', tool: 'crypto_stock', act: 'company', m: 'GET', p: '/api/upgrade/v2/crypto_stock/company/i:mstr:nasdaq' },

  // ── Upgrade: Coin Treasury ──
  { cat: 'Coin Treasury', tool: 'coin_treasury', act: 'entities', m: 'POST', p: '/api/upgrade/v2/coin-treasuries/entities', b: { coin: 'BTC' } },
  { cat: 'Coin Treasury', tool: 'coin_treasury', act: 'history', m: 'POST', p: '/api/upgrade/v2/coin-treasuries/history', b: { coin: 'BTC' } },
  { cat: 'Coin Treasury', tool: 'coin_treasury', act: 'accumulated', m: 'POST', p: '/api/upgrade/v2/coin-treasuries/history/accumulated', b: { coin: 'BTC' } },
  { cat: 'Coin Treasury', tool: 'coin_treasury', act: 'latest_entities', m: 'GET', p: '/api/upgrade/v2/coin-treasuries/latest/entities', q: { coin: 'BTC' } },
  { cat: 'Coin Treasury', tool: 'coin_treasury', act: 'latest_history', m: 'GET', p: '/api/upgrade/v2/coin-treasuries/latest/history', q: { coin: 'BTC' } },
  { cat: 'Coin Treasury', tool: 'coin_treasury', act: 'summary', m: 'GET', p: '/api/upgrade/v2/coin-treasuries/summary', q: { coin: 'BTC' } },

  // ── Upgrade: HL Tickers & Whales ──
  { cat: 'HL Ticker', tool: 'hl_ticker', act: 'all', m: 'GET', p: '/api/upgrade/v2/hl/tickers' },
  { cat: 'HL Ticker', tool: 'hl_ticker', act: 'single', m: 'GET', p: '/api/upgrade/v2/hl/tickers/coin/BTC' },
  { cat: 'HL Whale', tool: 'hl_whale', act: 'positions', m: 'GET', p: '/api/upgrade/v2/hl/whales/open-positions' },
  { cat: 'HL Whale', tool: 'hl_whale', act: 'events', m: 'GET', p: '/api/upgrade/v2/hl/whales/latest-events' },
  { cat: 'HL Whale', tool: 'hl_whale', act: 'directions', m: 'GET', p: '/api/upgrade/v2/hl/whales/directions' },
  { cat: 'HL Whale', tool: 'hl_whale', act: 'history_ratio', m: 'GET', p: '/api/upgrade/v2/hl/whales/history-long-ratio' },

  // ── Upgrade: HL Liquidation & OI ──
  { cat: 'HL Liquidation', tool: 'hl_liquidation', act: 'history', m: 'GET', p: '/api/upgrade/v2/hl/liquidations/history' },
  { cat: 'HL Liquidation', tool: 'hl_liquidation', act: 'stats', m: 'GET', p: '/api/upgrade/v2/hl/liquidations/stat' },
  { cat: 'HL Liquidation', tool: 'hl_liquidation', act: 'stats_by_coin', m: 'GET', p: '/api/upgrade/v2/hl/liquidations/stat-by-coin' },
  { cat: 'HL Liquidation', tool: 'hl_liquidation', act: 'top_positions', m: 'GET', p: '/api/upgrade/v2/hl/liquidations/top-positions' },
  { cat: 'HL OI', tool: 'hl_open_interest', act: 'summary', m: 'GET', p: '/api/upgrade/v2/hl/open-interest/summary' },
  { cat: 'HL OI', tool: 'hl_open_interest', act: 'top_coins', m: 'GET', p: '/api/upgrade/v2/hl/open-interest/top-coins' },
  { cat: 'HL OI', tool: 'hl_open_interest', act: 'history', m: 'GET', p: '/api/upgrade/v2/hl/open-interest/history/BTC' },

  // ── Upgrade: HL Taker ──
  { cat: 'HL Taker', tool: 'hl_taker', act: 'delta', m: 'GET', p: '/api/upgrade/v2/hl/accumulated-taker-delta/BTC' },
  { cat: 'HL Taker', tool: 'hl_taker', act: 'klines', m: 'GET', p: '/api/upgrade/v2/hl/klines-with-taker-vol/BTC/4h' },

  // ── Upgrade: HL Trader ──
  { cat: 'HL Trader', tool: 'hl_trader', act: 'stats', m: 'GET', p: `/api/upgrade/v2/hl/traders/${HL_ADDR}/addr-stat` },
  { cat: 'HL Trader', tool: 'hl_trader', act: 'best_trades', m: 'GET', p: `/api/upgrade/v2/hl/traders/${HL_ADDR}/best-trades`, q: { period: '30' } },
  { cat: 'HL Trader', tool: 'hl_trader', act: 'performance', m: 'GET', p: `/api/upgrade/v2/hl/traders/${HL_ADDR}/performance-by-coin`, q: { period: '30' } },
  { cat: 'HL Trader', tool: 'hl_trader', act: 'completed_trades', m: 'GET', p: `/api/upgrade/v2/hl/traders/${HL_ADDR}/completed-trades` },
  { cat: 'HL Trader', tool: 'hl_trader', act: 'accounts', m: 'POST', p: '/api/upgrade/v2/hl/traders/accounts', b: { addresses: [HL_ADDR] } },
  { cat: 'HL Trader', tool: 'hl_trader', act: 'statistics', m: 'POST', p: '/api/upgrade/v2/hl/traders/statistics', b: { addresses: [HL_ADDR] } },

  // ── Upgrade: HL Fills ──
  { cat: 'HL Fills', tool: 'hl_fills', act: 'by_address', m: 'GET', p: `/api/upgrade/v2/hl/fills/${HL_ADDR}` },
  { cat: 'HL Fills', tool: 'hl_fills', act: 'by_oid', m: 'GET', p: '/api/upgrade/v2/hl/fills/oid/999999' },
  { cat: 'HL Fills', tool: 'hl_fills', act: 'by_twapid', m: 'GET', p: '/api/upgrade/v2/hl/fills/twapid/999999' },
  { cat: 'HL Fills', tool: 'hl_fills', act: 'top_trades', m: 'GET', p: '/api/upgrade/v2/hl/fills/top-trades' },

  // ── Upgrade: HL Orders ──
  { cat: 'HL Orders', tool: 'hl_orders', act: 'latest', m: 'GET', p: `/api/upgrade/v2/hl/orders/${HL_ADDR}/latest` },
  { cat: 'HL Orders', tool: 'hl_orders', act: 'by_oid', m: 'GET', p: '/api/upgrade/v2/hl/orders/oid/999999' },
  { cat: 'HL Orders', tool: 'hl_orders', act: 'filled', m: 'GET', p: `/api/upgrade/v2/hl/filled-orders/${HL_ADDR}/latest` },
  { cat: 'HL Orders', tool: 'hl_orders', act: 'filled_by_oid', m: 'GET', p: '/api/upgrade/v2/hl/filled-orders/oid/999999' },
  { cat: 'HL Orders', tool: 'hl_orders', act: 'top_open', m: 'GET', p: '/api/upgrade/v2/hl/orders/top-open-orders' },
  { cat: 'HL Orders', tool: 'hl_orders', act: 'active_stats', m: 'GET', p: '/api/upgrade/v2/hl/orders/active-stats' },
  { cat: 'HL Orders', tool: 'hl_orders', act: 'twap_states', m: 'GET', p: `/api/upgrade/v2/hl/twap-states/${HL_ADDR}/latest` },

  // ── Upgrade: HL Position ──
  { cat: 'HL Position', tool: 'hl_position', act: 'current_history', m: 'GET', p: `/api/upgrade/v2/hl/traders/${HL_ADDR}/current-position-history/BTC` },
  { cat: 'HL Position', tool: 'hl_position', act: 'completed_history', m: 'GET', p: `/api/upgrade/v2/hl/traders/${HL_ADDR}/completed-position-history/BTC`, q: { startTime: '0' } },
  { cat: 'HL Position', tool: 'hl_position', act: 'current_pnl', m: 'GET', p: `/api/upgrade/v2/hl/traders/${HL_ADDR}/current-position-pnl/BTC`, q: { interval: '4h' } },
  { cat: 'HL Position', tool: 'hl_position', act: 'completed_pnl', m: 'GET', p: `/api/upgrade/v2/hl/traders/${HL_ADDR}/completed-position-pnl/BTC`, q: { interval: '4h', startTime: '0' } },
  { cat: 'HL Position', tool: 'hl_position', act: 'current_executions', m: 'GET', p: `/api/upgrade/v2/hl/traders/${HL_ADDR}/current-position-executions/BTC`, q: { interval: '4h' } },
  { cat: 'HL Position', tool: 'hl_position', act: 'completed_executions', m: 'GET', p: `/api/upgrade/v2/hl/traders/${HL_ADDR}/completed-position-executions/BTC`, q: { interval: '4h', startTime: '0' } },

  // ── Upgrade: HL Portfolio ──
  { cat: 'HL Portfolio', tool: 'hl_portfolio', act: 'portfolio', m: 'GET', p: `/api/upgrade/v2/hl/portfolio/${HL_ADDR}/week` },
  { cat: 'HL Portfolio', tool: 'hl_portfolio', act: 'pnls', m: 'GET', p: `/api/upgrade/v2/hl/pnls/${HL_ADDR}` },
  { cat: 'HL Portfolio', tool: 'hl_portfolio', act: 'max_drawdown', m: 'GET', p: `/api/upgrade/v2/hl/max-drawdown/${HL_ADDR}`, q: { days: '30' } },
  { cat: 'HL Portfolio', tool: 'hl_portfolio', act: 'net_flow', m: 'GET', p: `/api/upgrade/v2/hl/ledger-updates/net-flow/${HL_ADDR}`, q: { days: '30' } },

  // ── Upgrade: HL Advanced ──
  { cat: 'HL Advanced', tool: 'hl_advanced', act: 'info', m: 'POST', p: '/api/upgrade/v2/hl/info', b: { type: 'allMids' } },
  { cat: 'HL Advanced', tool: 'hl_advanced', act: 'smart_find', m: 'POST', p: '/api/upgrade/v2/hl/smart/find', b: {} },
  { cat: 'HL Advanced', tool: 'hl_advanced', act: 'discover', m: 'POST', p: '/api/upgrade/v2/hl/traders/discover', b: {} },
];

// ── Rate-limited test runner ──
const sleep = ms => new Promise(r => setTimeout(r, ms));
const progress = {};

async function testTier(tierName, creds, startDelay = 0) {
  if (startDelay) await sleep(startDelay);
  // Extra buffer to avoid "请求过于频繁"
  const delay = Math.ceil(60000 / creds.rpm) + 500;
  const results = [];
  for (let i = 0; i < E.length; i++) {
    const ep = E[i];
    progress[tierName] = `${i + 1}/${E.length}`;
    printProgress();

    let res;
    for (let retry = 0; retry < 3; retry++) {
      res = await callApi(creds.keyId, creds.secret, ep.m, ep.p, ep.q, ep.b);
      // Retry on 429 or rate-limit 403
      if (res.code !== '429' && !(res.code === '403' && res.note?.includes('频繁'))) break;
      const wait = (retry + 1) * 15000;
      progress[tierName] = `${i + 1}/${E.length} (retry ${retry + 1}, wait ${wait/1000}s)`;
      printProgress();
      await sleep(wait);
    }
    results.push({ ...ep, result: res });
    if (i < E.length - 1) await sleep(delay);
  }
  progress[tierName] = 'done';
  printProgress();
  return results;
}

function printProgress() {
  const parts = Object.entries(progress).map(([t, v]) => `${t}:${v}`).join(' | ');
  process.stderr.write(`\r  ${parts}    `);
}

// ── Markdown report generator ──
function icon(code) {
  if (code === 'OK') return '✅';
  if (code === '403') return '🔒';
  if (code === '500') return '⚠️';
  if (code === '429') return '⏳';
  return '❌';
}

function generateReport(allResults) {
  const tiers = ['free', 'basic', 'normal', 'premium', 'professional'];
  const lines = [];
  lines.push('# AiCoin API Tier Access Report');
  lines.push('');
  lines.push(`> Test date: ${new Date().toISOString().split('T')[0]}`);
  lines.push(`> Endpoints tested: ${E.length}`);
  lines.push(`> Tiers: Free (built-in) | Basic (基础版) | Normal (标准版) | Premium (高级版) | Professional (专业版)`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push('| Tier | ✅ Accessible | 🔒 Locked | ⚠️ Error |');
  lines.push('|------|:---:|:---:|:---:|');
  for (const t of tiers) {
    const data = allResults[t];
    const ok = data.filter(r => r.result.code === 'OK').length;
    const locked = data.filter(r => r.result.code === '403').length;
    const err = data.filter(r => !['OK', '403'].includes(r.result.code)).length;
    lines.push(`| ${t} | ${ok} | ${locked} | ${err} |`);
  }
  lines.push('');

  // Legend
  lines.push('## Legend');
  lines.push('');
  lines.push('- ✅ = Accessible (200 OK or 400 bad params)');
  lines.push('- 🔒 = Tier Locked (403 Forbidden)');
  lines.push('- ⚠️ = Server Error (500)');
  lines.push('- ⏳ = Rate Limited (429)');
  lines.push('- ❌ = Network Error');
  lines.push('');

  // Detailed results by category
  let lastCat = '';
  let idx = 0;
  for (let i = 0; i < E.length; i++) {
    const ep = E[i];
    if (ep.cat !== lastCat) {
      if (lastCat) lines.push('');
      lines.push(`### ${ep.cat}`);
      lines.push('');
      lines.push('| # | Tool | Action | API Endpoint | Free | Basic | Normal | Premium | Pro |');
      lines.push('|--:|------|--------|-------------|:---:|:---:|:---:|:---:|:---:|');
      lastCat = ep.cat;
    }
    idx++;
    const shortPath = ep.p.replace('/api/v2/', '').replace('/api/upgrade/v2/', '⬆ ');
    const cells = tiers.map(t => icon(allResults[t][i].result.code));
    lines.push(`| ${idx} | ${ep.tool} | ${ep.act} | ${shortPath} | ${cells.join(' | ')} |`);
  }
  lines.push('');

  // Notes
  lines.push('## Notes');
  lines.push('');
  lines.push('- `⬆` prefix = upgrade endpoint (`/api/upgrade/v2/...`), requires paid tier');
  lines.push('- Exchange trading tools (CCXT) are not tier-dependent and excluded from this test');
  lines.push('- `guide` tool returns static text and is excluded');
  lines.push('- `signal_manage.delete` tested with invalid ID (999999) — backend may return 403 for "id not found"');
  lines.push('');

  return lines.join('\n');
}

// ── Main ──
async function main() {
  console.error(`\nTesting ${E.length} endpoints across 5 tiers...\n`);
  const allResults = {};

  // Run all tiers in parallel, staggered by 2s to avoid IP burst
  let stagger = 0;
  const tasks = Object.entries(TIERS).map(([name, creds]) => {
    const delay = stagger;
    stagger += 2000;
    return (async () => { allResults[name] = await testTier(name, creds, delay); })();
  });
  await Promise.all(tasks);

  console.error('\n\nDone! Generating report...\n');

  // Save raw JSON
  const jsonData = {};
  for (const [tier, results] of Object.entries(allResults)) {
    jsonData[tier] = results.map(r => ({
      tool: r.tool, action: r.act, endpoint: r.p,
      status: r.result.status, code: r.result.code, note: r.result.note,
    }));
  }
  writeFileSync('tier-test-results.json', JSON.stringify(jsonData, null, 2));
  console.error('  → tier-test-results.json');

  // Generate and save markdown
  const md = generateReport(allResults);
  writeFileSync('TIER-ACCESS.md', md);
  console.error('  → TIER-ACCESS.md');
}

main().catch(e => { console.error(e); process.exit(1); });
