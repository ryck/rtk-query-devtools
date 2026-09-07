import { clsx } from "clsx"
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react"
import type { ReactNode } from "react"
import type { ApiHealth } from "../../selectors"
import { usePersistentState } from "../hooks/use-persistent-state"
import type { RtkQueryDevtoolsClasses } from "../theme"

function formatFlag(value: boolean | number | undefined): string {
  if (value === undefined) return "—"
  return String(value)
}

function ConflictAlert({
  classes,
  health,
}: {
  classes: RtkQueryDevtoolsClasses
  health: ApiHealth
}) {
  return (
    <div
      role="alert"
      className={clsx(
        "rtkq:flex rtkq:items-start rtkq:gap-1.5 rtkq:px-3 rtkq:py-1.5 rtkq:text-[11px]",
        classes.warning
      )}
    >
      <AlertTriangle size={13} className="rtkq:mt-px rtkq:shrink-0" />
      <span>
        <strong>Middleware registered more than once.</strong> RTK Query
        flagged a conflict for{" "}
        <code className="rtkq:font-mono">{health.reducerPath}</code>. Caching
        and invalidation will misbehave until it's added to exactly one
        store, once.
      </span>
    </div>
  )
}

function HealthDetails({
  classes,
  health,
}: {
  classes: RtkQueryDevtoolsClasses
  health: ApiHealth
}) {
  return (
    <dl className="rtkq:m-0 rtkq:grid rtkq:grid-cols-[max-content_1fr] rtkq:gap-x-3 rtkq:gap-y-1 rtkq:px-3 rtkq:pb-2 rtkq:text-[11px]">
      <HealthRow classes={classes} label="reducerPath" value={health.reducerPath} />
      <HealthRow
        classes={classes}
        label="keepUnusedDataFor"
        value={
          health.keepUnusedDataFor === undefined
            ? "—"
            : `${health.keepUnusedDataFor}s`
        }
      />
      <HealthRow
        classes={classes}
        label="invalidationBehavior"
        value={health.invalidationBehavior ?? "—"}
      />
      <HealthRow
        classes={classes}
        label="refetchOnFocus"
        value={formatFlag(health.refetchOnFocus)}
      />
      <HealthRow
        classes={classes}
        label="refetchOnReconnect"
        value={formatFlag(health.refetchOnReconnect)}
      />
      <HealthRow
        classes={classes}
        label="refetchOnMountOrArgChange"
        value={formatFlag(health.refetchOnMountOrArgChange)}
      />
      <HealthRow
        classes={classes}
        label="middlewareRegistered"
        value={String(health.middlewareRegistered)}
        emphasise={health.middlewareRegistered === "conflict"}
      />
    </dl>
  )
}

/** One nested, independently-collapsible api row inside the multi-api panel. */
function ApiHealthItem({
  classes,
  health,
}: {
  classes: RtkQueryDevtoolsClasses
  health: ApiHealth
}) {
  const [expanded, setExpanded] = usePersistentState(
    `queries.apiHealthOpen.${health.reducerPath}`,
    false
  )
  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={clsx(
          "rtkq:flex rtkq:w-full rtkq:cursor-pointer rtkq:items-center rtkq:gap-1 rtkq:border-0 rtkq:bg-transparent rtkq:py-1 rtkq:pr-3 rtkq:pl-6 rtkq:text-left rtkq:text-[10px] rtkq:font-semibold",
          classes.textMuted
        )}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="rtkq:font-mono">{health.reducerPath}</span>
        <span
          className={clsx(
            "rtkq:ml-1 rtkq:font-normal",
            classes.textDimmed
          )}
        >
          {health.cachedQueries} queries · {health.cachedMutations} mutations ·{" "}
          {health.subscriberCount} subs
        </span>
      </button>
      {expanded && <HealthDetails classes={classes} health={health} />}
    </div>
  )
}

/**
 * The api's configuration and size, which RTK populates but nothing surfaces.
 *
 * Collapsed by default so it costs no vertical space, except the
 * `middlewareRegistered: "conflict"` warning, which is always visible because
 * it means the app is genuinely misconfigured — regardless of collapse state,
 * at either level.
 *
 * A single registered api renders as one flat, directly-expandable strip.
 * More than one (All APIs mode) renders as a single top-level "API Config"
 * disclosure with each api nested inside as its own row, so merging apis
 * together doesn't multiply the number of top-level strips stacked in the
 * panel.
 */
export function ApiHealthPanel({
  classes,
  healths,
}: {
  classes: RtkQueryDevtoolsClasses
  healths: ApiHealth[]
}) {
  const [expanded, setExpanded] = usePersistentState(
    "queries.apiHealthOpen",
    false
  )
  const conflicts = healths.filter((h) => h.middlewareRegistered === "conflict")

  if (healths.length === 0) return null

  if (healths.length === 1) {
    const [health] = healths
    if (!health) return null
    return (
      <div className={clsx("rtkq:shrink-0 rtkq:border-b", classes.border)}>
        {conflicts.map((h) => (
          <ConflictAlert key={h.reducerPath} classes={classes} health={h} />
        ))}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={clsx(
            "rtkq:flex rtkq:w-full rtkq:cursor-pointer rtkq:items-center rtkq:gap-1 rtkq:border-0 rtkq:bg-transparent rtkq:px-3 rtkq:py-1.5 rtkq:text-left rtkq:text-[10px] rtkq:font-semibold",
            classes.textMuted
          )}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span className="rtkq:font-mono">{health.reducerPath}</span>
          <span className={clsx("rtkq:ml-1 rtkq:font-normal", classes.textDimmed)}>
            {health.cachedQueries} queries · {health.cachedMutations} mutations ·{" "}
            {health.subscriberCount} subs
          </span>
        </button>
        {expanded && <HealthDetails classes={classes} health={health} />}
      </div>
    )
  }

  const totalQueries = healths.reduce((sum, h) => sum + h.cachedQueries, 0)
  const totalMutations = healths.reduce((sum, h) => sum + h.cachedMutations, 0)
  const totalSubs = healths.reduce((sum, h) => sum + h.subscriberCount, 0)

  return (
    <div className={clsx("rtkq:shrink-0 rtkq:border-b", classes.border)}>
      {conflicts.map((h) => (
        <ConflictAlert key={h.reducerPath} classes={classes} health={h} />
      ))}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={clsx(
          "rtkq:flex rtkq:w-full rtkq:cursor-pointer rtkq:items-center rtkq:gap-1 rtkq:border-0 rtkq:bg-transparent rtkq:px-3 rtkq:py-1.5 rtkq:text-left rtkq:text-[10px] rtkq:font-semibold rtkq:tracking-wide rtkq:uppercase",
          classes.textMuted
        )}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        API config
        <span
          className={clsx(
            "rtkq:ml-1 rtkq:normal-case rtkq:font-normal",
            classes.textDimmed
          )}
        >
          {healths.length} apis · {totalQueries} queries · {totalMutations}{" "}
          mutations · {totalSubs} subs
        </span>
      </button>
      {expanded && (
        <div className="rtkq:pb-1">
          {healths.map((health) => (
            <ApiHealthItem
              key={health.reducerPath}
              classes={classes}
              health={health}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HealthRow({
  classes,
  label,
  value,
  emphasise,
}: {
  classes: RtkQueryDevtoolsClasses
  label: string
  value: ReactNode
  emphasise?: boolean
}) {
  return (
    <>
      <dt className={clsx("rtkq:m-0 rtkq:font-mono", classes.textMuted)}>
        {label}
      </dt>
      <dd
        className={clsx(
          "rtkq:m-0",
          emphasise ? classes.warning : classes.textPrimary
        )}
      >
        {value}
      </dd>
    </>
  )
}
