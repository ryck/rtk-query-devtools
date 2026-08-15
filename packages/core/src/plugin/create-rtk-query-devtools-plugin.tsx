import type { TanStackDevtoolsReactPlugin } from "@tanstack/react-devtools";
import { createReactPlugin } from "@tanstack/devtools-utils/react";
import type { DevtoolsRegistry } from "../registry";
import { RtkQueryDevtoolsPlugin } from "./rtk-query-devtools-plugin";

export interface RtkQueryDevtoolsPluginOptions {
  /** Open the panel automatically on first load. Default: false, since TanStack DevTools caps open panels at 3, and RTK Query is rarely the only plugin registered. */
  defaultOpen?: boolean;
  /** Tab title. Default: "RTK Query". */
  name?: string;
  /** Overrides the module-level registry, mainly for tests or multi-store apps. */
  devtoolsRegistry?: DevtoolsRegistry;
}

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Creates a TanStack DevTools plugin config object for RTK Query.
 *
 * ```tsx
 * import { TanStackDevtools } from '@tanstack/react-devtools'
 * import { createRtkQueryDevtoolsPlugin } from 'rtk-query-devtools'
 * import 'rtk-query-devtools/style.css'
 *
 * <TanStackDevtools plugins={[createRtkQueryDevtoolsPlugin()]} />
 * ```
 *
 * Outside development this returns a bare no-op plugin object without
 * referencing the panel component at all: the early return below lets a
 * bundler that inlines `process.env.NODE_ENV` dead-code-eliminate the panel,
 * `createReactPlugin`, and everything they import.
 *
 * Typed against `@tanstack/react-devtools`'s own `TanStackDevtoolsReactPlugin`
 * (not the lower-level `TanStackDevtoolsPlugin` from `@tanstack/devtools`).
 * Its `render` returns a `JSX.Element` from `(el: HTMLElement, props) => ...`,
 * which is what `<TanStackDevtools plugins={[...]} />` actually expects.
 */
export function createRtkQueryDevtoolsPlugin(
  options: RtkQueryDevtoolsPluginOptions = {},
): TanStackDevtoolsReactPlugin {
  if (!isDevelopment) {
    return {
      id: "rtk-query-devtools",
      name: options.name ?? "RTK Query",
      defaultOpen: false,
      render: () => <></>,
    };
  }

  const [Plugin] = createReactPlugin({
    name: options.name ?? "RTK Query",
    id: "rtk-query-devtools",
    defaultOpen: options.defaultOpen ?? false,
    Component: ({ theme }) => (
      <RtkQueryDevtoolsPlugin theme={theme} devtoolsRegistry={options.devtoolsRegistry} />
    ),
  });
  return Plugin();
}
