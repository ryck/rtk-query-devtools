// --- Convenience factory ---
export type { RtkQueryDevtoolsInstance } from "./create-rtk-query-devtools";
export { createRtkQueryDevtools } from "./create-rtk-query-devtools";

// --- Plugin ---
export type { RtkQueryDevtoolsPluginOptions } from "./plugin/create-rtk-query-devtools-plugin";
export { createRtkQueryDevtoolsPlugin } from "./plugin/create-rtk-query-devtools-plugin";

// --- Registry (advanced: multi-store apps, tests) ---
export { defaultRegistry, DevtoolsRegistry } from "./registry";
export type { StoreLike } from "./registry";

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
} from "./types";
