import type { DevtoolsRegistry } from "./registry";
import type { MutationEntry, RefetchResult, TagDescription } from "./types";

/**
 * These four action types are constructible from `reducerPath` alone — they
 * are plain `createAction`/`createSlice` action creators in RTK Query with
 * no transformation of their payload, so dispatching the literal action
 * object is equivalent to calling `api.util.<name>(...)`. Only Refetch
 * requires the actual `api` object, because it dispatches a thunk.
 */

export function resetApiState(registry: DevtoolsRegistry, reducerPath: string): void {
  registry.dispatch({ type: `${reducerPath}/resetApiState` });
}

export function removeQueryEntry(
  registry: DevtoolsRegistry,
  reducerPath: string,
  queryCacheKey: string,
): void {
  registry.dispatch({
    type: `${reducerPath}/queries/removeQueryResult`,
    payload: { queryCacheKey },
  });
}

export function removeMutationEntry(
  registry: DevtoolsRegistry,
  reducerPath: string,
  entry: Pick<MutationEntry, "requestId" | "cacheKey">,
): void {
  const fixedCacheKey = entry.cacheKey !== entry.requestId ? entry.cacheKey : undefined;
  registry.dispatch({
    type: `${reducerPath}/mutations/removeMutationResult`,
    payload: { requestId: entry.requestId, fixedCacheKey },
  });
}

export function invalidateTags(
  registry: DevtoolsRegistry,
  reducerPath: string,
  tags: ReadonlyArray<TagDescription | string>,
): void {
  registry.dispatch({ type: `${reducerPath}/invalidateTags`, payload: tags });
}

/** Requires an `api` registered via `createRtkQueryDevtools({ apis: [...] })`. */
export function refetch(
  registry: DevtoolsRegistry,
  reducerPath: string,
  endpointName: string,
  originalArgs: unknown,
): RefetchResult {
  const api = registry.getApi(reducerPath);
  const initiate = api?.endpoints[endpointName]?.initiate;
  if (!api || !initiate) return { ok: false, reason: "api-not-registered" };

  registry.dispatch(initiate(originalArgs, { subscribe: false, forceRefetch: true }));
  return { ok: true };
}
