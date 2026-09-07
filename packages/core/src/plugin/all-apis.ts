import type { SelectOption } from "./components/toolbar"

/**
 * Sentinel `activeApi` value meaning "merge every registered API together"
 * rather than scoping to one `reducerPath`. Deliberately not a real
 * `reducerPath` any api could plausibly have.
 */
export const ALL_APIS = "__rtkq-devtools/all-apis__"

/**
 * Toolbar options for the API select. "All APIs" is only offered when
 * there's more than one to merge — with a single api it would just
 * duplicate the one real option, so the select shows nothing extra (and
 * `Toolbar` itself hides the whole control once there's only one option).
 */
export function buildApiOptions(reducerPaths: string[]): SelectOption[] {
  const perApi = reducerPaths.map((p) => ({ value: p, label: p }))
  if (reducerPaths.length <= 1) return perApi
  return [{ value: ALL_APIS, label: "All APIs" }, ...perApi]
}
