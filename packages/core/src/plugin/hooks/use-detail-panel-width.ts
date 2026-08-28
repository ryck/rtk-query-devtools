import { useCallback } from "react"
import { usePersistentState } from "./use-persistent-state"

export const DETAIL_PANEL_MIN_WIDTH = 260
export const DETAIL_PANEL_MAX_WIDTH = 720
export const DETAIL_PANEL_DEFAULT_WIDTH = 380

function clamp(width: number): number {
  return Math.min(
    DETAIL_PANEL_MAX_WIDTH,
    Math.max(DETAIL_PANEL_MIN_WIDTH, width)
  )
}

/**
 * The detail panel's width, shared across every tab (Queries, Mutations,
 * Timeline) under one storage key. Resizing it in one tab keeps the same
 * width when you switch to another, rather than each tab remembering its own
 * — the same "consistent columns/layout across tabs" principle the row list
 * itself follows.
 */
export function useDetailPanelWidth() {
  const [width, setWidth] = usePersistentState(
    "detailPanelWidth",
    DETAIL_PANEL_DEFAULT_WIDTH
  )

  const resizeBy = useCallback(
    (deltaPx: number) => setWidth((prev) => clamp(prev + deltaPx)),
    [setWidth]
  )
  const reset = useCallback(
    () => setWidth(DETAIL_PANEL_DEFAULT_WIDTH),
    [setWidth]
  )

  return { width, resizeBy, reset }
}
