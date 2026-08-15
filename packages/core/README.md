<!-- Absolute URL: npm rewrites relative image paths, and `files` only ships dist. -->
<img src="https://rtk-query-devtools.ryck.dev/logo-lockup.png" alt="rtk-query-devtools" width="380">

A [TanStack DevTools](https://tanstack.com/devtools) plugin for RTK Query. Inspect cache
entries, mutations, tags, and requests in real time.

**[rtk-query-devtools.ryck.dev](https://rtk-query-devtools.ryck.dev/)** hosts a live demo, with the
panel running against a real RTK Query cache alongside TanStack Query's for comparison.

RTK Query's only debugging surface today is the Redux DevTools action log, where cache
activity is buried alongside every other reducer. This gives it a dedicated panel: status at
a glance, a tag/invalidation explorer, a request timeline, and cache actions you can trigger
from the panel.

## Install

```bash
pnpm add -D rtk-query-devtools @tanstack/react-devtools
```

`@reduxjs/toolkit`, `react`, and `react-dom` are peer dependencies you already have.

## Usage

Two steps. Add the middleware to your store:

```ts
import { configureStore } from "@reduxjs/toolkit";
import { createRtkQueryDevtools } from "rtk-query-devtools";
import { api } from "./api";

// `apis` is optional. Without it everything still works except Refetch,
// which needs the real api object to dispatch a thunk.
export const rtkqDevtools = createRtkQueryDevtools({ apis: [api] });

export const store = configureStore({
  reducer: { [api.reducerPath]: api.reducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, rtkqDevtools.middleware),
});
```

Then register the plugin:

```tsx
import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRtkQueryDevtoolsPlugin } from "rtk-query-devtools";

export function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools plugins={[createRtkQueryDevtoolsPlugin()]} />
    </>
  );
}
```

No stylesheet import: the panel carries its own styles and injects them when it
first renders.

Multiple APIs are discovered automatically. An API selector appears in each tab once more
than one is found.

## What's in the panel

**Queries.** Every cache entry with a derived status (`fresh`, `fetching`, `error`,
`inactive`, `uninitialized`), subscriber count, polling indicator, and relative last-updated
time. Selecting one shows its args, data, error, provided tags, full request history, and the
raw entry. Actions: **Refetch**, **Invalidate tags**, **Remove**, plus a global **Reset API
state**.

The toolbar also carries **offline** and **focus** toggles that dispatch RTK Query's own
global actions, so you can exercise `refetchOnReconnect` and `refetchOnFocus` without
touching your app or your network.

**Mutations.** Keyed by request id (or `fixedCacheKey`), with arguments recovered from the
timeline, since RTK Query's mutation state doesn't retain them.

**Tags.** Provided tags grouped by type, expandable to the exact cache entries each one
touches, with per-tag **Invalidate**.

**Timeline.** A live request log with durations and outcomes, pause/clear, plus per-endpoint
timing aggregates (fastest / median / average / slowest) and error counts.

An **API config** strip surfaces `keepUnusedDataFor`, `invalidationBehavior`, and the
`refetchOn*` flags, and warns when RTK Query reports `middlewareRegistered: "conflict"`,
which means the same api's middleware is registered twice and caching will misbehave.

## Notes

- **Production builds tree-shake it out.** Both the middleware and the plugin become no-ops
  when `process.env.NODE_ENV === "production"`, so leaving them in your store config and app
  is safe.
- **Subscriber counts lag by up to ~500ms.** RTK Query syncs subscription state into the
  store on a throttled timer, by design.
- **RTK Query has no "stale" concept** the way TanStack Query does; it evicts via
  `keepUnusedDataFor` instead, so there's deliberately no stale badge. An entry that's
  fulfilled with zero subscribers shows as `inactive`.

## Compatibility

|                            |                           |
| -------------------------- | ------------------------- |
| `@reduxjs/toolkit`         | `>=2.0.0`                 |
| `react` / `react-dom`      | `^18` or `^19`            |
| `@tanstack/react-devtools` | `>=0.9.0` (optional peer) |
| Node                       | `>=20`                    |

## License

MIT
