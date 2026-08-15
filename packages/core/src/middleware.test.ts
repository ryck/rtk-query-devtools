import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDevtoolsMiddleware, noopMiddleware } from "./middleware";
import { DevtoolsRegistry } from "./registry";
import { createTestApi, createTestStore, jsonResponse, type Post } from "./test-utils/test-api";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("createDevtoolsMiddleware", () => {
  it("attaches the store to the registry as soon as the store is built", async () => {
    // Redux calls a middleware's outer function synchronously while
    // `configureStore` assembles the middleware chain, so the store api is
    // available before the store is returned, not just on first dispatch.
    const registry = new DevtoolsRegistry();
    const api = createTestApi();
    const store = createTestStore(api, [createDevtoolsMiddleware(registry)]);

    expect(registry.getStore()).toBeDefined();
    expect(registry.getState()).toBe(store.getState());

    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 1, title: "Hello" } satisfies Post));
    await store.dispatch(api.endpoints.getPost.initiate(1)).unwrap();
    expect(registry.getState()).toBe(store.getState());
  });

  it("records a pending/fulfilled query as a single timeline entry with a computed duration", async () => {
    const registry = new DevtoolsRegistry();
    const api = createTestApi();
    const store = createTestStore(api, [createDevtoolsMiddleware(registry)]);

    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 1, title: "Hello" } satisfies Post));
    const result = store.dispatch(api.endpoints.getPost.initiate(1));
    await result;

    const timeline = registry.getTimeline();
    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toMatchObject({
      reducerPath: api.reducerPath,
      endpointName: "getPost",
      kind: "query",
      outcome: "fulfilled",
    });
    expect(timeline[0]?.durationMs).toBeGreaterThanOrEqual(0);

    result.unsubscribe();
  });

  it("tags query events with their cache key so an entry's request history can be recovered", async () => {
    const registry = new DevtoolsRegistry();
    const api = createTestApi();
    registry.configure({ apis: [api] });
    const store = createTestStore(api, [createDevtoolsMiddleware(registry)]);

    vi.mocked(fetch).mockImplementation(async () =>
      jsonResponse({ id: 1, title: "Hello" } satisfies Post),
    );
    const result = store.dispatch(api.endpoints.getPost.initiate(1));
    await result;
    // A refetch of the same entry is a *new* requestId under the same cache
    // key, which is exactly what makes a per-entry history worth showing.
    await store.dispatch(api.endpoints.getPost.initiate(1, { forceRefetch: true }));

    const events = registry.getTimeline().filter((e) => e.queryCacheKey === "getPost(1)");
    expect(events).toHaveLength(2);
    expect(new Set(events.map((e) => e.requestId)).size).toBe(2);

    result.unsubscribe();
  });

  it("leaves queryCacheKey undefined for mutations, which RTK keys by requestId", async () => {
    const registry = new DevtoolsRegistry();
    const api = createTestApi();
    const store = createTestStore(api, [createDevtoolsMiddleware(registry)]);

    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 2, title: "New post" } satisfies Post));
    await store.dispatch(api.endpoints.addPost.initiate({ title: "New post" }));

    expect(registry.getTimeline()[0]?.queryCacheKey).toBeUndefined();
  });

  it("records a rejected mutation with its error", async () => {
    const registry = new DevtoolsRegistry();
    const api = createTestApi();
    const store = createTestStore(api, [createDevtoolsMiddleware(registry)]);

    vi.mocked(fetch).mockResolvedValue(new Response("boom", { status: 500 }));
    await store.dispatch(api.endpoints.addPost.initiate({ title: "New post" }));

    const timeline = registry.getTimeline();
    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toMatchObject({ kind: "mutation", outcome: "rejected" });
    expect(timeline[0]?.error).toBeDefined();
  });

  it("marks a deduped/skipped request outcome distinctly from a real rejection", async () => {
    const registry = new DevtoolsRegistry();
    const api = createTestApi();
    const store = createTestStore(api, [createDevtoolsMiddleware(registry)]);

    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 1, title: "Hello" } satisfies Post));

    // Two overlapping subscriptions to the same cache key: RTK Query
    // dedupes the second and rejects it with `meta.condition = true`.
    const first = store.dispatch(api.endpoints.getPost.initiate(1));
    const second = store.dispatch(api.endpoints.getPost.initiate(1));
    await Promise.all([first, second]);

    const timeline = registry.getTimeline();
    const outcomes = timeline.map((e) => e.outcome);
    expect(outcomes).toContain("fulfilled");
    expect(outcomes).not.toContain("rejected");

    first.unsubscribe();
    second.unsubscribe();
  });

  it("caps the timeline at the configured maxTimelineEntries, evicting oldest first", async () => {
    const registry = new DevtoolsRegistry();
    registry.configure({ maxTimelineEntries: 2 });
    const api = createTestApi();
    const store = createTestStore(api, [createDevtoolsMiddleware(registry)]);
    // A fresh Response per call, because reusing one `Response` instance across
    // multiple `fetch()` calls breaks once its body has been consumed.
    vi.mocked(fetch).mockImplementation(async () =>
      jsonResponse({ id: 1, title: "Hello" } satisfies Post),
    );

    await store.dispatch(api.endpoints.getPost.initiate(1)).unwrap();
    await store.dispatch(api.endpoints.getPost.initiate(2)).unwrap();
    await store.dispatch(api.endpoints.getPost.initiate(3)).unwrap();

    const timeline = registry.getTimeline();
    expect(timeline).toHaveLength(2);
    expect(timeline.every((e) => e.originalArgs !== 1)).toBe(true);
  });

  it("learns the endpoint type from observed thunk actions", async () => {
    const registry = new DevtoolsRegistry();
    const api = createTestApi();
    const store = createTestStore(api, [createDevtoolsMiddleware(registry)]);
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 1, title: "Hello" } satisfies Post));

    await store.dispatch(api.endpoints.getPost.initiate(1)).unwrap();

    expect(registry.getEndpointType(api.reducerPath, "getPost")).toBe("query");
  });

  it("schedules a panel re-render for any action, not just query/mutation lifecycle actions", async () => {
    // Regression guard: recordAction() only schedules a notify for matched
    // executeQuery/executeMutation actions, so plain actions (our own
    // resetApiState/invalidateTags/removeQueryResult, and RTK Query's own
    // internal subscriptionsUpdated) would silently never refresh the
    // panel unless the middleware also calls scheduleNotify() unconditionally.
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      const registry = new DevtoolsRegistry();
      const api = createTestApi();
      const store = createTestStore(api, [createDevtoolsMiddleware(registry)]);
      const listener = vi.fn();
      registry.subscribe(listener);
      const versionBefore = registry.getVersion();

      store.dispatch({ type: `${api.reducerPath}/resetApiState` });
      await vi.advanceTimersByTimeAsync(100);

      expect(listener).toHaveBeenCalled();
      expect(registry.getVersion()).toBeGreaterThan(versionBefore);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("noopMiddleware", () => {
  it("passes actions through without side effects", () => {
    const next = vi.fn((action: unknown) => action);
    const dispatch = noopMiddleware({ getState: () => ({}), dispatch: () => {} })(next);

    const action = { type: "anything" };
    const result = dispatch(action);

    expect(result).toBe(action);
    expect(next).toHaveBeenCalledWith(action);
  });
});
