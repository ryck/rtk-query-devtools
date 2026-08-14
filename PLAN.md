# RTK Query DevTools — a TanStack DevTools Plugin

## Context

RTK Query has no dedicated devtools panel. Today its only debugging surface is the Redux DevTools extension, where cache activity is buried in a generic action log alongside every other reducer — you can inspect `state[reducerPath]` as a raw JSON blob, but there is no query-centric view, no status at a glance, and no way to trigger a refetch or invalidate a tag.

TanStack Query solves this with a dedicated panel showing every query, its status, its observers, and its data, with buttons to refetch/invalidate/reset. TanStack DevTools has since become a general plugin shell that any library can target, and there is currently **no RTK Query plugin in its marketplace registry**.

**Goal:** ship `rtk-query-devtools`, a TanStack DevTools plugin that gives RTK Query users the TanStack Query devtools experience — live query/mutation inspection, a tag/invalidation explorer, a request timeline, and cache actions — published to npm and submitted to the TanStack marketplace.

**Decisions already made** (do not revisit):

| Decision    | Choice                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transport   | **Direct store access.** A Redux middleware registers the store into a module singleton; the panel reads it via `useSyncExternalStore`. No serialization. |
| Frameworks  | **React only** for v1. Core stays framework-agnostic so adapters can be added later.                                                                      |
| v1 features | Inspect + actions, tags/invalidation explorer, request timeline. **No cache editing.**                                                                    |
| Scaffolding | Full OSS setup: pnpm monorepo, tsup, Biome, Vitest, Playwright, Changesets, CI/release, marketplace PR.                                                   |

---

## Verified background

Everything below was read from source, not assumed. Trust these facts; re-verify only if a major version bumps.

### TanStack DevTools plugin contract

Low-level interface (`docs/plugin-lifecycle.md`):

```ts
interface TanStackDevtoolsPlugin {
  id?: string;
  name: string | ((el: HTMLHeadingElement, theme: "dark" | "light") => void);
  render: (el: HTMLDivElement, theme: "dark" | "light") => void;
  destroy?: (pluginId: string) => void;
  defaultOpen?: boolean;
}
```

- The React adapter portals your JSX into `<div id="plugin-container-{pluginId}">`. **Your component runs in the host app's normal React tree** — hooks, context, and a shared module graph all work. This is what makes direct store access viable.
- `render` is re-invoked on theme change. At most 3 panels open at once. Active-tab selection persists in `localStorage` under `tanstack_devtools_state`.
- `destroy` is not needed — React `useEffect` cleanup is handled by the adapter.

### Packages to depend on

- `@tanstack/devtools-utils/react` → `createReactPlugin({ name, id, defaultOpen, Component })` returns a `readonly [Plugin, NoOpPlugin]` tuple. `NoOpPlugin` renders an empty fragment, for production tree-shaking. Panel components receive a `theme?: 'light' | 'dark'` prop (`DevtoolsPanelProps`).
- `@tanstack/react-devtools` → the host `<TanStackDevtools plugins={[...]} />`. Peer dep, **optional**.
- ⚠️ **`@tanstack/devtools-ui` is Solid-based** (`solid-js` peer dependency). It is unusable from a React panel. Build the UI with local React components + a local design-token module, exactly as `logtape-devtools` does in `packages/core/src/plugin/theme.ts`.
- We do **not** need `@tanstack/devtools-event-client` — that is the event-bus path we rejected.

### RTK Query state shape

`state[reducerPath]` is `CombinedState` (`packages/toolkit/src/query/core/apiState.ts`):

```ts
{
  queries:       { [queryCacheKey: string]: QuerySubState | InfiniteQuerySubState | undefined }
  mutations:     { [requestId: string]: MutationSubState | undefined }
  provided:      { tags: { [tagType]: { [id]: QueryCacheKey[] } }, keys: Record<QueryCacheKey, FullTagDescription[]> }
  subscriptions: { [queryCacheKey: string]: { [requestId: string]: SubscriptionOptions } | undefined }
  config:        { reducerPath, online, focused, middlewareRegistered, keepUnusedDataFor, invalidationBehavior, refetchOnFocus, refetchOnReconnect, refetchOnMountOrArgChange }
}
```

Per-entry substate fields: `status` (`QueryStatus`: `'uninitialized' | 'pending' | 'fulfilled' | 'rejected'`), `originalArgs`, `requestId`, `data`, `error`, `endpointName`, `startedTimeStamp`, `fulfilledTimeStamp`. Infinite queries additionally carry `direction` and `data: { pages, pageParams }`.

**Two caveats that shape the design:**

1. **`subscriptions` lags by up to 500ms.** The real subscription data lives in nested `Map`s inside the middleware; it is synced into Redux state on a throttled `setTimeout(..., 500)` purely "for visibility" in devtools (`buildMiddleware/batchActions.ts:166-190`). Subscriber counts are therefore _approximate_ — fine for a panel, but do not build anything that assumes they are instantaneous, and do not show a subscriber count as authoritative next to a live-updating status.
2. **`queryCacheKey` is `` `${endpointName}(${stableStringifiedArgs})` ``** (`defaultSerializeQueryArgs.ts`) — object keys sorted, bigints as `{$bigint}`. Parse `endpointName` off the front for display, but **always prefer the `endpointName` field on the substate** — users can supply a custom `serializeQueryArgs` that breaks the format.

### Dispatchable actions — derivable from `reducerPath` alone

All of these are plain action types, constructible as string literals with no reference to the `api` object:

| Action type                                     | Payload                         |
| ----------------------------------------------- | ------------------------------- |
| `${reducerPath}/resetApiState`                  | —                               |
| `${reducerPath}/invalidateTags`                 | `TagDescription[]`              |
| `${reducerPath}/queries/removeQueryResult`      | `{ queryCacheKey }`             |
| `${reducerPath}/mutations/removeMutationResult` | `{ requestId, fixedCacheKey? }` |

**Refetch is the exception.** It requires the thunk `api.endpoints[name].initiate(args, { subscribe: false, forceRefetch: true })`, which cannot be built from a string. This drives the API design below: the middleware alone gives you discovery + reset/remove/invalidate; passing `apis` additionally unlocks refetch.

### Thunk action types (for the timeline)

- `${reducerPath}/executeQuery/{pending,fulfilled,rejected}` — used for **both** `query` and `infinitequery`
- `${reducerPath}/executeMutation/{pending,fulfilled,rejected}`

`action.meta.arg` carries `type` (`'query' | 'mutation'`), `endpointName`, `originalArgs`, `queryCacheKey`, `subscribe`, `forceRefetch`, `startedTimeStamp`; infinite-query args also carry `direction`. `action.meta.requestId` correlates pending → settled. Note `meta.condition === true` on a rejected action means the request was skipped/deduped, not that it failed — exclude those from error counts.

### Endpoint type discrimination

`api.endpoints[name]` exposes only `{ name, select, initiate, matchPending, matchFulfilled, matchRejected }` — there is **no public `type` field**, and `context.endpointDefinitions` is closure-private (`createApi.ts:395`). Determine type at runtime in this priority order:

1. From observed thunk actions — `meta.arg.type` plus presence of `meta.arg.direction` for infinite queries. Cache the result per `endpointName`.
2. From state location — a key in `queries` is a query, a key in `mutations` is a mutation. An entry whose `data` has `{ pages, pageParams }` or that has a `direction` field is an infinite query.

Do not try to read private internals.

---

## Architecture

Three layers, strictly separated so a Vue/Solid adapter is a drop-in later.

```
┌─ App (Redux) ─────────────────────────────────────────┐
│  configureStore({ middleware: gdm().concat(           │
│      api.middleware, devtools.middleware) })          │
└───────────────┬───────────────────────────────────────┘
                │ middleware sees every action + store
                ▼
┌─ Layer 1: core (framework-agnostic, no React) ────────┐
│  DevtoolsRegistry  — singleton; holds store ref,      │
│    api refs, timeline ring buffer; subscribe/emit     │
│  discovery.ts      — find RTKQ reducerPaths in state  │
│  selectors.ts      — state → QueryEntry[]/Mutation[]/ │
│                      TagEntry[] (memoized)            │
│  actions.ts        — reset/remove/invalidate/refetch  │
└───────────────┬───────────────────────────────────────┘
                │ useSyncExternalStore
                ▼
┌─ Layer 2: React panel ────────────────────────────────┐
│  Tabs: Queries | Mutations | Tags | Timeline          │
└───────────────┬───────────────────────────────────────┘
                ▼
┌─ Layer 3: plugin factory ─────────────────────────────┐
│  createRtkQueryDevtoolsPlugin() → TanStackDevtools    │
└───────────────────────────────────────────────────────┘
```

### Public API

```tsx
// store.ts
import { createRtkQueryDevtools } from "rtk-query-devtools";

export const rtkqDevtools = createRtkQueryDevtools({
  apis: [api], // optional — unlocks per-entry Refetch
  maxTimelineEntries: 500, // optional, default 500
});

export const store = configureStore({
  reducer: { [api.reducerPath]: api.reducer },
  middleware: (gdm) => gdm().concat(api.middleware, rtkqDevtools.middleware),
});

// App.tsx
import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRtkQueryDevtoolsPlugin } from "rtk-query-devtools";

<TanStackDevtools plugins={[createRtkQueryDevtoolsPlugin()]} />;
```

Design notes:

- **`createRtkQueryDevtools()` writes to a module singleton**, so `createRtkQueryDevtoolsPlugin()` takes no required arguments — mirroring `defaultLogStore` in `logtape-devtools`. Accept an optional `{ devtools }` override on the plugin factory for tests and multi-store apps.
- **`apis` is optional.** Without it, discovery still works from state and reset/remove/invalidate still work; Refetch buttons render disabled with a tooltip explaining that `apis` must be passed. Do not throw.
- **`middleware` is a no-op passthrough in production** (`process.env.NODE_ENV !== 'development'`), so leaving it in the store config is safe.
- **Register the store lazily on first action**, not at creation time — Redux middleware receives the store API at construction, but reading state before the store is fully built is unsafe. Capture `storeApi` in the middleware closure and mark ready on first dispatch.

---

## Repo scaffolding

Mirror `mugenlabs-dev/logtape-devtools`, which is the cleanest of the two reference repos.

```
rtk-query-devtools/
├─ package.json                 # private root, pnpm workspaces
├─ pnpm-workspace.yaml
├─ biome.jsonc
├─ tsconfig.json
├─ vitest.config.ts             # projects: unit
├─ playwright.config.ts
├─ .changeset/config.json
├─ .github/workflows/{ci.yml,release.yml}
├─ .nvmrc  .gitignore  LICENSE (MIT)  README.md  CONTRIBUTING.md
├─ packages/core/               # the published package
├─ apps/demo/                   # Vite + React demo, doubles as the docs site
└─ e2e/                         # Playwright specs against apps/demo
```

Root `package.json` scripts: `build`, `dev`, `dev:demo`, `typecheck`, `test`, `test:ci`, `test:e2e`, `lint`, `lint:fix`, `changeset`. Node `>=20`, pnpm `>=10`.

### `packages/core/package.json`

```jsonc
{
  "name": "rtk-query-devtools",
  "type": "module",
  "sideEffects": false,
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs" },
    "./package.json": "./package.json",
  },
  "files": ["dist"],
  "publishConfig": { "access": "public", "provenance": true },
  "peerDependencies": {
    "@reduxjs/toolkit": ">=2.0.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "@tanstack/react-devtools": ">=0.9.0",
  },
  "peerDependenciesMeta": { "@tanstack/react-devtools": { "optional": true } },
  "dependencies": { "@tanstack/devtools-utils": "^0.6.0", "@tanstack/react-virtual": "^3.14.8" },
}
```

- **Confirm the npm name `rtk-query-devtools` is unregistered** before committing to it; fall back to a scoped name if taken.
- `@reduxjs/toolkit` is a peer dep, never bundled — the plugin must use the app's exact RTK instance.
- ESM-only, matching both reference plugins.

`tsup.config.ts`: `{ clean: true, dts: true, entry: { index: 'src/index.ts' }, external: ['react','react-dom','@reduxjs/toolkit'], format: ['esm'], outExtension: () => ({ js: '.mjs' }), sourcemap: true }`.

---

## Implementation

### `packages/core/src/` layout

```
types.ts                       # QueryEntry, MutationEntry, TagEntry, TimelineEvent, DerivedStatus
discovery.ts                   # findRtkQueryReducerPaths(state)
registry.ts                    # DevtoolsRegistry class + defaultRegistry singleton
middleware.ts                  # createDevtoolsMiddleware(registry)
selectors.ts                   # state -> entries, memoized
actions.ts                     # reset / removeCacheEntry / invalidateTags / refetch
create-rtk-query-devtools.ts   # public factory
plugin/
  create-rtk-query-devtools-plugin.tsx
  rtk-query-devtools-plugin.tsx    # panel root, tab shell
  hooks/use-rtkq-state.ts          # useSyncExternalStore bridge
  components/{queries-tab,mutations-tab,tags-tab,timeline-tab,
              entry-row,entry-detail,status-badge,toolbar,json-tree,empty-state}.tsx
  theme.ts                         # design tokens, light + dark
  format.ts                        # duration/relative-time/byte formatting, safe JSON
index.ts
```

### `discovery.ts`

Auto-detect every RTK Query API in the store without configuration:

```ts
export function findRtkQueryReducerPaths(state: Record<string, unknown>): string[] {
  return Object.keys(state).filter((key) => {
    const slice = state[key] as any;
    return (
      slice &&
      typeof slice === "object" &&
      slice.config?.reducerPath === key && // strongest signal
      "queries" in slice &&
      "mutations" in slice &&
      "provided" in slice &&
      "subscriptions" in slice
    );
  });
}
```

Only scan top-level keys; recompute when the set of root keys changes, not on every action. Supports multiple APIs — surface an API selector in the panel toolbar when more than one is found.

### `registry.ts`

A minimal observable, no external state library:

```ts
class DevtoolsRegistry {
  #storeApi: MiddlewareAPI | null = null;
  #apis = new Map<string, RtkQueryApi>(); // reducerPath -> api
  #timeline: TimelineEvent[] = []; // ring buffer
  #endpointTypes = new Map<string, EndpointType>(); // `${reducerPath}:${endpointName}`
  #listeners = new Set<() => void>();
  #version = 0; // bumped on any change

  subscribe(fn: () => void): () => void;
  getSnapshotVersion(): number; // cheap identity for useSyncExternalStore
  getState(): RootState | undefined;
  dispatch(action: UnknownAction): void;
  getTimeline(): readonly TimelineEvent[];
}
export const defaultRegistry = new DevtoolsRegistry();
```

**Notify listeners on a throttled schedule** (one `requestAnimationFrame` coalesce, or ~60ms). RTK Query dispatches many actions per request and the panel must not re-render per action. Use a monotonically-increasing `#version` integer as the `useSyncExternalStore` snapshot so React's `Object.is` check is trivially cheap — never return a freshly-built object from `getSnapshot`, that causes an infinite render loop.

### `middleware.ts`

```ts
export const createDevtoolsMiddleware = (registry) => (storeApi) => {
  registry.attachStore(storeApi);
  return (next) => (action) => {
    const result = next(action); // let RTK reduce first
    registry.recordAction(action); // timeline + endpoint-type cache
    registry.scheduleNotify();
    return result;
  };
};
```

- Call `next(action)` **first** so the timeline and any state read reflect the post-reduction state.
- `recordAction` matches `/executeQuery/` and `/executeMutation/` suffixes against the discovered reducer paths, correlating `meta.requestId` pending→settled to compute duration. Push into the ring buffer capped at `maxTimelineEntries` (default 500) — this is the only place with unbounded-growth risk.
- Skip rejected actions with `meta.condition === true` when counting errors (deduped/skipped, not failed).
- Learn endpoint types here from `meta.arg.type` / `meta.arg.direction`.
- In production the exported middleware is `() => (next) => (action) => next(action)`.

### `selectors.ts`

Pure functions `state → entries`, memoized on the slice object identity (RTK/Immer gives new references only on change, so `WeakMap`-keyed memoization on `slice.queries` works well).

`QueryEntry` shape:

```ts
{
  queryCacheKey, endpointName, reducerPath,
  type: 'query' | 'infinitequery',
  status: QueryStatus,
  derivedStatus: 'fresh' | 'fetching' | 'error' | 'inactive' | 'uninitialized',
  originalArgs, data, error,
  startedTimeStamp, fulfilledTimeStamp,
  subscriberCount: number,           // ⚠️ up to 500ms stale
  pollingInterval: number | undefined,
  providedTags: FullTagDescription[],
}
```

**Derived status mapping** — RTK Query has no `stale` concept the way TanStack Query does (it has `keepUnusedDataFor` eviction instead), so do not invent a fake "stale" badge. Map:

| Condition                                           | Badge           | Color |
| --------------------------------------------------- | --------------- | ----- |
| `status === 'pending'`                              | `fetching`      | blue  |
| `status === 'rejected'`                             | `error`         | red   |
| `status === 'fulfilled'` && `subscriberCount > 0`   | `fresh`         | green |
| `status === 'fulfilled'` && `subscriberCount === 0` | `inactive`      | grey  |
| `status === 'uninitialized'`                        | `uninitialized` | dim   |

Show a `polling` pill separately when any subscriber has a `pollingInterval`, rather than as a sixth mutually-exclusive status.

### `actions.ts`

```ts
resetApiState(registry, reducerPath)
  → dispatch({ type: `${reducerPath}/resetApiState` })

removeQueryEntry(registry, reducerPath, queryCacheKey)
  → dispatch({ type: `${reducerPath}/queries/removeQueryResult`, payload: { queryCacheKey } })

removeMutationEntry(registry, reducerPath, requestId, fixedCacheKey?)
  → dispatch({ type: `${reducerPath}/mutations/removeMutationResult`, payload: { requestId, fixedCacheKey } })

invalidateTags(registry, reducerPath, tags)
  → dispatch({ type: `${reducerPath}/invalidateTags`, payload: tags })

refetch(registry, reducerPath, endpointName, originalArgs)   // requires `apis`
  → api.endpoints[endpointName].initiate(originalArgs, { subscribe: false, forceRefetch: true })
```

Only `refetch` needs the `api` object. Return a discriminated result (`{ ok: false, reason: 'api-not-registered' }`) rather than throwing, and let the UI disable the button.

### Panel UI

Four tabs. Model the visual language on TanStack Query's devtools; borrow structure (not code) from `logtape-devtools/packages/core/src/plugin/components/`.

**Queries** — the default tab.

- Toolbar: search input (filters on endpoint name + serialized args), status filter chips with live counts, sort select (last updated / endpoint name / status), API selector when >1 API discovered, and a global "Reset API state" button (confirm first — it wipes all cache).
- Virtualized list (`@tanstack/react-virtual`) — real apps can have hundreds of cache entries.
- Row: status dot, endpoint name, dimmed args, subscriber count, relative "updated Xs ago".
- Detail pane on select: derived status, timings (`startedTimeStamp` → `fulfilledTimeStamp`, computed duration), subscriber count with a "may lag ~500ms" tooltip, provided tags as clickable chips that jump to the Tags tab, and collapsible JSON trees for `originalArgs`, `data`, `error`.
- Actions: **Refetch**, **Invalidate provided tags**, **Remove cache entry**.

**Mutations** — same shell, keyed by `requestId`, no subscriber count or tags; shows `endpointName`, status, duration, `data`/`error`. Action: **Remove**.

**Tags** — flatten `provided.tags` into `{ tagType, id, cacheKeys[] }`. Group by tag type, expand to list affected entries (clicking one selects it in the Queries tab). Per-row **Invalidate** button. Use `api.util.selectInvalidatedBy` when `apis` is available for an exact match; otherwise read `provided` directly.

**Timeline** — reverse-chronological list from the ring buffer: endpoint, `query`/`mutation` kind, outcome, duration, `forceRefetch`/`subscribe` flags. Filter by kind/outcome; pause/resume capture; clear. Cap at `maxTimelineEntries`.

**JSON tree** — write a local collapsible tree component. It must handle circular references, `Map`/`Set`, `BigInt`, `Date`, `undefined`, and functions without throwing; collapse nodes past a depth/size threshold by default. Do **not** `JSON.stringify` cached data eagerly — that is the single most likely source of a devtools-induced hang on a large cache. Only stringify on demand for a "copy" button.

**Theming** — export a token object with both light and dark values (extend the `logtape-devtools` `theme.ts` pattern, which is dark-only) and select on the `theme` prop from `DevtoolsPanelProps`. Inline styles or a tiny local CSS-in-JS; no global stylesheet, since the panel renders into the host page.

### `plugin/create-rtk-query-devtools-plugin.tsx`

```tsx
const [Plugin, NoOpPlugin] = createReactPlugin({
  name: "RTK Query",
  id: "rtk-query-devtools",
  Component: ({ theme }) => <RtkQueryDevtoolsPanel theme={theme} />,
});

export const createRtkQueryDevtoolsPlugin = (options?: RtkQueryDevtoolsPluginOptions) => {
  const factory = process.env.NODE_ENV === "development" ? Plugin : NoOpPlugin;
  return {
    ...factory(),
    defaultOpen: options?.defaultOpen ?? false,
    name: options?.name ?? "RTK Query",
  };
};
```

Use a **stable `id`** so the user's open-tab preference survives reloads. Default `defaultOpen` to `false` — RTK Query is rarely the only plugin, and the shell caps at 3 open panels.

---

## Testing

**Unit (Vitest, jsdom)** — this is where the leverage is, since every layer below the UI is pure.

- `discovery.test.ts` — detects one API, several APIs, ignores non-RTKQ slices, ignores a slice whose `config.reducerPath` disagrees with its key.
- `selectors.test.ts` — status derivation for all five badges; infinite-query detection; subscriber counting; provided-tag resolution; memoization returns identical references for unchanged slices.
- `middleware.test.ts` — build a real store with `configureStore` + a real `createApi` using `fetchBaseQuery` over a mocked fetch. Assert timeline entries and durations, ring-buffer capping, that `meta.condition` rejections are not counted as errors, and that the production middleware is a passthrough.
- `actions.test.ts` — assert exact dispatched action types against a real RTK Query store, and that state actually changes (this is the guard against RTK renaming an internal action in a minor release).
- `format.test.ts` / json-tree — circular refs, `BigInt`, `Map`/`Set`.

Use a **real `createApi` instance** rather than hand-rolled state fixtures wherever practical. The internal action types are the main version-coupling risk and only a real store will catch a rename.

**E2E (Playwright against `apps/demo`)** — panel opens; queries appear and update on interaction; search and status filters work; Refetch triggers a new request; Invalidate refetches subscribed entries; Remove drops the entry; Timeline records events; light/dark both render.

**Demo app (`apps/demo`)** — Vite + React + RTK Query against a small mock API (MSW or a local handler), with deliberate scenarios: slow endpoint, failing endpoint, polling endpoint, infinite query, mutation with tag invalidation, and a second `createApi` instance to exercise multi-API discovery.

---

## Verification

```bash
pnpm install
pnpm build          # tsup emits dist/index.mjs + index.d.ts
pnpm typecheck
pnpm test:ci        # vitest unit suite
pnpm lint
pnpm dev:demo       # http://localhost:5173
pnpm test:e2e
```

Manual pass in the demo, in both light and dark:

1. Panel appears as an "RTK Query" tab in the TanStack DevTools shell.
2. Trigger queries → rows appear with correct status badges; subscriber counts settle within ~500ms.
3. Unmount a component → entry flips to `inactive`.
4. Refetch / Invalidate / Remove / Reset each produce the expected state change.
5. Tags tab lists provided tags; invalidating one refetches exactly the subscribed entries it maps to.
6. Timeline records pending→fulfilled pairs with plausible durations and caps at the configured limit.
7. Build the demo with `NODE_ENV=production` and confirm the panel and middleware tree-shake out.

Also verify `pnpm publint` (or `npx publint`) passes on `packages/core` before the first release.

---

## Release & marketplace

1. Changesets → `release.yml` publishes to npm with provenance on merge of the version PR.
2. Submit a PR to `TanStack/devtools` adding an entry to `packages/devtools/src/tabs/plugin-registry.ts`:

```ts
'rtk-query-devtools': {
  packageName: 'rtk-query-devtools',
  title: 'RTK Query Devtools',
  description: 'Inspect RTK Query cache entries, mutations, tags, and requests in real time',
  requires: { packageName: '@reduxjs/toolkit', minVersion: '2.0.0' },
  pluginImport: { importName: 'createRtkQueryDevtoolsPlugin', type: 'function' },
  pluginId: 'rtk-query-devtools',
  docsUrl: 'https://rtk-query-devtools.ryck.dev/',
  author: '<author>',
  repoUrl: 'https://github.com/<owner>/rtk-query-devtools',
  framework: 'react',
  tags: ['redux', 'rtk-query', 'data-fetching', 'caching', 'state-management'],
},
```

Publish to npm **before** opening the registry PR — the marketplace card links to the package.

---

## Risks

- **Internal action types are not public API.** `${reducerPath}/queries/removeQueryResult` and `${reducerPath}/invalidateTags` are derived from RTK internals. They are stable across RTK 2.x, but pin `@reduxjs/toolkit` peer range to `>=2.0.0` and keep `actions.test.ts` running against a real store so a rename fails CI rather than silently no-oping in users' apps.
- **Large caches.** Never eagerly stringify or deep-clone cached data. Virtualize lists, lazy-render JSON subtrees, and coalesce store notifications.
- **Subscriber counts lag ~500ms** by RTK's design. Surface this in a tooltip rather than trying to work around it.
- **Custom `serializeQueryArgs`** breaks `endpointName(args)` cache-key parsing — always read `endpointName` from the substate field.
- **Panel/app realm coupling** is what makes direct access work. If TanStack DevTools ever moves plugins into an iframe or worker, this design would need the EventClient path instead. Keeping layer 1 free of React and free of DOM access is what keeps that migration cheap.
