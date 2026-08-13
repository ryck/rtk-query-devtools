export type QueryStatus = "uninitialized" | "pending" | "fulfilled" | "rejected";

export type DerivedQueryStatus = "uninitialized" | "fetching" | "error" | "fresh" | "inactive";

export type EndpointType = "query" | "mutation" | "infinitequery";

export interface TagDescription {
  type: string;
  id?: string | number;
}

export interface QueryEntry {
  reducerPath: string;
  queryCacheKey: string;
  endpointName: string;
  type: "query" | "infinitequery";
  status: QueryStatus;
  derivedStatus: DerivedQueryStatus;
  originalArgs: unknown;
  data: unknown;
  error: unknown;
  requestId: string | undefined;
  startedTimeStamp: number | undefined;
  fulfilledTimeStamp: number | undefined;
  subscriberCount: number;
  isPolling: boolean;
  providedTags: TagDescription[];
}

export interface MutationEntry {
  reducerPath: string;
  /** The key this entry is stored under in `mutations` — either `requestId` or a user-supplied `fixedCacheKey`. */
  cacheKey: string;
  requestId: string;
  endpointName: string;
  status: QueryStatus;
  data: unknown;
  error: unknown;
  startedTimeStamp: number | undefined;
  fulfilledTimeStamp: number | undefined;
}

export interface TagGroupEntry {
  id: string;
  queryCacheKeys: string[];
}

export interface TagGroup {
  tagType: string;
  entries: TagGroupEntry[];
}

export type TimelineOutcome = "pending" | "fulfilled" | "rejected" | "skipped";

export interface TimelineEvent {
  id: string;
  reducerPath: string;
  requestId: string;
  kind: "query" | "mutation" | "infinitequery";
  endpointName: string;
  originalArgs: unknown;
  outcome: TimelineOutcome;
  startedTimeStamp: number;
  settledTimeStamp: number | undefined;
  durationMs: number | undefined;
  forceRefetch: boolean | undefined;
  subscribe: boolean | undefined;
  error: unknown;
}

/**
 * The minimal surface of an RTK Query `api` object this package relies on.
 * Deliberately narrow — `endpoints[name].initiate` is the only thing we
 * actually call (for Refetch; see actions.ts). Every other cache-mutating
 * action (reset/remove/invalidate) is constructible from `reducerPath` alone
 * as a plain action object, so this doesn't need `api.util.*` at all, which
 * sidesteps the version-specific generic types those methods carry on a
 * real `Api<...>` instance (tag-type unions, readonly-vs-mutable arrays).
 */
export interface RtkQueryApiLike {
  reducerPath: string;
  endpoints: Record<
    string,
    {
      // `arg`'s real type is per-endpoint (e.g. `number` for `getPost`, an
      // object for others) — `unknown` is too wide to be assignable *from*
      // a real, narrower `initiate`, per function parameter contravariance.
      // `any` is the correct, deliberate escape valve for this kind of
      // structural "the exact generic instantiation doesn't matter" typing.
      initiate?: (arg: any, options?: Record<string, unknown>) => unknown;
    }
  >;
}

export type RefetchResult = { ok: true } | { ok: false; reason: "api-not-registered" };

export interface RtkQueryDevtoolsOptions {
  /** RTK Query api instances to register for Refetch support. Optional. */
  apis?: RtkQueryApiLike[];
  /** Maximum number of timeline entries retained. Default: 500. */
  maxTimelineEntries?: number;
}
