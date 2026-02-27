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
 * explosion. Detects arrays at top level or
 * inside common wrapper keys.
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
