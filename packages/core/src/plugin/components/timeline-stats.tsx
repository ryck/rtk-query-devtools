import clsx from "clsx";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDuration } from "../format";
import { usePersistentState } from "../hooks/use-persistent-state";
import type { DurationStats, TimelineStats } from "../stats";
import type { RtkQueryDevtoolsClasses } from "../theme";

const COLUMNS = ["fastest", "median", "avg", "slowest"] as const;

/**
 * Per-endpoint request timings. A cache entry only retains its latest
 * request's timestamps, so "which endpoint is slowest, and how often does it
 * fail?" is only answerable by aggregating the event log.
 */
export function TimelineStatsPanel({
  classes,
  stats,
}: {
  classes: RtkQueryDevtoolsClasses;
  stats: TimelineStats;
}) {
  const [expanded, setExpanded] = usePersistentState("timeline.statsOpen", false);

  if (!stats.overall) return null;

  return (
    <div className={clsx("rtkq:shrink-0 rtkq:border-b", classes.border)}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={clsx(
          "rtkq:flex rtkq:w-full rtkq:cursor-pointer rtkq:items-center rtkq:gap-1 rtkq:border-0 rtkq:bg-transparent rtkq:px-3 rtkq:py-1.5 rtkq:text-left rtkq:text-[10px] rtkq:font-semibold rtkq:tracking-wide rtkq:uppercase",
          classes.textMuted,
        )}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Timings
        <span className={clsx("rtkq:ml-1 rtkq:font-normal rtkq:normal-case", classes.textDimmed)}>
          {stats.overall.count} requests · median {formatDuration(stats.overall.medianMs)} · slowest{" "}
          {formatDuration(stats.overall.slowestMs)}
        </span>
      </button>

      {expanded && (
        <div className="rtkq:px-3 rtkq:pb-2">
          <div className="rtkq:grid rtkq:grid-cols-[1fr_repeat(5,max-content)] rtkq:gap-x-3 rtkq:gap-y-1 rtkq:text-[11px]">
            <HeaderCell classes={classes}>endpoint</HeaderCell>
            <HeaderCell classes={classes}>n</HeaderCell>
            {COLUMNS.map((label) => (
              <HeaderCell key={label} classes={classes}>
                {label}
              </HeaderCell>
            ))}

            {stats.endpoints.map((endpoint) => (
              <StatsRow
                key={endpoint.endpointName}
                classes={classes}
                label={endpoint.endpointName}
                stats={endpoint}
              />
            ))}

            {stats.endpoints.length > 1 && (
              <StatsRow classes={classes} label="all" stats={stats.overall} muted />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HeaderCell({ classes, children }: { classes: RtkQueryDevtoolsClasses; children: string }) {
  return (
    <div
      className={clsx(
        "rtkq:text-[10px] rtkq:font-semibold rtkq:tracking-wide rtkq:uppercase",
        classes.textDimmed,
      )}
    >
      {children}
    </div>
  );
}

function StatsRow({
  classes,
  label,
  stats,
  muted,
}: {
  classes: RtkQueryDevtoolsClasses;
  label: string;
  stats: DurationStats;
  muted?: boolean;
}) {
  return (
    <>
      <div
        className={clsx(
          "rtkq:truncate rtkq:font-mono",
          muted ? classes.textMuted : classes.textPrimary,
        )}
      >
        {label}
      </div>
      <div className={clsx("rtkq:tabular-nums", classes.textMuted)}>
        {stats.count}
        {stats.errorCount > 0 && <span className={classes.danger}> ({stats.errorCount} err)</span>}
      </div>
      {[stats.fastestMs, stats.medianMs, stats.averageMs, stats.slowestMs].map((value, index) => (
        <div
          // Fixed, ordered columns — index is a stable key here.
          key={COLUMNS[index]}
          className={clsx("rtkq:tabular-nums", classes.textMuted)}
        >
          {formatDuration(value)}
        </div>
      ))}
    </>
  );
}
