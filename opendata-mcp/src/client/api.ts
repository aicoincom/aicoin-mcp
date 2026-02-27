/**
 * AiCoin Open API HTTP client with auto-signing
 */
import { generateSignature } from './signature.js';

const DOMAIN =
  process.env.AICOIN_BASE_URL ||
  'https://open.aicoin.com';

const TIMEOUT_MS = 30_000;

const AUTH_GUIDE =
  '\n\n--- How to fix ---\n' +
  '1. Visit https://www.aicoin.com/opendata\n' +
  '2. Register/login and create an API key\n' +
  '3. Set AICOIN_ACCESS_KEY_ID and ' +
  'AICOIN_ACCESS_SECRET in your MCP config\n' +
  '4. Restart your MCP client';

const UPGRADE_GUIDE =
  '\n\n--- How to fix ---\n' +
  'Your current API tier lacks permission ' +
  'for this endpoint.\n' +
  '1. Visit https://www.aicoin.com/opendata\n' +
  '2. Upgrade your API key tier\n' +
  'Tiers: Basic(free) | Normal(¥99) | ' +
  'Premium(¥299) | Professional(¥999)';

function throwApiError(
  status: number,
  body: string,
  path: string
): never {
  let msg = `API ${status}: ${body}`;
  if (status === 401) {
    msg += AUTH_GUIDE;
  } else if (status === 403) {
    msg += UPGRADE_GUIDE;
    msg += `\nEndpoint: ${path}`;
  }
  throw new Error(msg);
}

function getCredentials() {
  const key = process.env.AICOIN_ACCESS_KEY_ID;
  const secret = process.env.AICOIN_ACCESS_SECRET;
  if (!key || !secret) {
    throw new Error(
      'Missing AICOIN_ACCESS_KEY_ID or ' +
        'AICOIN_ACCESS_SECRET. ' +
        'Register at https://www.aicoin.com/opendata' +
        ' to get your API credentials.'
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
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text();
    throwApiError(res.status, body, path);
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
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const txt = await res.text();
    throwApiError(res.status, txt, path);
  }
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { raw: txt };
  }
}
