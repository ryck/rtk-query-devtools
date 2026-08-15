import { describe, expect, it } from "vitest";
import type { TimelineEvent, TimelineOutcome } from "../types";
import { computeTimelineStats } from "./stats";

let nextId = 0;

function event(
  endpointName: string,
  durationMs: number | undefined,
  outcome: TimelineOutcome = "fulfilled",
): TimelineEvent {
  nextId += 1;
  return {
    id: `e${nextId}`,
    reducerPath: "api",
    requestId: `r${nextId}`,
    queryCacheKey: `${endpointName}(undefined)`,
    kind: "query",
    endpointName,
    originalArgs: undefined,
    outcome,
    startedTimeStamp: 0,
    settledTimeStamp: durationMs,
    durationMs,
    forceRefetch: undefined,
    subscribe: undefined,
    error: undefined,
  };
}

describe("computeTimelineStats", () => {
  it("returns nothing when no request has settled", () => {
    expect(computeTimelineStats([])).toEqual({ endpoints: [], overall: undefined });
    expect(
      computeTimelineStats([event("listPosts", undefined, "pending")]).overall,
    ).toBeUndefined();
  });

  it("summarises duration spread per endpoint", () => {
    const stats = computeTimelineStats([
      event("listPosts", 100),
      event("listPosts", 200),
      event("listPosts", 300),
    ]);

    expect(stats.endpoints).toHaveLength(1);
    expect(stats.endpoints[0]).toMatchObject({
      endpointName: "listPosts",
      count: 3,
      errorCount: 0,
      fastestMs: 100,
      medianMs: 200,
      averageMs: 200,
      slowestMs: 300,
    });
  });

  // The bug in the Redux devtools monitor's equivalent: a default `.sort()` is
  // lexicographic, so [90, 100] orders as [100, 90] and the median is wrong
  // whenever durations differ in digit count.
  it("computes the median numerically, not lexicographically", () => {
    const stats = computeTimelineStats([
      event("listPosts", 100),
      event("listPosts", 90),
      event("listPosts", 80),
    ]);

    expect(stats.endpoints[0]?.medianMs).toBe(90);
    expect(stats.endpoints[0]?.fastestMs).toBe(80);
    expect(stats.endpoints[0]?.slowestMs).toBe(100);
  });

  it("averages the two middle values for an even number of requests", () => {
    const stats = computeTimelineStats([event("a", 100), event("a", 200)]);
    expect(stats.endpoints[0]?.medianMs).toBe(150);
  });

  it("counts rejections separately from successful requests", () => {
    const stats = computeTimelineStats([
      event("flaky", 50, "rejected"),
      event("flaky", 60, "rejected"),
      event("flaky", 70),
    ]);

    expect(stats.endpoints[0]).toMatchObject({ count: 3, errorCount: 2 });
  });

  // Deduped requests settle almost instantly and describe work that never
  // happened, so including them would drag `fastest` and the average to zero.
  it("ignores deduped/skipped requests entirely", () => {
    const stats = computeTimelineStats([event("listPosts", 300), event("listPosts", 0, "skipped")]);

    expect(stats.endpoints[0]).toMatchObject({ count: 1, fastestMs: 300 });
  });

  it("orders endpoints slowest first and aggregates an overall row", () => {
    const stats = computeTimelineStats([
      event("fast", 10),
      event("slow", 900),
      event("medium", 100),
    ]);

    expect(stats.endpoints.map((e) => e.endpointName)).toEqual(["slow", "medium", "fast"]);
    expect(stats.overall).toMatchObject({
      count: 3,
      fastestMs: 10,
      medianMs: 100,
      slowestMs: 900,
    });
  });
});
