import clsx from "clsx";
import type { TimelineEvent } from "../../types";
import { formatDuration, formatRelativeTime } from "../format";
import type { RtkQueryDevtoolsClasses } from "../theme";
import { OutcomeBadge } from "./outcome-badge";

/**
 * Every request that targeted one cache entry, newest first.
 *
 * A cache entry holds only the *latest* request's timings, so this is the one
 * place the panel can answer "how many times has this refetched, and did any
 * of them fail?" — each refetch gets a fresh `requestId` under the same
 * `queryCacheKey`.
 */
export function EntryEvents({
  events,
  classes,
}: {
  events: TimelineEvent[];
  classes: RtkQueryDevtoolsClasses;
}) {
  if (events.length === 0) return null;

  return (
    <div className="rtkq:mb-3">
      <div
        className={clsx(
          "rtkq:text-[10px] rtkq:uppercase rtkq:tracking-wide rtkq:font-semibold",
          classes.textMuted,
        )}
      >
        Requests ({events.length})
      </div>
      <div
        className={clsx(
          "rtkq:mt-1 rtkq:rounded-md rtkq:border rtkq:overflow-hidden",
          classes.surface,
          classes.border,
        )}
      >
        {events.map((event, index) => (
          <div
            key={event.id}
            className={clsx(
              "rtkq:flex rtkq:items-center rtkq:gap-2 rtkq:px-2 rtkq:py-1.5",
              index > 0 && clsx("rtkq:border-t", classes.border),
            )}
          >
            <OutcomeBadge outcome={event.outcome} classes={classes} />
            <span className={clsx("rtkq:flex-1 rtkq:text-[10px]", classes.textMuted)}>
              {formatRelativeTime(event.startedTimeStamp)}
            </span>
            {event.forceRefetch && (
              <span className={clsx("rtkq:text-[10px]", classes.accent)}>forced</span>
            )}
            <span
              className={clsx(
                "rtkq:text-[10px] rtkq:tabular-nums rtkq:shrink-0",
                classes.textMuted,
              )}
            >
              {event.durationMs !== undefined ? formatDuration(event.durationMs) : "…"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
