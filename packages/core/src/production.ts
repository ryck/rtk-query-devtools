// Unguarded twin of `index.ts`: skips the `process.env.NODE_ENV === "production"`
// no-op gate on `createRtkQueryDevtools` / `createRtkQueryDevtoolsPlugin`, for
// the rare case where you want the real panel in a production build (e.g. a
// hosted demo). Everything else is identical to the default entry.

// --- Convenience factory ---
export type { RtkQueryDevtoolsInstance } from "./create-rtk-query-devtools-impl"
export { createRtkQueryDevtoolsImpl as createRtkQueryDevtools } from "./create-rtk-query-devtools-impl"

// --- Plugin ---
export type { RtkQueryDevtoolsPluginOptions } from "./plugin/create-rtk-query-devtools-plugin-impl"
export { createRtkQueryDevtoolsPluginImpl as createRtkQueryDevtoolsPlugin } from "./plugin/create-rtk-query-devtools-plugin-impl"

// --- Registry (advanced: multi-store apps, tests) ---
export { defaultRegistry, DevtoolsRegistry } from "./registry"
export type { StoreLike } from "./registry"

// --- Types ---
export type {
  DerivedQueryStatus,
  EndpointType,
  MutationEntry,
  QueryEntry,
  QueryStatus,
  RefetchResult,
  RtkQueryApiLike,
  RtkQueryDevtoolsOptions,
  TagDescription,
  TagGroup,
  TagGroupEntry,
  TimelineEvent,
  TimelineOutcome,
} from "./types"
