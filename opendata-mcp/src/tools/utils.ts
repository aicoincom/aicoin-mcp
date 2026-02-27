/**
 * Shared MCP tool response helpers
 */
import { z } from 'zod';

const LIST_KEYS = [
  'data',
  'list',
  'items',
  'result',
  'results',
];

/** Reusable Zod field for max items override */
export const maxItemsParam = {
  _max_items: z
    .string()
    .optional()
    .describe(
      'Override default truncation limit. ' +
        'Set to 0 for no limit (full data).'
    ),
};

/** Parse _max_items string to number or null */
export function parseMax(
  val: string | undefined,
  fallback: number
): number {
  if (val == null) return fallback;
  const n = Number(val);
  if (n === 0) return Infinity;
  return n > 0 ? n : fallback;
}

export function ok(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data),
      },
    ],
  };
}

/**
 * Truncate list responses to avoid context
 * explosion. Detects arrays at top level,
 * inside common wrapper keys, or nested
 * inside data.{list|items|...}.
 */
export function okList(
  data: unknown,
  max = 50
) {
  // Top-level array
  if (Array.isArray(data)) {
    return ok(truncArr(data, max));
  }
  // Object with a list field
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    // Level 1: check obj[k]
    for (const k of LIST_KEYS) {
      if (Array.isArray(obj[k])) {
        const arr = obj[k] as unknown[];
        if (arr.length > max) {
          return ok({
            ...obj,
            [k]: arr.slice(0, max),
            _truncated: {
              field: k,
              total: arr.length,
              showing: max,
            },
          });
        }
        return ok(data);
      }
    }
    // Level 2: check obj.data[k]
    // Handles { data: { list: [...] } }
    const inner = obj.data;
    if (inner && typeof inner === 'object') {
      const d = inner as Record<string, unknown>;
      for (const k of LIST_KEYS) {
        if (Array.isArray(d[k])) {
          const arr = d[k] as unknown[];
          if (arr.length > max) {
            return ok({
              ...obj,
              data: {
                ...d,
                [k]: arr.slice(0, max),
              },
              _truncated: {
                field: `data.${k}`,
                total: arr.length,
                showing: max,
              },
            });
          }
          return ok(data);
        }
      }
    }
  }
  return ok(data);
}

function truncArr(
  arr: unknown[],
  max: number
) {
  if (arr.length <= max) return arr;
  return {
    total: arr.length,
    showing: max,
    truncated: true,
    data: arr.slice(0, max),
  };
}

/**
 * Truncate depth (order book) responses.
 * Handles {data: {bids:[], asks:[]}} structure.
 */
export function okDepth(
  data: unknown,
  max = 50
) {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const inner = obj.data;
    if (inner && typeof inner === 'object') {
      const d = inner as Record<string, unknown>;
      const bids = d.bids;
      const asks = d.asks;
      const bTotal = Array.isArray(bids)
        ? bids.length
        : 0;
      const aTotal = Array.isArray(asks)
        ? asks.length
        : 0;
      if (bTotal > max || aTotal > max) {
        return ok({
          ...obj,
          data: {
            ...d,
            bids: Array.isArray(bids)
              ? bids.slice(0, max)
              : bids,
            asks: Array.isArray(asks)
              ? asks.slice(0, max)
              : asks,
          },
          _truncated: {
            bids: { total: bTotal, showing: Math.min(bTotal, max) },
            asks: { total: aTotal, showing: Math.min(aTotal, max) },
          },
        });
      }
    }
  }
  return ok(data);
}

/**
 * Deep truncation for responses with nested arrays.
 * Truncates top-level list AND any nested arrays
 * inside each item (e.g. estimated liquidation data).
 */
export function okListDeep(
  data: unknown,
  max = 5,
  innerMax = 20
) {
  const truncInner = (item: unknown): unknown => {
    if (!item || typeof item !== 'object') return item;
    const obj = item as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (Array.isArray(v) && v.length > innerMax) {
        out[k] = v.slice(0, innerMax);
        out[`_${k}_truncated`] = {
          total: v.length,
          showing: innerMax,
        };
      } else {
        out[k] = v;
      }
    }
    return out;
  };

  const truncDeep = (arr: unknown[]): unknown => {
    const sliced = arr.length > max
      ? arr.slice(0, max)
      : arr;
    const mapped = sliced.map(truncInner);
    if (arr.length > max) {
      return {
        total: arr.length,
        showing: max,
        truncated: true,
        data: mapped,
      };
    }
    return mapped;
  };

  if (Array.isArray(data)) {
    return ok(truncDeep(data));
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    // Level 1
    for (const k of LIST_KEYS) {
      if (Array.isArray(obj[k])) {
        const arr = obj[k] as unknown[];
        const result = truncDeep(arr);
        return ok({
          ...obj,
          [k]: Array.isArray(result)
            ? result
            : (result as Record<string, unknown>).data,
          _truncated: Array.isArray(result)
            ? undefined
            : {
                field: k,
                total: arr.length,
                showing: max,
              },
        });
      }
    }
    // Level 2: check obj.data[k]
    const inner = obj.data;
    if (inner && typeof inner === 'object') {
      const d = inner as Record<string, unknown>;
      for (const k of LIST_KEYS) {
        if (Array.isArray(d[k])) {
          const arr = d[k] as unknown[];
          const result = truncDeep(arr);
          return ok({
            ...obj,
            data: {
              ...d,
              [k]: Array.isArray(result)
                ? result
                : (result as Record<string, unknown>).data,
            },
            _truncated: Array.isArray(result)
              ? undefined
              : {
                  field: `data.${k}`,
                  total: arr.length,
                  showing: max,
                },
          });
        }
      }
    }
  }
  return ok(data);
}

export function err(e: unknown) {
  const msg =
    e instanceof Error ? e.message : String(e);
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error: ${msg}`,
      },
    ],
    isError: true as const,
  };
}
