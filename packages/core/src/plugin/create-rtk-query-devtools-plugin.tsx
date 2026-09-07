import type { TanStackDevtoolsReactPlugin } from "@tanstack/react-devtools"
import {
  createRtkQueryDevtoolsPluginImpl,
  type RtkQueryDevtoolsPluginOptions,
} from "./create-rtk-query-devtools-plugin-impl"

export type { RtkQueryDevtoolsPluginOptions } from "./create-rtk-query-devtools-plugin-impl"

const isDevelopment = process.env.NODE_ENV !== "production"

/**
 * Creates a TanStack DevTools plugin config object for RTK Query.
 *
 * ```tsx
 * import { TanStackDevtools } from '@tanstack/react-devtools'
 * import { createRtkQueryDevtoolsPlugin } from 'rtk-query-devtools'
 *
 * <TanStackDevtools plugins={[createRtkQueryDevtoolsPlugin()]} />
 * ```
 *
 * No stylesheet import: the panel injects its own (see panel-styles.tsx).
 *
 * Outside development this returns a bare no-op plugin object without
 * referencing the panel component at all: the early return below lets a
 * bundler that inlines `process.env.NODE_ENV` dead-code-eliminate the panel,
 * its embedded stylesheet, `createReactPlugin`, and everything they import.
 *
 * Need the real panel in a production build anyway (e.g. a hosted demo)?
 * Import from `rtk-query-devtools/production` instead, which skips this gate.
 *
 * Typed against `@tanstack/react-devtools`'s own `TanStackDevtoolsReactPlugin`
 * (not the lower-level `TanStackDevtoolsPlugin` from `@tanstack/devtools`).
 * Its `render` returns a `JSX.Element` from `(el: HTMLElement, props) => ...`,
 * which is what `<TanStackDevtools plugins={[...]} />` actually expects.
 */
export function createRtkQueryDevtoolsPlugin(
  options: RtkQueryDevtoolsPluginOptions = {}
): TanStackDevtoolsReactPlugin {
  if (!isDevelopment) {
    return {
      id: "rtk-query-devtools",
      name: options.name ?? "RTK Query",
      defaultOpen: false,
      render: () => <></>,
    }
  }

  return createRtkQueryDevtoolsPluginImpl(options)
}
