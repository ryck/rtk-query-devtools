import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  selectApiHealth,
  selectMutationEntries,
  selectQueryEntries,
  selectTagGroups,
} from "./selectors";
import { createTestApi, createTestStore, jsonResponse, type Post } from "./test-utils/test-api";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("selectQueryEntries", () => {
  it("derives 'fresh' for a fulfilled query with an active subscriber", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      const api = createTestApi();
      const store = createTestStore(api);
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 1, title: "Hello" } satisfies Post));

      const result = store.dispatch(api.endpoints.getPost.initiate(1));
      await result;
      // Subscription state syncs into the store on a throttled 500ms timer.
      await vi.advanceTimersByTimeAsync(600);

      const entries = selectQueryEntries(store.getState(), api.reducerPath);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        endpointName: "getPost",
        type: "query",
        status: "fulfilled",
        derivedStatus: "fresh",
        data: { id: 1, title: "Hello" },
        subscriberCount: 1,
      });
      expect(entries[0]?.providedTags).toEqual([{ type: "Post", id: 1 }]);

      result.unsubscribe();
    } finally {
      vi.useRealTimers();
    }
  });

  it("derives 'inactive' once the last subscriber unsubscribes", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      const api = createTestApi();
      const store = createTestStore(api);
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 1, title: "Hello" } satisfies Post));

      const result = store.dispatch(api.endpoints.getPost.initiate(1));
      await result;
      result.unsubscribe();

      // Subscription state syncs into the store on a throttled 500ms timer.
      await vi.advanceTimersByTimeAsync(600);

      const entries = selectQueryEntries(store.getState(), api.reducerPath);
      expect(entries[0]).toMatchObject({ derivedStatus: "inactive", subscriberCount: 0 });
    } finally {
      vi.useRealTimers();
    }
  });

  it("derives 'error' for a rejected query", async () => {
    const api = createTestApi();
    const store = createTestStore(api);
    vi.mocked(fetch).mockResolvedValue(new Response("nope", { status: 500 }));

    const result = store.dispatch(api.endpoints.getPost.initiate(1));
    await result;

    const entries = selectQueryEntries(store.getState(), api.reducerPath);
    expect(entries[0]).toMatchObject({ status: "rejected", derivedStatus: "error" });
    expect(entries[0]?.error).toBeDefined();

    result.unsubscribe();
  });

  it("derives 'fetching' while a query is in flight", () => {
    const api = createTestApi();
    const store = createTestStore(api);
    let resolveFetch!: (r: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise((resolve) => (resolveFetch = resolve as never)));

    const result = store.dispatch(api.endpoints.getPost.initiate(1));

    const entries = selectQueryEntries(store.getState(), api.reducerPath);
    expect(entries[0]).toMatchObject({ status: "pending", derivedStatus: "fetching" });

    resolveFetch(jsonResponse({ id: 1, title: "Hello" }));
    result.unsubscribe();
  });

  // RTK Query's infinite-query thunk plumbing is out of scope here — these
  // exercise our own classification heuristic directly against the two
  // substate shapes RTK Query actually produces (see selectors.ts).
  it("classifies an infinite query by its {pages, pageParams} data shape", () => {
    const state = {
      api: {
        queries: {
          "listPosts(undefined)": {
            status: "fulfilled",
            endpointName: "listPosts",
            data: { pages: [[{ id: 1, title: "Hello" }]], pageParams: [1] },
            requestId: "req-1",
            startedTimeStamp: 0,
            fulfilledTimeStamp: 1,
          },
        },
        mutations: {},
        provided: { tags: {}, keys: {} },
        subscriptions: {},
      },
    };

    const entries = selectQueryEntries(state, "api");
    expect(entries[0]?.type).toBe("infinitequery");
  });

  it("classifies an infinite query by its direction field when data is absent", () => {
    const state = {
      api: {
        queries: {
          "listPosts(undefined)": {
            status: "pending",
            endpointName: "listPosts",
            direction: "forward",
            requestId: "req-1",
            startedTimeStamp: 0,
          },
        },
        mutations: {},
        provided: { tags: {}, keys: {} },
        subscriptions: {},
      },
    };

    const entries = selectQueryEntries(state, "api");
    expect(entries[0]?.type).toBe("infinitequery");
  });

  it("prefers a registry-learned endpoint type when the data shape is ambiguous", async () => {
    const api = createTestApi();
    const store = createTestStore(api);
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 1, title: "Hello" } satisfies Post));

    const result = store.dispatch(api.endpoints.getPost.initiate(1));
    await result;

    const entries = selectQueryEntries(store.getState(), api.reducerPath, () => "infinitequery");
    expect(entries[0]?.type).toBe("infinitequery");

    result.unsubscribe();
  });

  it("returns a stable array reference when the underlying slice hasn't changed", () => {
    const api = createTestApi();
    const store = createTestStore(api);
    const state = store.getState();

    const first = selectQueryEntries(state, api.reducerPath);
    const second = selectQueryEntries(state, api.reducerPath);
    expect(first).toBe(second);
  });

  it("returns an empty array for a reducer path that isn't RTK Query state", () => {
    expect(selectQueryEntries({ notAnApi: { value: 1 } }, "notAnApi")).toEqual([]);
  });
});

describe("selectMutationEntries", () => {
  it("derives fulfilled mutation entries keyed by requestId", async () => {
    const api = createTestApi();
    const store = createTestStore(api);
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 2, title: "New post" } satisfies Post));

    await store.dispatch(api.endpoints.addPost.initiate({ title: "New post" }));

    const entries = selectMutationEntries(store.getState(), api.reducerPath);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      endpointName: "addPost",
      status: "fulfilled",
      data: { id: 2, title: "New post" },
    });
    expect(entries[0]?.cacheKey).toBe(entries[0]?.requestId);
  });

  it("uses the fixedCacheKey as the cache key when one is provided", async () => {
    const api = createTestApi();
    const store = createTestStore(api);
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 2, title: "New post" } satisfies Post));

    await store.dispatch(
      api.endpoints.addPost.initiate({ title: "New post" }, { fixedCacheKey: "add-post" }),
    );

    const entries = selectMutationEntries(store.getState(), api.reducerPath);
    expect(entries.some((e) => e.cacheKey === "add-post")).toBe(true);
  });
});

describe("selectTagGroups", () => {
  it("groups provided tags by type and id", async () => {
    const api = createTestApi();
    const store = createTestStore(api);
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse([
        { id: 1, title: "A" },
        { id: 2, title: "B" },
      ] satisfies Post[]),
    );

    const result = store.dispatch(api.endpoints.listPosts.initiate());
    await result;

    const groups = selectTagGroups(store.getState(), api.reducerPath);
    const postGroup = groups.find((g) => g.tagType === "Post");
    expect(postGroup).toBeDefined();

    const ids = postGroup?.entries.map((e) => e.id).toSorted();
    expect(ids).toEqual(["1", "2", "LIST"]);

    result.unsubscribe();
  });
});

/**
 * RTK 2.6.2 split `provided` from a flat tag map into `{ tags, keys }`. Our
 * peer range is `>=2.0.0`, so both shapes must work — reading `provided.tags`
 * on the old shape yields `undefined` and throws.
 *
 * These use hand-built state rather than a real store (unlike the rest of this
 * file, deliberately): reproducing the old shape for real would mean
 * installing a second, aliased copy of RTK, which isn't worth the weight for a
 * pure data-shape adapter.
 */
describe("selectApiHealth", () => {
  it("surfaces the config RTK populates but never exposes", async () => {
    const api = createTestApi();
    const store = createTestStore(api);
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 1, title: "Hello" } satisfies Post));

    const result = store.dispatch(api.endpoints.getPost.initiate(1));
    await result;

    const health = selectApiHealth(store.getState(), api.reducerPath);
    expect(health).toMatchObject({
      reducerPath: api.reducerPath,
      middlewareRegistered: true,
      // RTK's documented defaults — proof we're reading the real slice.
      keepUnusedDataFor: 60,
      invalidationBehavior: "delayed",
      refetchOnFocus: false,
      refetchOnReconnect: false,
      cachedQueries: 1,
      cachedMutations: 0,
    });

    result.unsubscribe();
  });

  it("reports a middleware conflict when two apis share a reducerPath", () => {
    // The classic misconfiguration this warning exists for: two `createApi`
    // calls landing on the same reducerPath (duplicated module, bad HMR).
    // Each middleware carries its own uid, so the second registration no
    // longer matches and RTK flags the clash.
    const first = createTestApi("sharedPath");
    const second = createTestApi("sharedPath");
    const store = createTestStore(first, [second.middleware]);

    // Registration is lazy — it happens on the first dispatched action.
    store.dispatch({ type: "noop" });

    expect(selectApiHealth(store.getState(), "sharedPath")?.middlewareRegistered).toBe("conflict");
  });

  it("returns undefined for a reducer path that isn't RTK Query state", () => {
    expect(selectApiHealth({ notAnApi: { value: 1 } }, "notAnApi")).toBeUndefined();
  });
});

/** The pre-2.6.2 layout: `provided` *is* the tag map, with no reverse index. */
function legacyState(reducerPath: string) {
  return {
    [reducerPath]: {
      queries: {
        "getPost(1)": {
          status: "fulfilled",
          endpointName: "getPost",
          data: { id: 1, title: "Hello" },
        },
        "listPosts(undefined)": {
          status: "fulfilled",
          endpointName: "listPosts",
          data: [],
        },
      },
      mutations: {},
      provided: {
        Post: {
          "1": ["getPost(1)"],
          LIST: ["listPosts(undefined)"],
          __internal_without_id: ["listPosts(undefined)"],
        },
      },
      subscriptions: {},
    },
  };
}

describe("provided shape compatibility (RTK < 2.6.2)", () => {
  it("resolves tag groups from the flat legacy shape instead of throwing", () => {
    const groups = selectTagGroups(legacyState("legacyTags"), "legacyTags");

    expect(groups).toHaveLength(1);
    expect(groups[0]?.tagType).toBe("Post");
    expect(groups[0]?.entries.map((e) => e.id).toSorted()).toEqual([
      "1",
      "LIST",
      "__internal_without_id",
    ]);
  });

  it("derives the missing cache-key reverse index for per-entry provided tags", () => {
    const entries = selectQueryEntries(legacyState("legacyKeys"), "legacyKeys");

    const getPost = entries.find((e) => e.queryCacheKey === "getPost(1)");
    expect(getPost?.providedTags).toEqual([{ type: "Post", id: "1" }]);

    // The sentinel id is dropped rather than surfaced, matching what >= 2.6.2
    // stores natively for a tag provided without an id.
    const listPosts = entries.find((e) => e.queryCacheKey === "listPosts(undefined)");
    expect(listPosts?.providedTags).toEqual([{ type: "Post", id: "LIST" }, { type: "Post" }]);
  });

  it("keeps memoization working on the legacy shape", () => {
    // The normalized object is cached against RTK's own `provided` object, so
    // repeated calls must still hit the entry/tag caches rather than rebuild.
    const state = legacyState("legacyMemo");

    expect(selectQueryEntries(state, "legacyMemo")).toBe(selectQueryEntries(state, "legacyMemo"));
    expect(selectTagGroups(state, "legacyMemo")).toBe(selectTagGroups(state, "legacyMemo"));
  });

  it("leaves the modern shape untouched", () => {
    const state = {
      modern: {
        queries: {
          "getPost(1)": { status: "fulfilled", endpointName: "getPost", data: { id: 1 } },
        },
        mutations: {},
        provided: {
          tags: { Post: { "1": ["getPost(1)"] } },
          keys: { "getPost(1)": [{ type: "Post", id: 1 }] },
        },
        subscriptions: {},
      },
    };

    expect(selectQueryEntries(state, "modern")[0]?.providedTags).toEqual([{ type: "Post", id: 1 }]);
    expect(selectTagGroups(state, "modern")[0]?.tagType).toBe("Post");
    expect(selectQueryEntries(state, "modern")).toBe(selectQueryEntries(state, "modern"));
  });
});
