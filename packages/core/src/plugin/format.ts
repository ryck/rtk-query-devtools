/**
 * RTK Query's own cache key for a no-arg query (`builder.query<T, void>`)
 * is literally `${endpointName}(undefined)`, because `defaultSerializeQueryArgs`
 * runs `JSON.stringify(undefined)`, which returns the JS value `undefined`,
 * and the template literal that builds the key then coerces it to the text
 * "undefined". That's the real Redux state key, so `queryCacheKey` itself
 * is left untouched everywhere else (selection, actions); this only
 * cleans up how it reads in the UI, and only when `originalArgs` (the
 * actual field RTK Query recorded, not a string guess) confirms the args
 * really were `undefined`.
 */
export function formatQueryCacheKey(queryCacheKey: string, originalArgs: unknown): string {
  if (originalArgs !== undefined) return queryCacheKey;
  return queryCacheKey.replace(/\(undefined\)$/, "()");
}

export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Wall-clock time (`HH:MM:SS`) for a row's fixed-width timestamp column.
 * Kept separate from `formatRelativeTime` so every row list (Queries,
 * Mutations, Timeline) can render the *same* clock-time format in the *same*
 * column position, regardless of which timestamp field each entry type
 * happens to track (`fulfilledTimeStamp` vs `startedTimeStamp`).
 */
export function formatTimestamp(timestamp: number | undefined): string {
  if (timestamp === undefined) return "—";
  return new Date(timestamp).toLocaleTimeString();
}

export function formatRelativeTime(
  timestamp: number | undefined,
  now: number = Date.now(),
): string {
  if (timestamp === undefined) return "—";
  const diffMs = now - timestamp;
  if (diffMs < 1000) return "just now";
  if (diffMs < 60_000) return `${Math.floor(diffMs / 1000)}s ago`;
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return `${Math.floor(diffMs / 86_400_000)}d ago`;
}

/**
 * A JSON.stringify that survives the shapes real app data actually contains
 * (circular references, BigInt, Map/Set, functions) instead of throwing.
 * Only ever call this on demand (e.g. a "copy" button); never eagerly on
 * render, since it walks the entire value.
 *
 * Dates need no special case: `JSON.stringify` calls `.toJSON()` on any
 * value that has one *before* the replacer below ever sees it, so a Date
 * already arrives as a plain ISO string.
 */
export function safeStringify(value: unknown, space = 2): string {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === "bigint") return { $bigint: val.toString() };
        if (val instanceof Map) return { $map: Array.from(val.entries()) };
        if (val instanceof Set) return { $set: Array.from(val.values()) };
        if (typeof val === "function") return `[Function: ${val.name || "anonymous"}]`;
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) return "[Circular]";
          seen.add(val);
        }
        return val;
      },
      space,
    );
  } catch {
    return String(value);
  }
}
