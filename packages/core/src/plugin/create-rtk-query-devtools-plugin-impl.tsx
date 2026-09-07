import type { TanStackDevtoolsReactPlugin } from "@tanstack/react-devtools"
import { createReactPlugin } from "@tanstack/devtools-utils/react"
import type { DevtoolsRegistry } from "../registry"
import { RtkQueryDevtoolsPlugin } from "./rtk-query-devtools-plugin"

export interface RtkQueryDevtoolsPluginOptions {
  /** Open the panel automatically on first load. Default: false, since TanStack DevTools caps open panels at 3, and RTK Query is rarely the only plugin registered. */
  defaultOpen?: boolean
  /** Tab title. Default: "RTK Query". */
  name?: string
  /** Overrides the module-level registry, mainly for tests or multi-store apps. */
  devtoolsRegistry?: DevtoolsRegistry
}

/**
 * Always-on implementation, shared by the dev-gated default entry
 * (`create-rtk-query-devtools-plugin.tsx`) and the unguarded
 * `rtk-query-devtools/production` entry (`production.ts`).
 */
export function createRtkQueryDevtoolsPluginImpl(
  options: RtkQueryDevtoolsPluginOptions = {}
): TanStackDevtoolsReactPlugin {
  const [Plugin] = createReactPlugin({
    name: options.name ?? "RTK Query",
    id: "rtk-query-devtools",
    defaultOpen: options.defaultOpen ?? false,
    Component: ({ theme }) => (
      <RtkQueryDevtoolsPlugin
        theme={theme}
        devtoolsRegistry={options.devtoolsRegistry}
      />
    ),
  })
  return Plugin()
}
