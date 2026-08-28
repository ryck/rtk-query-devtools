import { useSyncExternalStore } from "react"
import type { DevtoolsRegistry } from "../../registry"

/**
 * Bridges the framework-agnostic `DevtoolsRegistry` into React. The
 * registry's `getVersion()` is a monotonically-increasing integer bumped on
 * a throttled schedule (see `registry.ts`), so `Object.is` comparisons stay
 * cheap and RTK Query's high action volume never causes a render per action.
 */
export function useRtkQueryDevtoolsState(registry: DevtoolsRegistry): {
  version: number
  state: unknown
  reducerPaths: string[]
  registry: DevtoolsRegistry
} {
  const version = useSyncExternalStore(
    (onStoreChange) => registry.subscribe(onStoreChange),
    () => registry.getVersion(),
    () => registry.getVersion()
  )

  return {
    version,
    state: registry.getState(),
    reducerPaths: registry.getReducerPaths(),
    registry,
  }
}
