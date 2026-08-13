import { createDevtoolsMiddleware, type DevtoolsMiddleware, noopMiddleware } from "./middleware";
import { defaultRegistry, type DevtoolsRegistry } from "./registry";
import type { RtkQueryDevtoolsOptions } from "./types";

export interface RtkQueryDevtoolsInstance {
  /** Add to your store's middleware chain. A no-op passthrough outside development. */
  middleware: DevtoolsMiddleware;
  registry: DevtoolsRegistry;
}

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Wires a Redux middleware into the module-level devtools registry. Call
 * once alongside `configureStore`. Safe to include unconditionally — outside
 * development this returns a passthrough middleware and never touches the
 * registry, so bundlers can dead-code-eliminate the rest of this module.
 */
export function createRtkQueryDevtools(
  options: RtkQueryDevtoolsOptions = {},
): RtkQueryDevtoolsInstance {
  if (!isDevelopment) {
    return { middleware: noopMiddleware, registry: defaultRegistry };
  }

  defaultRegistry.configure(options);
  return {
    middleware: createDevtoolsMiddleware(defaultRegistry),
    registry: defaultRegistry,
  };
}
