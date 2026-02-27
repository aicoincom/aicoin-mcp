/**
 * Exchange Manager
 * Creates and caches ccxt exchange instances with AiCoin broker id injected
 */
import * as ccxt from 'ccxt';
import { getBrokerOptions } from './broker.js';

export const SUPPORTED_EXCHANGES = [
  'binance', 'binanceusdm', 'binancecoinm',
  'okx', 'bybit', 'bitget', 'gate',
  'huobi', 'pionex', 'hyperliquid',
];

const cache: Record<string, ccxt.Exchange> = {};

export type MarketType = 'spot' | 'future' | 'swap' | 'option' | 'margin';

interface ExchangeConfig {
  exchangeId: string;
  marketType?: MarketType;
  apiKey?: string;
  secret?: string;
  passphrase?: string;
}

function buildOptions(config: ExchangeConfig): Record<string, unknown> {
  const { exchangeId, marketType, apiKey, secret, passphrase } = config;
  const id = exchangeId.toLowerCase();

  // Read credentials from env if not provided
  const key = apiKey || process.env[`${id.toUpperCase()}_API_KEY`];
  const sec = secret || process.env[`${id.toUpperCase()}_SECRET`];
  const pass =
    passphrase || process.env[`${id.toUpperCase()}_PASSPHRASE`];

  // Merge broker options + headers
  const broker = getBrokerOptions(id);
  const opts: Record<string, unknown> = {
    enableRateLimit: true,
    options: {
      ...broker.options,
      ...(marketType && marketType !== 'spot'
        ? { defaultType: marketType }
        : {}),
    },
  };

  // Inject broker headers (Bybit, Bitget, Gate)
  if (Object.keys(broker.headers).length > 0) {
    opts.headers = broker.headers;
  }

  if (key) opts.apiKey = key;
  if (sec) opts.secret = sec;
  if (pass) opts.password = pass;

  // Proxy support via ccxt built-in proxy settings.
  const proxyUrl = process.env.PROXY_URL;
  if (process.env.USE_PROXY === 'true' && proxyUrl) {
    if (proxyUrl.startsWith('socks')) {
      opts.socksProxy = proxyUrl;
    } else if (proxyUrl.startsWith('https://')) {
      opts.httpsProxy = proxyUrl;
    } else if (proxyUrl.startsWith('http://')) {
      opts.httpProxy = proxyUrl;
    }
  }

  return opts;
}

function createInstance(id: string, opts: Record<string, unknown>): ccxt.Exchange {
  const ExchangeClass = (ccxt as Record<string, unknown>)[id];
  if (typeof ExchangeClass !== 'function') {
    throw new Error(`Exchange '${id}' is not available in ccxt`);
  }
  return new (ExchangeClass as new (o: Record<string, unknown>) => ccxt.Exchange)(opts);
}

/**
 * Get a cached exchange instance (uses env credentials)
 */
export function getExchange(
  exchangeId?: string,
  marketType?: MarketType
): ccxt.Exchange {
  const id = (exchangeId || process.env.DEFAULT_EXCHANGE || 'binance').toLowerCase();
  const type = marketType || 'spot';
  const key = `${id}:${type}`;

  if (!cache[key]) {
    if (!SUPPORTED_EXCHANGES.includes(id)) {
      throw new Error(
        `Exchange '${id}' not supported. Available: ${SUPPORTED_EXCHANGES.join(', ')}`
      );
    }
    cache[key] = createInstance(id, buildOptions({ exchangeId: id, marketType: type }));
  }
  return cache[key];
}

/**
 * Create a one-off exchange instance with explicit credentials (not cached)
 */
export function createExchange(config: ExchangeConfig): ccxt.Exchange {
  const id = config.exchangeId.toLowerCase();
  if (!SUPPORTED_EXCHANGES.includes(id)) {
    throw new Error(`Exchange '${id}' not supported`);
  }
  return createInstance(id, buildOptions(config));
}

export function clearCache(): void {
  for (const key of Object.keys(cache)) {
    delete cache[key];
  }
}
