import { createDevtoolsMiddleware, type DevtoolsMiddleware } from "./middleware"
import { defaultRegistry, type DevtoolsRegistry } from "./registry"
import type { RtkQueryDevtoolsOptions } from "./types"

export interface RtkQueryDevtoolsInstance {
  /** Add to your store's middleware chain. A no-op passthrough outside development. */
  middleware: DevtoolsMiddleware
  registry: DevtoolsRegistry
}

/**
 * Always-on implementation, shared by the dev-gated default entry
 * (`create-rtk-query-devtools.ts`) and the unguarded `rtk-query-devtools/production`
 * entry (`production.ts`).
 */
export function createRtkQueryDevtoolsImpl(
  options: RtkQueryDevtoolsOptions = {}
): RtkQueryDevtoolsInstance {
  defaultRegistry.configure(options)
  return {
    middleware: createDevtoolsMiddleware(defaultRegistry),
    registry: defaultRegistry,
  }
}
