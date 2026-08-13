import type {
  DerivedQueryStatus,
  EndpointType,
  MutationEntry,
  QueryEntry,
  QueryStatus,
  TagGroup,
  TagGroupEntry,
} from "./types";

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

interface RawRtkQuerySlice {
  queries: Record<string, RawQuerySubState | undefined>;
  mutations: Record<string, RawMutationSubState | undefined>;
  provided: {
    tags: Record<string, Record<string, string[]>>;
    keys: Record<string, Array<{ type: string; id?: string | number }>>;
  };
  subscriptions: Record<string, Record<string, RawSubscriptionOptions> | undefined>;
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

  const cached = queryEntriesCache.get(reducerPath);
  if (
    cached &&
    cached.queriesRef === slice.queries &&
    cached.subscriptionsRef === slice.subscriptions &&
    cached.providedKeysRef === slice.provided.keys
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
    const providedTags = slice.provided.keys[queryCacheKey] ?? [];
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
    providedKeysRef: slice.provided.keys,
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

  const cached = tagGroupsCache.get(reducerPath);
  if (cached && cached.tagsRef === slice.provided.tags) return cached.result;

  const result: TagGroup[] = [];
  for (const [tagType, byId] of Object.entries(slice.provided.tags)) {
    const entries: TagGroupEntry[] = Object.entries(byId).map(([id, queryCacheKeys]) => ({
      id,
      queryCacheKeys: [...queryCacheKeys],
    }));
    result.push({ tagType, entries });
  }

  tagGroupsCache.set(reducerPath, { tagsRef: slice.provided.tags, result });
  return result;
}
