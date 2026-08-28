/**
 * Detects RTK Query API slices in a Redux root state without requiring the
 * caller to configure a reducer path. RTK Query's `CombinedState` shape is
 * distinctive enough (and `config.reducerPath` self-references its own key)
 * that this is reliable across apps with any number of `createApi` instances.
 */
export function findRtkQueryReducerPaths(state: unknown): string[] {
  if (!state || typeof state !== "object") return []

  const paths: string[] = []
  for (const key of Object.keys(state as Record<string, unknown>)) {
    const slice = (state as Record<string, unknown>)[key]
    if (isRtkQuerySlice(slice, key)) {
      paths.push(key)
    }
  }
  return paths
}

function isRtkQuerySlice(slice: unknown, key: string): boolean {
  if (!slice || typeof slice !== "object") return false
  const s = slice as Record<string, unknown>
  const config = s.config as Record<string, unknown> | undefined
  return (
    !!config &&
    config.reducerPath === key &&
    "queries" in s &&
    "mutations" in s &&
    "provided" in s &&
    "subscriptions" in s
  )
}
