# TODO

Parked work from the ReactQueryDevtoolsPanel parity effort. Phases 1–3 are done and
shipped; 4 and 5 are not started.

The gap analysis these phases came from was taken against the real, unminified source of
`@tanstack/query-devtools@5.101.4` (the tarball ships `src/`). Findings below were verified
against installed `@reduxjs/toolkit@2.12.0`. They cost real digging, so they're recorded
here rather than re-derived.

## Done

| Phase | What                                                                                                                                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Explorer & inspection: per-node copy, 100-item chunking, `N items` hints, raw entry/mutation explorer sections, mutation Arguments via timeline correlation, adopted the previously-dead formatters. Also fixed two latent bugs: `Error` and `Date` both rendered as bare `{}`. |
| 2     | Toolbar & UX parity: Asc/Desc sort toggle (comparators rewritten ascending so the labels are truthful), sort selector for Mutations, `localStorage` persistence under `rtkq-devtools:`, fuzzy search via `@tanstack/match-sorter-utils`.                                        |
| 3     | Environment simulation: `setOnline`/`setFocused` global actions + amber toolbar toggles, backed by tests asserting real `refetchOnReconnect`/`refetchOnFocus` refetches.                                                                                                        |

A second benchmark, against `@redux-devtools/rtk-query-monitor` (the RTK-native inspector in
`reduxjs/redux-devtools`), is also complete:

| Phase | What                                                                                                                                                                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Bug fix.** `provided` changed shape in RTK 2.6.2; we read the new shape unconditionally, so the panel _crashed_ on RTK 2.0–2.6.1 despite a `>=2.0.0` peer range. Normalized behind a `WeakMap`, deriving the reverse index the old shape lacks. |
| B     | Per-entry request history: `TimelineEvent.queryCacheKey` plus a "Requests (n)" section in the query detail.                                                                                                                                       |
| C     | API health strip: the `config` slice nothing surfaces, plus an always-visible `middlewareRegistered: "conflict"` warning.                                                                                                                         |
| D     | Aggregate timings: per-endpoint fastest/median/average/slowest + error counts, slowest first.                                                                                                                                                     |
| E     | Polish: tab counts, regex search toggle, tab/panel a11y wiring.                                                                                                                                                                                   |

---

## Phase 4: Cache editing & state simulation (parked)

The highest-value remaining work, and the deepest internals coupling in the package.

**This reverses a v1 decision.** `PLAN.md` records "**No cache editing**" as settled. That was
right for v1; revisit deliberately, not by accident.

### Verified feasibility

- **`api.util` has everything needed:** `updateQueryData`, `upsertQueryData`, `patchQueryData`,
  `prefetch`, `selectInvalidatedBy` all exist at runtime
  (`@reduxjs/toolkit/dist/query/index.d.ts:1031-1144`). The only thing hiding them is our own
  deliberately-narrow `RtkQueryApiLike` (`packages/core/src/types.ts:80-93`).
- **Trigger Error is dispatchable.** The `queryThunk.rejected` reducer sets `status`/`error`
  only when `substate.requestId === action.meta.requestId` and `meta.condition` is falsy
  (`dist/query/cjs/rtk-query.development.cjs:1482-1498`). We already carry `requestId` on
  `QueryEntry` (`types.ts:22`), so a faked rejected action works, but it must be
  test-guarded, being a deeper coupling than the four slice actions `actions.ts` already uses.

### Work

1. **Widen `RtkQueryApiLike`** with an optional `util`, keeping the existing structural-typing
   escape valve and extending (not replacing) the comment explaining why it's narrow:

   ```ts
   util?: {
     updateQueryData?: (endpointName: any, args: any, updater: (draft: any) => void) => unknown;
     upsertQueryData?: (endpointName: any, args: any, value: any) => unknown;
     selectInvalidatedBy?: (state: any, tags: any) => Array<{ endpointName: string; originalArgs: any; queryCacheKey: string }>;
     prefetch?: (endpointName: any, args: any, options?: Record<string, unknown>) => unknown;
   };
   ```

   Treat every member as optional **at runtime**, following the existing Refetch pattern:
   disabled control + explanatory tooltip when `apis` wasn't passed. Never throw.

2. **Editing** (`json-tree.tsx`, `entry-detail.tsx`): inline edit for string/number/boolean
   leaves and delete for collection members via `updateQueryData`; a bulk JSON editor toggled
   by a pencil icon (TanStack swaps its heading "Data Explorer" ↔ "Data Editor"), with
   `Cancel`/`Save` and an `Invalid Value` parse error. Gate to `type === "query"`, since infinite
   queries' `{pages, pageParams}` needs its own UX and is explicitly out of scope.

3. **State simulation** (`actions.ts`): `triggerError(registry, entry, error?)` dispatching
   `${reducerPath}/executeQuery/rejected` with
   `meta: { condition: false, arg: { queryCacheKey }, requestId: entry.requestId }`; a
   `pending` analogue for `triggerLoading`. Both require `entry.requestId` to be set (the
   query must have run at least once); disable otherwise. "Restore" for both is just the
   existing Refetch; label the buttons accordingly rather than building a separate path.
   Optionally support an `errorTypes` plugin option (`{ name, initializer }[]`, matching
   TanStack's `DevtoolsErrorType`) surfaced as a dropdown.

4. **Surface action failures.** `refetch()` returns a `RefetchResult` that
   `queries-tab.tsx:344` currently discards. There is no way for any action to report a
   failure to the user. Introduce a small shared result/toast surface as part of this phase.

5. **Tests are mandatory here.** Extend `actions.test.ts` against a real
   `configureStore` + `createApi`, asserting the resulting substate, so an RTK rename fails
   CI rather than silently no-op'ing in users' apps. That's the guard the existing four
   actions already have.

---

## Phase 5: Deepen our differentiators (not started)

TanStack Query's panel has no Tags tab, no Timeline tab, no multi-API selector and no list
virtualization. These are ours to widen rather than catch up on.

1. **Timeline row actions** (`timeline-tab.tsx`): the detail pane is entirely read-only.
   Add **Replay** (refetch with the recorded `originalArgs`), **Jump to query** (reuse
   `navigateToQuery`, `rtk-query-devtools-plugin.tsx:111`), and **Copy**.
   _Unblocked:_ `TimelineEvent` now carries `queryCacheKey`, so a timeline event can be
   mapped back to its cache entry directly.
2. **Exact tag → query resolution** (`tags-tab.tsx`): use `api.util.selectInvalidatedBy` when
   `apis` is available, falling back to today's `provided` read. Depends on the Phase 4 type
   widening.
3. **Virtualize the Tags tab.** The only tab still using a plain `.map()`
   (`tags-tab.tsx:89`).

---

## Deliberately not doing

Recorded so these don't get re-litigated:

- **Per-query `Reset`.** No RTK Query equivalent. `resetQueries` restores a query to its
  initial state; RTKQ's nearest action is `removeQueryResult`, which is already our Remove.
- **A `stale` status.** RTK Query has no staleness model (only `keepUnusedDataFor` eviction).
  Inventing one would misrepresent the library.
- **Panel position, resize, theme preference, Picture-in-Picture.** Owned by the TanStack
  DevTools shell we render into, not by a plugin.
- **`static` badge.** No RTKQ concept.
- **Persisting the Tags tab search.** It's seeded by cross-tab navigation, and a restored
  value would silently override that.

## Gotcha

`pnpm test:e2e` runs against the **built** `packages/core`, so run `pnpm run build` (or
`pnpm run typecheck`, which builds first) before it; otherwise the demo silently resolves a
stale `dist` and new UI appears to be missing.
