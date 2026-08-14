import { rankItem } from "@tanstack/match-sorter-utils";

/**
 * Fuzzy match, matching TanStack Query devtools' filter behaviour — typing
 * `lpf` finds `listPostsFlaky`, which a substring match would miss.
 *
 * An empty query matches everything, and an entry matches if *any* of its
 * fields does (endpoint name or serialized args, say).
 */
export function matchesSearch(query: string, ...fields: Array<string | undefined>): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;
  return fields.some((field) => field !== undefined && rankItem(field, trimmed).passed);
}
