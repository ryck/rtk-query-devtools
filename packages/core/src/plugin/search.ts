import { rankItem } from "@tanstack/match-sorter-utils";

export const SEARCH_MODES = ["fuzzy", "regex"] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];

export interface SearchMatcher {
  /**
   * True when a regex pattern failed to compile. The list stays unfiltered in
   * that case and the toggle marks itself errored, rather than the panel
   * blanking out while you're mid-way through typing a pattern.
   */
  invalid: boolean;
  /** Matches when *any* field does — endpoint name or serialized args, say. */
  matches: (...fields: Array<string | undefined>) => boolean;
}

const MATCH_ALL: SearchMatcher = { invalid: false, matches: () => true };

/**
 * Built once per render rather than per row, so a regex is compiled a single
 * time no matter how many entries are filtered through it.
 *
 * Fuzzy is the default and matches TanStack Query devtools' behaviour —
 * typing `lpf` finds `listPostsFlaky`, which a substring match would miss.
 */
export function createSearchMatcher(query: string, mode: SearchMode = "fuzzy"): SearchMatcher {
  const trimmed = query.trim();
  if (!trimmed) return MATCH_ALL;

  if (mode === "regex") {
    let pattern: RegExp;
    try {
      pattern = new RegExp(trimmed, "i");
    } catch {
      return { invalid: true, matches: () => true };
    }
    return {
      invalid: false,
      matches: (...fields) => fields.some((f) => f !== undefined && pattern.test(f)),
    };
  }

  return {
    invalid: false,
    matches: (...fields) => fields.some((f) => f !== undefined && rankItem(f, trimmed).passed),
  };
}
