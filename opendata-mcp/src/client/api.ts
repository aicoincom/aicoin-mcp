/**
 * AiCoin Open API HTTP client with auto-signing
 */
import { generateSignature } from './signature.js';

const DOMAIN =
  process.env.AICOIN_BASE_URL ||
  'https://open.aicoin.com';

function getCredentials() {
  const key = process.env.AICOIN_ACCESS_KEY;
  const secret = process.env.AICOIN_ACCESS_SECRET;
  if (!key || !secret) {
    throw new Error(
      'Missing AICOIN_ACCESS_KEY or AICOIN_ACCESS_SECRET'
    );
  }
  return { key, secret };
}

/**
 * GET request with auto-signing
 * @param path - API path, e.g. '/api/v2/coin'
 */
export async function apiGet(
  path: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const { key, secret } = getCredentials();
  const auth = generateSignature(key, secret);

  const qs = new URLSearchParams({
    ...params,
    ...auth,
  });

  const url = `${DOMAIN}${path}?${qs.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * POST request with auto-signing
 * @param path - API path
 * @param body - JSON body (auth params added automatically)
 */
export async function apiPost(
  path: string,
  body: Record<string, unknown> = {}
): Promise<unknown> {
  const { key, secret } = getCredentials();
  const auth = generateSignature(key, secret);

  const url = `${DOMAIN}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, ...auth }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { raw: txt };
  }
}
