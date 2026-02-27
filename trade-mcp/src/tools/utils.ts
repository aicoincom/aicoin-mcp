/**
 * Shared MCP response helpers
 */

/** Standard success response */
export function ok(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
  };
}

/** Safe error response — handles non-Error throws */
export function err(e: unknown) {
  const message =
    e instanceof Error ? e.message : typeof e === 'string' ? e : String(e);
  return {
    content: [{ type: 'text' as const, text: `Error: ${message}` }],
    isError: true as const,
  };
}

/** List response with auto-truncation to prevent context blowup */
export function okList(data: unknown[], max = 200) {
  const truncated = data.length > max;
  const items = truncated ? data.slice(0, max) : data;
  return ok({
    total: data.length,
    returned: items.length,
    truncated,
    data: items,
  });
}
