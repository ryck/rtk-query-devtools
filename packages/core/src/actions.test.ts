import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  invalidateTags,
  refetch,
  removeMutationEntry,
  removeQueryEntry,
  resetApiState,
  setFocused,
  setOnline,
} from "./actions"
import { createDevtoolsMiddleware } from "./middleware"
import { DevtoolsRegistry } from "./registry"
import {
  selectEnvironment,
  selectMutationEntries,
  selectQueryEntries,
} from "./selectors"
import {
  createTestApi,
  createTestStore,
  jsonResponse,
  type Post,
} from "./test-utils/test-api"

function createActionRecorder() {
  const actions: Array<{ type: string }> = []
  return {
    actions,
    middleware:
      () => (next: (action: unknown) => unknown) => (action: unknown) => {
        actions.push(action as { type: string })
        return next(action)
      },
  }
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn())
})

describe("resetApiState", () => {
  it("dispatches the exact reset action type and clears all cached entries", async () => {
    const registry = new DevtoolsRegistry()
    const api = createTestApi()
    const recorder = createActionRecorder()
    const store = createTestStore(api, [
      createDevtoolsMiddleware(registry),
      recorder.middleware,
    ])

    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ id: 1, title: "Hello" } satisfies Post)
    )
    await store.dispatch(api.endpoints.getPost.initiate(1)).unwrap()
    expect(selectQueryEntries(store.getState(), api.reducerPath)).toHaveLength(
      1
    )

    recorder.actions.length = 0
    resetApiState(registry, api.reducerPath)

    expect(recorder.actions.map((a) => a.type)).toContain(
      `${api.reducerPath}/resetApiState`
    )
    expect(selectQueryEntries(store.getState(), api.reducerPath)).toHaveLength(
      0
    )
  })
})

describe("removeQueryEntry", () => {
  it("dispatches the exact remove action type and removes only the targeted entry", async () => {
    const registry = new DevtoolsRegistry()
    const api = createTestApi()
    const recorder = createActionRecorder()
    const store = createTestStore(api, [
      createDevtoolsMiddleware(registry),
      recorder.middleware,
    ])

    vi.mocked(fetch).mockImplementation(async () =>
      jsonResponse({ id: 1, title: "Hello" } satisfies Post)
    )
    const r1 = store.dispatch(api.endpoints.getPost.initiate(1))
    const r2 = store.dispatch(api.endpoints.getPost.initiate(2))
    await Promise.all([r1, r2])
    expect(selectQueryEntries(store.getState(), api.reducerPath)).toHaveLength(
      2
    )

    const [entry] = selectQueryEntries(store.getState(), api.reducerPath)
    recorder.actions.length = 0
    removeQueryEntry(registry, api.reducerPath, entry!.queryCacheKey)

    expect(recorder.actions.map((a) => a.type)).toContain(
      `${api.reducerPath}/queries/removeQueryResult`
    )
    const remaining = selectQueryEntries(store.getState(), api.reducerPath)
    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.queryCacheKey).not.toBe(entry!.queryCacheKey)

    r1.unsubscribe()
    r2.unsubscribe()
  })
})

describe("removeMutationEntry", () => {
  it("dispatches the exact remove action type and removes an untracked-key entry by requestId", async () => {
    const registry = new DevtoolsRegistry()
    const api = createTestApi()
    const recorder = createActionRecorder()
    const store = createTestStore(api, [
      createDevtoolsMiddleware(registry),
      recorder.middleware,
    ])

    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ id: 2, title: "New" } satisfies Post)
    )
    await store.dispatch(api.endpoints.addPost.initiate({ title: "New" }))

    const [entry] = selectMutationEntries(store.getState(), api.reducerPath)
    expect(entry?.cacheKey).toBe(entry?.requestId)

    recorder.actions.length = 0
    removeMutationEntry(registry, api.reducerPath, entry!)

    expect(recorder.actions.map((a) => a.type)).toContain(
      `${api.reducerPath}/mutations/removeMutationResult`
    )
    expect(
      selectMutationEntries(store.getState(), api.reducerPath)
    ).toHaveLength(0)
  })

  it("uses the fixedCacheKey when the entry's cacheKey differs from its requestId", async () => {
    const registry = new DevtoolsRegistry()
    const api = createTestApi()
    const store = createTestStore(api, [createDevtoolsMiddleware(registry)])

    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ id: 2, title: "New" } satisfies Post)
    )
    await store.dispatch(
      api.endpoints.addPost.initiate(
        { title: "New" },
        { fixedCacheKey: "add-post" }
      )
    )

    const entry = selectMutationEntries(store.getState(), api.reducerPath).find(
      (e) => e.cacheKey === "add-post"
    )
    expect(entry).toBeDefined()

    removeMutationEntry(registry, api.reducerPath, entry!)

    const remaining = selectMutationEntries(store.getState(), api.reducerPath)
    expect(remaining.some((e) => e.cacheKey === "add-post")).toBe(false)
  })
})

describe("invalidateTags", () => {
  it("dispatches the exact invalidate action type and triggers a refetch of subscribed queries", async () => {
    const registry = new DevtoolsRegistry()
    const api = createTestApi()
    const recorder = createActionRecorder()
    const store = createTestStore(api, [
      createDevtoolsMiddleware(registry),
      recorder.middleware,
    ])

    vi.mocked(fetch).mockImplementation(async () =>
      jsonResponse({ id: 1, title: "Hello" } satisfies Post)
    )
    const result = store.dispatch(api.endpoints.getPost.initiate(1))
    await result
    expect(fetch).toHaveBeenCalledTimes(1)

    recorder.actions.length = 0
    invalidateTags(registry, api.reducerPath, [{ type: "Post", id: 1 }])

    expect(recorder.actions.map((a) => a.type)).toContain(
      `${api.reducerPath}/invalidateTags`
    )
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))

    result.unsubscribe()
  })
})

describe("setOnline / setFocused", () => {
  it("dispatches the exact global action types and updates every api's config", () => {
    const registry = new DevtoolsRegistry()
    const api = createTestApi()
    const recorder = createActionRecorder()
    const store = createTestStore(api, [
      createDevtoolsMiddleware(registry),
      recorder.middleware,
    ])

    expect(selectEnvironment(store.getState(), api.reducerPath)).toEqual({
      online: true,
      focused: true,
    })

    recorder.actions.length = 0
    setOnline(registry, false)
    setFocused(registry, false)

    // These carry no reducerPath: they are global RTK Query actions. Filtered
    // because the api also emits a lazy `config/middlewareRegistered` here.
    expect(
      recorder.actions.map((a) => a.type).filter((t) => t.startsWith("__rtkq/"))
    ).toEqual(["__rtkq/offline", "__rtkq/unfocused"])
    expect(selectEnvironment(store.getState(), api.reducerPath)).toEqual({
      online: false,
      focused: false,
    })

    setOnline(registry, true)
    setFocused(registry, true)
    expect(selectEnvironment(store.getState(), api.reducerPath)).toEqual({
      online: true,
      focused: true,
    })
  })

  it("going back online refetches queries that opted into refetchOnReconnect", async () => {
    const registry = new DevtoolsRegistry()
    const api = createTestApi("testApi", { refetchOnReconnect: true })
    const store = createTestStore(api, [createDevtoolsMiddleware(registry)])

    vi.mocked(fetch).mockImplementation(async () =>
      jsonResponse({ id: 1, title: "Hello" } satisfies Post)
    )
    const result = store.dispatch(api.endpoints.getPost.initiate(1))
    await result
    expect(fetch).toHaveBeenCalledTimes(1)

    setOnline(registry, false)
    setOnline(registry, true)

    // Proves the toggle drives real behaviour rather than just flipping a flag.
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    result.unsubscribe()
  })

  it("refocusing refetches queries that opted into refetchOnFocus", async () => {
    const registry = new DevtoolsRegistry()
    const api = createTestApi("testApi", { refetchOnFocus: true })
    const store = createTestStore(api, [createDevtoolsMiddleware(registry)])

    vi.mocked(fetch).mockImplementation(async () =>
      jsonResponse({ id: 1, title: "Hello" } satisfies Post)
    )
    const result = store.dispatch(api.endpoints.getPost.initiate(1))
    await result
    expect(fetch).toHaveBeenCalledTimes(1)

    setFocused(registry, false)
    setFocused(registry, true)

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    result.unsubscribe()
  })
})

describe("refetch", () => {
  it("returns ok:false when no apis were registered", () => {
    const registry = new DevtoolsRegistry()
    const api = createTestApi()
    createTestStore(api, [createDevtoolsMiddleware(registry)])

    expect(refetch(registry, api.reducerPath, "getPost", 1)).toEqual({
      ok: false,
      reason: "api-not-registered",
    })
  })

  it("dispatches a forceRefetch initiate thunk when the api is registered", async () => {
    const registry = new DevtoolsRegistry()
    const api = createTestApi()
    registry.configure({ apis: [api] })
    const store = createTestStore(api, [createDevtoolsMiddleware(registry)])

    vi.mocked(fetch).mockImplementation(async () =>
      jsonResponse({ id: 1, title: "Hello" } satisfies Post)
    )
    const result = store.dispatch(api.endpoints.getPost.initiate(1))
    await result
    expect(fetch).toHaveBeenCalledTimes(1)

    expect(refetch(registry, api.reducerPath, "getPost", 1)).toEqual({
      ok: true,
    })
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))

    result.unsubscribe()
  })
})
