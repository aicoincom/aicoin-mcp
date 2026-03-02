/**
 * AiCoin Open API HTTP client with auto-signing
 */
import { generateSignature } from './signature.js';

const DOMAIN =
  process.env.AICOIN_BASE_URL ||
  'https://open.aicoin.com';

const TIMEOUT_MS = 30_000;

const UPGRADE_GUIDE =
  '\n\n--- How to fix ---\n' +
  'Your current API tier does not have access ' +
  'to this endpoint. Please upgrade your plan.\n' +
  '1. Visit https://www.aicoin.com/opendata ' +
  'to purchase or upgrade\n' +
  '2. Tiers: Basic(free) | Normal(¥99) | ' +
  'Premium(¥299) | Professional(¥999)\n' +
  '3. Set AICOIN_ACCESS_KEY_ID and ' +
  'AICOIN_ACCESS_SECRET in your MCP config\n' +
  '4. Restart your MCP client';

const AUTH_GUIDE =
  '\n\n--- How to fix ---\n' +
  'An API key is required to access this endpoint.\n' +
  '1. Visit https://www.aicoin.com/opendata ' +
  'to register and create an API key\n' +
  '2. Set AICOIN_ACCESS_KEY_ID and ' +
  'AICOIN_ACCESS_SECRET in your MCP config\n' +
  '3. Restart your MCP client';

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

/** Business-level error codes that mean "need auth/upgrade" */
const BIZ_AUTH_CODES = new Set([403, 401, 304]);

/**
 * Check parsed JSON for business-level errors.
 * Some endpoints return HTTP 200 with
 * { success: false, errorCode: 304 }.
 */
function checkBizError(
  data: unknown,
  path: string
): void {
  if (!data || typeof data !== 'object') return;
  const obj = data as Record<string, unknown>;
  if (obj.success === false) {
    const code = Number(obj.errorCode ?? 0);
    const errMsg =
      String(obj.error || obj.message || 'Unknown error');
    if (BIZ_AUTH_CODES.has(code)) {
      throw new Error(
        `Permission denied: ${errMsg}` +
          UPGRADE_GUIDE +
          `\nEndpoint: ${path}`
      );
    }
    throw new Error(
      `API error (${code}): ${errMsg}\nEndpoint: ${path}`
    );
  }
}

/* Built-in free-tier key (IP-rate-limited) */
const FREE_KEY = 'ronJ8uI0Yj2soAfGVs5H1YALUIINbE22';
const FREE_SECRET =
  'CWHZcH2us1CLSE7grroR1TpS0Z1JxTwU';

function getCredentials() {
  const key =
    process.env.AICOIN_ACCESS_KEY_ID || FREE_KEY;
  const secret =
    process.env.AICOIN_ACCESS_SECRET || FREE_SECRET;
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
    const json = JSON.parse(text);
    checkBizError(json, path);
    return json;
  } catch (e) {
    if (e instanceof SyntaxError) return { raw: text };
    throw e;
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
    const json = JSON.parse(txt);
    checkBizError(json, path);
    return json;
  } catch (e) {
    if (e instanceof SyntaxError) return { raw: txt };
    throw e;
  }
}
