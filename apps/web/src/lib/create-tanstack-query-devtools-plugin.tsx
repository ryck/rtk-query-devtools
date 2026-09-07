import type { TanStackDevtoolsReactPlugin } from "@tanstack/react-devtools"
import { createReactPlugin } from "@tanstack/devtools-utils/react"
// `@tanstack/react-query-devtools`'s default entry no-ops itself outside
// `NODE_ENV === "development"`, same pattern as `rtk-query-devtools`. This
// demo site wants the real panel live even in its production build, so it
// imports from the `/production` subpath, which skips that gate.
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools/production"
import { queryClient } from "@/lib/query-client"

/**
 * TanStack Query doesn't ship its own TanStack DevTools-shell plugin yet.
 * `@tanstack/react-query-devtools` only exports `ReactQueryDevtoolsPanel`, a
 * component meant to be embedded directly. This wraps it with the same
 * `createReactPlugin` helper `rtk-query-devtools` itself uses, so both
 * plugins show up as tabs in the same devtools shell for comparison.
 */
export function createTanStackQueryDevtoolsPlugin(): TanStackDevtoolsReactPlugin {
  const [Plugin] = createReactPlugin({
    name: "TanStack Query",
    id: "tanstack-query-devtools",
    defaultOpen: false,
    Component: () => (
      <ReactQueryDevtoolsPanel
        client={queryClient}
        style={{ height: "100%", width: "100%" }}
      />
    ),
  })
  return Plugin()
}
