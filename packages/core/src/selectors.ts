import type {
  DerivedQueryStatus,
  EndpointType,
  MutationEntry,
  QueryEntry,
  QueryStatus,
  TagDescription,
  TagGroup,
  TagGroupEntry,
} from "./types";

/**
 * RTK's sentinel id for a tag provided without one (`providesTags: ['Post']`),
 * used as a key in the `provided` tag map.
 */
export const NO_TAG_ID = "__internal_without_id";

interface RawQuerySubState {
  status: QueryStatus;
  originalArgs?: unknown;
  requestId?: string;
  data?: unknown;
  error?: unknown;
  endpointName?: string;
  startedTimeStamp?: number;
  fulfilledTimeStamp?: number;
  direction?: "forward" | "backward";
}

interface RawMutationSubState {
  requestId?: string;
  data?: unknown;
  error?: unknown;
  endpointName?: string;
  startedTimeStamp?: number;
  fulfilledTimeStamp?: number;
  status: QueryStatus;
}

interface RawSubscriptionOptions {
  pollingInterval?: number;
}

/** `tagType -> id -> cache keys`. */
type RawProvidedTags = Record<string, Record<string, string[]>>;
/** `cache key -> tags it provides`. Only exists natively on RTK >= 2.6.2. */
type RawProvidedKeys = Record<string, TagDescription[]>;

/**
 * RTK **2.6.2** split the invalidation index in two. Before that, `provided`
 * *was* the tag map, with no reverse lookup at all:
 *
 * - `<= 2.6.1`: `{ [tagType]: { [id]: QueryCacheKey[] } }`
 * - `>= 2.6.2`: `{ tags: { [tagType]: … }, keys: { [cacheKey]: … } }`
 *
 * Our peer range is `>=2.0.0`, so both shapes have to work — reading
 * `provided.tags` on the old shape yields `undefined` and throws.
 */
type RawProvided = RawProvidedTags | { tags: RawProvidedTags; keys: RawProvidedKeys };

interface NormalizedProvided {
  tags: RawProvidedTags;
  keys: RawProvidedKeys;
}

interface RawRtkQuerySlice {
  queries: Record<string, RawQuerySubState | undefined>;
  mutations: Record<string, RawMutationSubState | undefined>;
  provided: RawProvided;
  subscriptions: Record<string, Record<string, RawSubscriptionOptions> | undefined>;
  config?: {
    reducerPath?: string;
    online?: boolean;
    focused?: boolean;
    middlewareRegistered?: boolean | "conflict";
    keepUnusedDataFor?: number;
    invalidationBehavior?: "delayed" | "immediately";
    refetchOnFocus?: boolean;
    refetchOnReconnect?: boolean;
    refetchOnMountOrArgChange?: boolean | number;
  };
}

function isSplitProvided(
  provided: RawProvided,
): provided is { tags: RawProvidedTags; keys: RawProvidedKeys } {
  return "tags" in provided && "keys" in provided;
}

/**
 * Keyed on the raw `provided` object so the returned value — and therefore
 * `.tags` / `.keys` — keeps a stable identity for as long as RTK's own object
 * does. That is load-bearing, not an optimization: `selectQueryEntries` and
 * `selectTagGroups` memoize on exactly those references, so handing back a
 * fresh object per call would silently disable both caches.
 */
const normalizedProvidedCache = new WeakMap<object, NormalizedProvided>();

function normalizeProvided(provided: RawProvided): NormalizedProvided {
  // RTK >= 2.6.2 already has the shape we want; pass it straight through so
  // identity is RTK's own.
  if (isSplitProvided(provided)) return provided;

  const cached = normalizedProvidedCache.get(provided);
  if (cached) return cached;

  // Old shape has no reverse index, so build one. O(tags x ids), but only once
  // per `provided` change and only on RTK < 2.6.2.
  const keys: RawProvidedKeys = {};
  for (const [type, byId] of Object.entries(provided)) {
    for (const [id, cacheKeys] of Object.entries(byId)) {
      for (const cacheKey of cacheKeys) {
        // Match what >= 2.6.2 stores: a tag provided without an id has no `id`
        // field, rather than carrying RTK's internal sentinel.
        const tag: TagDescription = id === NO_TAG_ID ? { type } : { type, id };
        (keys[cacheKey] ??= []).push(tag);
      }
    }
  }

  const normalized: NormalizedProvided = { tags: provided, keys };
  normalizedProvidedCache.set(provided, normalized);
  return normalized;
}

/**
 * `online` and `focused` are global RTK Query state that every api's config
 * slice mirrors, so reading from any one api gives the same answer. Both
 * default to `true` — the normal, un-simulated environment — when the slice
 * hasn't been read yet.
 */
export function selectEnvironment(
  state: unknown,
  reducerPath: string,
): { online: boolean; focused: boolean } {
  const config = getRtkQuerySlice(state, reducerPath)?.config;
  return { online: config?.online ?? true, focused: config?.focused ?? true };
}

export interface ApiHealth {
  reducerPath: string;
  /**
   * `"conflict"` means RTK saw the same api's middleware registered more than
   * once (or against two stores). Caching silently misbehaves when this
   * happens, and nothing else reports it — which is why the panel surfaces it
   * rather than burying it with the rest of the config.
   */
  middlewareRegistered: boolean | "conflict";
  keepUnusedDataFor: number | undefined;
  invalidationBehavior: string | undefined;
  refetchOnFocus: boolean | undefined;
  refetchOnReconnect: boolean | undefined;
  refetchOnMountOrArgChange: boolean | number | undefined;
  cachedQueries: number;
  cachedMutations: number;
  /** Total live subscribers across every cache entry — lags by up to 500ms. */
  subscriberCount: number;
}

/**
 * The api's own configuration plus a size tally. RTK populates all of this and
 * no tool surfaces it; `keepUnusedDataFor` and the `refetchOn*` flags in
 * particular explain cache behaviour that otherwise looks arbitrary.
 */
export function selectApiHealth(state: unknown, reducerPath: string): ApiHealth | undefined {
  const slice = getRtkQuerySlice(state, reducerPath);
  if (!slice) return undefined;

  let subscriberCount = 0;
  for (const subscribers of Object.values(slice.subscriptions)) {
    if (subscribers) subscriberCount += Object.keys(subscribers).length;
  }

  const config = slice.config;
  return {
    reducerPath: config?.reducerPath ?? reducerPath,
    middlewareRegistered: config?.middlewareRegistered ?? false,
    keepUnusedDataFor: config?.keepUnusedDataFor,
    invalidationBehavior: config?.invalidationBehavior,
    refetchOnFocus: config?.refetchOnFocus,
    refetchOnReconnect: config?.refetchOnReconnect,
    refetchOnMountOrArgChange: config?.refetchOnMountOrArgChange,
    cachedQueries: Object.keys(slice.queries).length,
    cachedMutations: Object.keys(slice.mutations).length,
    subscriberCount,
  };
}

export function getRtkQuerySlice(
  state: unknown,
  reducerPath: string,
): RawRtkQuerySlice | undefined {
  if (!state || typeof state !== "object") return undefined;
  const slice = (state as Record<string, unknown>)[reducerPath];
  if (!slice || typeof slice !== "object") return undefined;
  const s = slice as Record<string, unknown>;
  if (!s.queries || !s.mutations || !s.provided || !s.subscriptions) return undefined;
  return slice as RawRtkQuerySlice;
}

function deriveQueryStatus(status: QueryStatus, subscriberCount: number): DerivedQueryStatus {
  switch (status) {
    case "pending":
      return "fetching";
    case "rejected":
      return "error";
    case "fulfilled":
      return subscriberCount > 0 ? "fresh" : "inactive";
    default:
      return "uninitialized";
  }
}

/**
 * RTK Query always stores infinite query results as `{ pages, pageParams }`,
 * from the very first fetch — unlike the substate's `direction` field, which
 * is only set once a `fetchNextPage`/`fetchPreviousPage` call has happened.
 * This makes it the more reliable of the two infinite-query signals.
 */
function hasInfiniteQueryDataShape(data: unknown): boolean {
  return (
    !!data &&
    typeof data === "object" &&
    "pages" in data &&
    Array.isArray((data as { pages: unknown }).pages) &&
    "pageParams" in data &&
    Array.isArray((data as { pageParams: unknown }).pageParams)
  );
}

function parseEndpointNameFromCacheKey(queryCacheKey: string): string {
  const parenIndex = queryCacheKey.indexOf("(");
  return parenIndex === -1 ? queryCacheKey : queryCacheKey.slice(0, parenIndex);
}

interface QueryEntriesCacheRecord {
  queriesRef: unknown;
  subscriptionsRef: unknown;
  providedKeysRef: unknown;
  result: QueryEntry[];
}
const queryEntriesCache = new Map<string, QueryEntriesCacheRecord>();

/**
 * Derives the query/infinite-query entries for a single api slice. Memoized
 * on the identity of `queries`, `subscriptions`, and `provided.keys` so a
 * render triggered by an unrelated slice change reuses the same array —
 * `subscriptions` is included because its throttled sync is the only source
 * of live subscriber counts, not just `queries`.
 */
export function selectQueryEntries(
  state: unknown,
  reducerPath: string,
  getEndpointType?: (endpointName: string) => EndpointType | undefined,
): QueryEntry[] {
  const slice = getRtkQuerySlice(state, reducerPath);
  if (!slice) return [];

  const provided = normalizeProvided(slice.provided);

  const cached = queryEntriesCache.get(reducerPath);
  if (
    cached &&
    cached.queriesRef === slice.queries &&
    cached.subscriptionsRef === slice.subscriptions &&
    cached.providedKeysRef === provided.keys
  ) {
    return cached.result;
  }

  const result: QueryEntry[] = [];
  for (const [queryCacheKey, sub] of Object.entries(slice.queries)) {
    if (!sub) continue;

    const endpointName = sub.endpointName ?? parseEndpointNameFromCacheKey(queryCacheKey);
    const subscribers = slice.subscriptions[queryCacheKey];
    const subscriberEntries = subscribers ? Object.values(subscribers) : [];
    const subscriberCount = subscriberEntries.length;
    const isPolling = subscriberEntries.some(
      (s) => typeof s?.pollingInterval === "number" && s.pollingInterval > 0,
    );
    const providedTags = provided.keys[queryCacheKey] ?? [];
    const learnedType = getEndpointType?.(endpointName);
    const type: "query" | "infinitequery" =
      sub.direction !== undefined ||
      learnedType === "infinitequery" ||
      hasInfiniteQueryDataShape(sub.data)
        ? "infinitequery"
        : "query";

    result.push({
      reducerPath,
      queryCacheKey,
      endpointName,
      type,
      status: sub.status,
      derivedStatus: deriveQueryStatus(sub.status, subscriberCount),
      originalArgs: sub.originalArgs,
      data: sub.data,
      error: sub.error,
      requestId: sub.requestId,
      startedTimeStamp: sub.startedTimeStamp,
      fulfilledTimeStamp: sub.fulfilledTimeStamp,
      subscriberCount,
      isPolling,
      providedTags,
    });
  }

  queryEntriesCache.set(reducerPath, {
    queriesRef: slice.queries,
    subscriptionsRef: slice.subscriptions,
    providedKeysRef: provided.keys,
    result,
  });
  return result;
}

interface MutationEntriesCacheRecord {
  mutationsRef: unknown;
  result: MutationEntry[];
}
const mutationEntriesCache = new Map<string, MutationEntriesCacheRecord>();

export function selectMutationEntries(state: unknown, reducerPath: string): MutationEntry[] {
  const slice = getRtkQuerySlice(state, reducerPath);
  if (!slice) return [];

  const cached = mutationEntriesCache.get(reducerPath);
  if (cached && cached.mutationsRef === slice.mutations) return cached.result;

  const result: MutationEntry[] = [];
  for (const [cacheKey, sub] of Object.entries(slice.mutations)) {
    if (!sub) continue;
    result.push({
      reducerPath,
      cacheKey,
      requestId: sub.requestId ?? cacheKey,
      endpointName: sub.endpointName ?? "unknown",
      status: sub.status,
      data: sub.data,
      error: sub.error,
      startedTimeStamp: sub.startedTimeStamp,
      fulfilledTimeStamp: sub.fulfilledTimeStamp,
    });
  }

  mutationEntriesCache.set(reducerPath, { mutationsRef: slice.mutations, result });
  return result;
}

interface TagGroupsCacheRecord {
  tagsRef: unknown;
  result: TagGroup[];
}
const tagGroupsCache = new Map<string, TagGroupsCacheRecord>();

export function selectTagGroups(state: unknown, reducerPath: string): TagGroup[] {
  const slice = getRtkQuerySlice(state, reducerPath);
  if (!slice) return [];

  const provided = normalizeProvided(slice.provided);

  const cached = tagGroupsCache.get(reducerPath);
  if (cached && cached.tagsRef === provided.tags) return cached.result;

  const result: TagGroup[] = [];
  for (const [tagType, byId] of Object.entries(provided.tags)) {
    const entries: TagGroupEntry[] = Object.entries(byId).map(([id, queryCacheKeys]) => ({
      id,
      queryCacheKeys: [...queryCacheKeys],
    }));
    result.push({ tagType, entries });
  }

  tagGroupsCache.set(reducerPath, { tagsRef: provided.tags, result });
  return result;
}
