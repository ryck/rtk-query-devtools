import clsx from "clsx";
import type { ReactNode } from "react";
import type { RtkQueryDevtoolsClasses } from "../theme";

export interface EntryRowProps {
  classes: RtkQueryDevtoolsClasses;
  statusNode: ReactNode;
  title: string;
  /**
   * Rendered inline right after `title` on the same line (e.g. a cache key,
   * request id, or kind label) rather than stacked on a second line, so a row
   * never grows past a single line no matter how many fields it carries.
   */
  subtitle?: string;
  /** Tab-specific indicators (polling pill, subscriber count, "forced", …), rendered before the timestamp/duration columns. */
  badges?: ReactNode;
  /**
   * Preformatted (e.g. via `formatTimestamp`), fixed-width column. Passing
   * the same format from every row list keeps this column aligned and
   * reading as "the same kind of data" across Queries/Mutations/Timeline,
   * even though each entry type sources it from a different timestamp field.
   */
  timestamp?: string;
  /** Preformatted (e.g. via `formatDuration`), fixed-width column, always the row's rightmost element. */
  duration?: string;
  selected: boolean;
  onSelect: () => void;
}

export function EntryRow({
  classes,
  statusNode,
  title,
  subtitle,
  badges,
  timestamp,
  duration,
  selected,
  onSelect,
}: EntryRowProps) {
  return (
    <div
      className={clsx(
        "rtkq:flex rtkq:items-center rtkq:gap-2 rtkq:px-3 rtkq:py-1.5 rtkq:cursor-pointer rtkq:border-b rtkq:box-border rtkq:w-full",
        classes.border,
        selected ? classes.surfaceSelected : clsx("rtkq:bg-transparent", classes.surfaceHover),
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      role="button"
      tabIndex={0}
    >
      {statusNode}
      <div className="rtkq:flex rtkq:flex-1 rtkq:min-w-0 rtkq:items-baseline rtkq:gap-1.5">
        <span className={clsx("rtkq:shrink-0 rtkq:truncate rtkq:text-xs", classes.textPrimary)}>
          {title}
        </span>
        {subtitle && (
          <span
            className={clsx(
              "rtkq:min-w-0 rtkq:truncate rtkq:font-mono rtkq:text-[10px]",
              classes.textMuted,
            )}
          >
            {subtitle}
          </span>
        )}
      </div>
      {badges}
      {timestamp !== undefined && (
        <span
          className={clsx(
            "rtkq:w-14 rtkq:shrink-0 rtkq:text-right rtkq:text-[10px] rtkq:tabular-nums",
            classes.textDimmed,
          )}
        >
          {timestamp}
        </span>
      )}
      {duration !== undefined && (
        <span
          className={clsx(
            "rtkq:w-12 rtkq:shrink-0 rtkq:text-right rtkq:text-[10px] rtkq:tabular-nums",
            classes.textMuted,
          )}
        >
          {duration}
        </span>
      )}
    </div>
  );
}
