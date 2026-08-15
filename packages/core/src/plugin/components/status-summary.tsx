import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { DerivedQueryStatus } from "../../types";
import type { RtkQueryDevtoolsClasses } from "../theme";

/**
 * Display order mirrors the "healthy first" reading of TanStack Query's own
 * devtools status pills, rather than the "worst first" severity order used
 * when sorting the query list itself (see STATUS_SEVERITY in queries-tab).
 */
const STATUS_DISPLAY_ORDER: DerivedQueryStatus[] = [
  "fresh",
  "fetching",
  "error",
  "uninitialized",
  "inactive",
];

const LABELS: Record<DerivedQueryStatus, string> = {
  fresh: "Fresh",
  fetching: "Fetching",
  error: "Error",
  uninitialized: "Uninitialized",
  inactive: "Inactive",
};

// Below this, the row drops the name text and shows dot + count only, the
// same collapse `ReactQueryDevtoolsPanel` does once its own header gets
// tight. Calibrated against the five labels at `text-xs`; the tab row this
// lives in keeps the Queries/Mutations/Tags/Timeline tabs at a fixed width
// (see `rtk-query-devtools-plugin.tsx`), so this element is the one that
// actually shrinks as the panel narrows.
const LABEL_COLLAPSE_WIDTH = 460;

export interface StatusSummaryProps {
  classes: RtkQueryDevtoolsClasses;
  counts: Record<DerivedQueryStatus, number>;
  activeStatuses: Set<DerivedQueryStatus>;
  onToggle: (status: DerivedQueryStatus) => void;
}

/**
 * A color-coded count-per-status row, same idea as the pills in
 * `ReactQueryDevtoolsPanel`'s header, doubling as the query-list status
 * filter (click to toggle; unselected entries dim once any filter is
 * active). Each entry reads dot → name → count, where only the dot and
 * the count badge carry the status color; the name stays neutral so the
 * row reads as text first, color second.
 */
export function StatusSummary({ classes, counts, activeStatuses, onToggle }: StatusSummaryProps) {
  const filtering = activeStatuses.size > 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width !== undefined) setShowLabels(width >= LABEL_COLLAPSE_WIDTH);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="rtkq:flex rtkq:min-w-0 rtkq:flex-1 rtkq:flex-wrap rtkq:items-center rtkq:justify-end rtkq:gap-1.5"
    >
      {STATUS_DISPLAY_ORDER.map((status) => {
        const active = activeStatuses.has(status);
        const statusClasses = classes.status[status];
        return (
          <button
            key={status}
            type="button"
            onClick={() => onToggle(status)}
            aria-label={`${LABELS[status]} ${counts[status]}`}
            aria-pressed={active}
            className={clsx(
              "rtkq:inline-flex rtkq:shrink-0 rtkq:cursor-pointer rtkq:items-center rtkq:gap-1.5 rtkq:rounded-full rtkq:px-2 rtkq:py-1 rtkq:text-xs rtkq:transition-opacity",
              classes.surface,
              filtering && !active && "rtkq:opacity-40",
            )}
          >
            <span
              className={clsx(
                "rtkq:h-1.5 rtkq:w-1.5 rtkq:shrink-0 rtkq:rounded-full",
                statusClasses.dot,
              )}
            />
            {showLabels && <span className={classes.textSecondary}>{LABELS[status]}</span>}
            <span
              className={clsx(
                "rtkq:rounded-full rtkq:px-1.5 rtkq:py-0.5 rtkq:text-[10px] rtkq:font-semibold rtkq:tabular-nums",
                statusClasses.badge,
              )}
            >
              {counts[status]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
