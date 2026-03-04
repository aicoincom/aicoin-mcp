/**
 * Exchange Manager
 * Creates and caches ccxt exchange instances with AiCoin broker id injected
 */
import * as ccxt from 'ccxt';
import { getBrokerOptions } from './broker.js';

export const SUPPORTED_EXCHANGES = [
  'binance', 'binanceusdm', 'binancecoinm',
  'okx', 'bybit', 'bitget', 'gate',
  'huobi', 'hyperliquid',
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

function buildOptions(config: ExchangeConfig & { skipAuth?: boolean }): Record<string, unknown> {
  const { exchangeId, marketType, apiKey, secret, passphrase, skipAuth } = config;
  const id = exchangeId.toLowerCase();

  const key = skipAuth ? undefined : (apiKey || process.env[`${id.toUpperCase()}_API_KEY`]);
  const sec = skipAuth ? undefined : (secret || process.env[`${id.toUpperCase()}_SECRET`]);
  const pass = skipAuth ? undefined :
    (passphrase || process.env[`${id.toUpperCase()}_PASSPHRASE`]);

  const broker = getBrokerOptions(id);
  const timeout = Number(process.env.EXCHANGE_TIMEOUT) || 30000;

  const opts: Record<string, unknown> = {
    enableRateLimit: true,
    timeout,
    options: {
      ...broker.options,
      ...(marketType && marketType !== 'spot'
        ? { defaultType: marketType }
        : {}),
    },
  };

  if (Object.keys(broker.headers).length > 0) {
    opts.headers = broker.headers;
  }

  if (key) opts.apiKey = key;
  if (sec) opts.secret = sec;
  if (pass) opts.password = pass;

  const proxyUrl = process.env.PROXY_URL
    || process.env.HTTPS_PROXY || process.env.https_proxy
    || process.env.HTTP_PROXY || process.env.http_proxy
    || process.env.ALL_PROXY || process.env.all_proxy;
  if (proxyUrl) {
    if (proxyUrl.startsWith('socks')) {
      let socksUrl = proxyUrl;
      if (socksUrl.startsWith('socks5://')) {
        socksUrl = socksUrl.replace('socks5://', 'socks5h://');
      } else if (socksUrl.startsWith('socks4://')) {
        socksUrl = socksUrl.replace('socks4://', 'socks4a://');
      }
      opts.socksProxy = socksUrl;
    } else if (proxyUrl.startsWith('https://')) {
      opts.httpsProxy = proxyUrl;
    } else if (proxyUrl.startsWith('http://')) {
      opts.httpsProxy = proxyUrl;
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
  marketType?: MarketType,
  options?: { skipAuth?: boolean }
): ccxt.Exchange {
  const id = (exchangeId || process.env.DEFAULT_EXCHANGE || 'binance').toLowerCase();
  const type = marketType || 'spot';
  const skipAuth = options?.skipAuth ?? false;
  const key = `${id}:${type}${skipAuth ? ':pub' : ''}`;

  if (!cache[key]) {
    if (!SUPPORTED_EXCHANGES.includes(id)) {
      throw new Error(
        `Exchange '${id}' not supported. Available: ${SUPPORTED_EXCHANGES.join(', ')}`
      );
    }
    cache[key] = createInstance(id, buildOptions({ exchangeId: id, marketType: type, skipAuth }));
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
