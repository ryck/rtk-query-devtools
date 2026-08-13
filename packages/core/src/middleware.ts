import type { DevtoolsRegistry, StoreLike } from "./registry";

/**
 * Structurally compatible with Redux's `Middleware` type, without depending
 * on it. Redux's real `Middleware` interface only narrows the *outer*
 * `storeApi` parameter (via `MiddlewareAPI<D, S>`) — the inner `next`/
 * `action` levels are typed `unknown` too, so this matches exactly.
 */
export type DevtoolsMiddleware = (
  storeApi: StoreLike,
) => (next: (action: unknown) => unknown) => (action: unknown) => unknown;

/**
 * Registers the store with the registry, records every RTK Query lifecycle
 * action for the timeline, and schedules a panel re-render on every action.
 * Redux calls a middleware's outer function once, synchronously, while
 * `configureStore` builds the middleware chain — the `storeApi` reference is
 * safe to capture and store at that point (the same pattern `redux-thunk`
 * uses); it's just unsafe to call `getState()`/`dispatch()` from *within*
 * this outer function, which this does not do. Reduction always runs first
 * via `next(action)` so the timeline and any state reads reflect
 * post-reduction state.
 *
 * `scheduleNotify()` is called unconditionally here, not just from within
 * `recordAction()` — the panel needs to re-render for *any* action that
 * might have changed the state it reads, not only the executeQuery/
 * executeMutation lifecycle actions `recordAction` looks for. That
 * includes our own plain actions (resetApiState, invalidateTags,
 * removeQueryResult, removeMutationResult) and RTK Query's own internal
 * `subscriptionsUpdated` action, which is what keeps subscriber counts
 * live. `scheduleNotify()` is already internally throttled, so calling it
 * unconditionally is cheap.
 */
export function createDevtoolsMiddleware(registry: DevtoolsRegistry): DevtoolsMiddleware {
  return (storeApi) => {
    registry.attachStore(storeApi);
    return (next) => (action) => {
      const result = next(action);
      registry.recordAction(action);
      registry.scheduleNotify();
      return result;
    };
  };
}

/** A no-op passthrough, safe to leave wired into a production store config. */
export const noopMiddleware: DevtoolsMiddleware = () => (next) => (action) => next(action);
