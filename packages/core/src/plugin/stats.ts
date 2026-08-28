import type { TimelineEvent } from "../types"

export interface DurationStats {
  count: number
  errorCount: number
  fastestMs: number
  medianMs: number
  averageMs: number
  slowestMs: number
}

export interface EndpointStats extends DurationStats {
  endpointName: string
}

export interface TimelineStats {
  /** Slowest endpoint first, the ordering you actually want when debugging. */
  endpoints: EndpointStats[]
  /** Undefined when nothing has settled yet. */
  overall: DurationStats | undefined
}

/**
 * `skipped` events are excluded throughout: they're requests RTK Query deduped
 * or short-circuited, so they settle almost instantly and would drag `fastest`
 * and the average toward zero while describing work that never happened.
 */
function isMeasurable(event: TimelineEvent): boolean {
  return event.durationMs !== undefined && event.outcome !== "skipped"
}

function median(durationsAsc: number[]): number {
  const mid = Math.floor(durationsAsc.length / 2)
  if (durationsAsc.length % 2 === 1) return durationsAsc[mid] ?? 0
  return ((durationsAsc[mid - 1] ?? 0) + (durationsAsc[mid] ?? 0)) / 2
}

function summarise(events: TimelineEvent[]): DurationStats {
  // Numeric comparator, not the default lexicographic one: `[100, 90]` sorts
  // to `[100, 90]` by default, which silently corrupts the median.
  const durations = events
    .map((e) => e.durationMs ?? 0)
    .toSorted((a, b) => a - b)
  const total = durations.reduce((sum, d) => sum + d, 0)

  return {
    count: events.length,
    errorCount: events.filter((e) => e.outcome === "rejected").length,
    fastestMs: durations[0] ?? 0,
    medianMs: median(durations),
    averageMs: durations.length > 0 ? total / durations.length : 0,
    slowestMs: durations.at(-1) ?? 0,
  }
}

/**
 * Per-endpoint request timings, which a cache entry can't tell you. It only
 * retains the latest request's timestamps, so "which endpoint is slowest, and
 * how often does it fail?" is only answerable from the event log.
 */
export function computeTimelineStats(
  events: readonly TimelineEvent[]
): TimelineStats {
  const measurable = events.filter(isMeasurable)
  if (measurable.length === 0) return { endpoints: [], overall: undefined }

  const byEndpoint = new Map<string, TimelineEvent[]>()
  for (const event of measurable) {
    const bucket = byEndpoint.get(event.endpointName)
    if (bucket) bucket.push(event)
    else byEndpoint.set(event.endpointName, [event])
  }

  const endpoints = Array.from(byEndpoint, ([endpointName, group]) => ({
    endpointName,
    ...summarise(group),
  })).toSorted((a, b) => b.slowestMs - a.slowestMs)

  return { endpoints, overall: summarise(measurable) }
}
