import { noopMiddleware } from "./middleware"
import {
  createRtkQueryDevtoolsImpl,
  type RtkQueryDevtoolsInstance,
} from "./create-rtk-query-devtools-impl"
import { defaultRegistry } from "./registry"
import type { RtkQueryDevtoolsOptions } from "./types"

export type { RtkQueryDevtoolsInstance } from "./create-rtk-query-devtools-impl"

const isDevelopment = process.env.NODE_ENV !== "production"

/**
 * Wires a Redux middleware into the module-level devtools registry. Call
 * once alongside `configureStore`. Safe to include unconditionally: outside
 * development this returns a passthrough middleware and never touches the
 * registry, so bundlers can dead-code-eliminate the rest of this module.
 *
 * Need it in a production build anyway (e.g. a hosted demo)? Import from
 * `rtk-query-devtools/production` instead, which skips this gate.
 */
export function createRtkQueryDevtools(
  options: RtkQueryDevtoolsOptions = {}
): RtkQueryDevtoolsInstance {
  if (!isDevelopment) {
    return { middleware: noopMiddleware, registry: defaultRegistry }
  }

  return createRtkQueryDevtoolsImpl(options)
}
