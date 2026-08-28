import { findRtkQueryReducerPaths } from "./discovery"
import type {
  EndpointType,
  RtkQueryApiLike,
  TimelineEvent,
  TimelineOutcome,
} from "./types"

/**
 * Matches Redux's real `UnknownAction` (`{ type: string } & Record<string, unknown>`).
 * Declaring it locally, rather than importing it from `redux`/`@reduxjs/toolkit`,
 * keeps this module dependency-free while still being structurally identical,
 * which is what actually matters: `StoreLike` must be assignable *from* a real
 * `MiddlewareAPI` for `DevtoolsMiddleware` to satisfy Redux's `Middleware` type.
 */
export interface DevtoolsAction {
  type: string
  [key: string]: unknown
}

/** The subset of a Redux `MiddlewareAPI` this package relies on. */
export interface StoreLike {
  getState: () => unknown
  dispatch: (action: DevtoolsAction) => unknown
}

interface AnyAction {
  type: string
  payload?: unknown
  error?: unknown
  meta?: {
    requestId?: string
    condition?: boolean
    arg?: Record<string, unknown>
  }
}

const NOTIFY_THROTTLE_MS = 60
const DEFAULT_MAX_TIMELINE_ENTRIES = 500

/**
 * Holds everything the devtools panel needs, outside of React: the live
 * store reference, registered `api` instances (for Refetch), a capped
 * timeline of query/mutation lifecycle events, and a change counter that
 * `useSyncExternalStore` can poll cheaply without allocating a new snapshot
 * object per render.
 */
export class DevtoolsRegistry {
  #store: StoreLike | null = null
  #apis = new Map<string, RtkQueryApiLike>()
  #endpointTypes = new Map<string, EndpointType>()
  #pendingEvents = new Map<string, TimelineEvent>()
  #timeline: TimelineEvent[] = []
  #maxTimelineEntries: number = DEFAULT_MAX_TIMELINE_ENTRIES
  #timelinePaused = false

  #reducerPaths: string[] = []
  #reducerPathsSignature = ""

  #listeners = new Set<() => void>()
  #version = 0
  #notifyTimer: ReturnType<typeof setTimeout> | null = null

  configure(
    options: { apis?: RtkQueryApiLike[]; maxTimelineEntries?: number } = {}
  ): void {
    if (options.apis) {
      for (const api of options.apis) this.#apis.set(api.reducerPath, api)
    }
    if (
      typeof options.maxTimelineEntries === "number" &&
      options.maxTimelineEntries > 0
    ) {
      this.#maxTimelineEntries = options.maxTimelineEntries
    }
  }

  attachStore(store: StoreLike): void {
    const isFirstAttach = this.#store === null
    this.#store = store
    if (isFirstAttach) this.scheduleNotify()
  }

  getStore(): StoreLike | undefined {
    return this.#store ?? undefined
  }

  getState(): unknown {
    return this.#store?.getState()
  }

  /**
   * Deliberately typed `unknown`, not `DevtoolsAction`, because callers like
   * `refetch()` in actions.ts dispatch a thunk function (from `initiate()`),
   * not a plain action object. The real store's dispatch handles both fine
   * at runtime; only `StoreLike`'s declared type needs to look like plain
   * Redux dispatch, so `DevtoolsMiddleware` structurally matches `Middleware`.
   */
  dispatch(action: unknown): unknown {
    return this.#store?.dispatch(action as DevtoolsAction)
  }

  getApi(reducerPath: string): RtkQueryApiLike | undefined {
    return this.#apis.get(reducerPath)
  }

  /**
   * Root state keys rarely change (only when a reducer is dynamically added
   * or removed), so this only re-scans the state when that set changes
   * rather than on every action.
   */
  getReducerPaths(): string[] {
    const state = this.getState()
    if (!state || typeof state !== "object") return this.#reducerPaths

    const signature = Object.keys(state as Record<string, unknown>)
      .toSorted()
      .join(",")
    if (signature !== this.#reducerPathsSignature) {
      this.#reducerPathsSignature = signature
      this.#reducerPaths = findRtkQueryReducerPaths(state)
    }
    return this.#reducerPaths
  }

  getEndpointType(
    reducerPath: string,
    endpointName: string
  ): EndpointType | undefined {
    return this.#endpointTypes.get(`${reducerPath}:${endpointName}`)
  }

  /**
   * Returns a shallow copy, not the live array, because timeline entries are
   * mutated in place on settle (see `#handleThunkAction`), so the internal
   * array's reference alone can't signal "changed" to a memoized consumer.
   */
  getTimeline(): TimelineEvent[] {
    return [...this.#timeline]
  }

  isTimelinePaused(): boolean {
    return this.#timelinePaused
  }

  setTimelinePaused(paused: boolean): void {
    this.#timelinePaused = paused
    this.scheduleNotify()
  }

  clearTimeline(): void {
    this.#timeline = []
    this.#pendingEvents.clear()
    this.scheduleNotify()
  }

  /**
   * Called by the middleware after `next(action)`. Redux's `Middleware`
   * interface types `action` as `unknown` at this boundary (see
   * middleware.ts), so this stays defensive rather than trusting `DevtoolsAction`.
   */
  recordAction(action: unknown): void {
    const type = (action as { type?: unknown } | null)?.type
    if (typeof type !== "string") return

    for (const reducerPath of this.getReducerPaths()) {
      const queryPrefix = `${reducerPath}/executeQuery/`
      const mutationPrefix = `${reducerPath}/executeMutation/`

      let baseKind: "query" | "mutation"
      let phase: string
      if (type.startsWith(queryPrefix)) {
        baseKind = "query"
        phase = type.slice(queryPrefix.length)
      } else if (type.startsWith(mutationPrefix)) {
        baseKind = "mutation"
        phase = type.slice(mutationPrefix.length)
      } else {
        continue
      }

      if (phase !== "pending" && phase !== "fulfilled" && phase !== "rejected")
        continue
      this.#handleThunkAction(reducerPath, baseKind, phase, action as AnyAction)
      return
    }
  }

  #handleThunkAction(
    reducerPath: string,
    baseKind: "query" | "mutation",
    phase: "pending" | "fulfilled" | "rejected",
    action: AnyAction
  ): void {
    const meta = action.meta
    const requestId = meta?.requestId
    const arg = meta?.arg
    if (!requestId || !arg) return

    const endpointName = arg.endpointName as string | undefined
    if (!endpointName) return

    const isInfinite = "direction" in arg
    const kind: EndpointType = isInfinite ? "infinitequery" : baseKind
    this.#endpointTypes.set(`${reducerPath}:${endpointName}`, kind)

    if (this.#timelinePaused) return

    const startedTimeStamp =
      (arg.startedTimeStamp as number | undefined) ?? Date.now()
    const forceRefetch = arg.forceRefetch as boolean | undefined
    const subscribe = arg.subscribe as boolean | undefined
    // Absent on mutation thunks, which RTK keys by requestId instead.
    const queryCacheKey = arg.queryCacheKey as string | undefined

    if (phase === "pending") {
      const event: TimelineEvent = {
        id: requestId,
        reducerPath,
        requestId,
        queryCacheKey,
        kind,
        endpointName,
        originalArgs: arg.originalArgs,
        outcome: "pending",
        startedTimeStamp,
        settledTimeStamp: undefined,
        durationMs: undefined,
        forceRefetch,
        subscribe,
        error: undefined,
      }
      this.#pendingEvents.set(requestId, event)
      this.#pushTimeline(event)
      return
    }

    const settledTimeStamp = Date.now()
    const outcome: TimelineOutcome =
      phase === "rejected" && meta?.condition === true ? "skipped" : phase
    const existing = this.#pendingEvents.get(requestId)
    this.#pendingEvents.delete(requestId)

    if (existing) {
      existing.outcome = outcome
      existing.settledTimeStamp = settledTimeStamp
      existing.durationMs = settledTimeStamp - existing.startedTimeStamp
      existing.error =
        phase === "rejected" ? (action.payload ?? action.error) : undefined
      this.scheduleNotify()
      return
    }

    // Settled event observed without its pending event (e.g. it was evicted
    // from the ring buffer, or capture was paused when it started).
    this.#pushTimeline({
      id: requestId,
      reducerPath,
      requestId,
      queryCacheKey,
      kind,
      endpointName,
      originalArgs: arg.originalArgs,
      outcome,
      startedTimeStamp,
      settledTimeStamp,
      durationMs: settledTimeStamp - startedTimeStamp,
      forceRefetch,
      subscribe,
      error:
        phase === "rejected" ? (action.payload ?? action.error) : undefined,
    })
  }

  #pushTimeline(event: TimelineEvent): void {
    this.#timeline.push(event)
    if (this.#timeline.length > this.#maxTimelineEntries) {
      const evicted = this.#timeline.shift()
      if (evicted && evicted.outcome === "pending")
        this.#pendingEvents.delete(evicted.requestId)
    }
    this.scheduleNotify()
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  /** Cheap identity for `useSyncExternalStore`: an incrementing integer. */
  getVersion(): number {
    return this.#version
  }

  scheduleNotify(): void {
    if (this.#notifyTimer !== null) return
    this.#notifyTimer = setTimeout(() => {
      this.#notifyTimer = null
      this.#version++
      for (const listener of this.#listeners) listener()
    }, NOTIFY_THROTTLE_MS)
  }
}

export const defaultRegistry = new DevtoolsRegistry()
