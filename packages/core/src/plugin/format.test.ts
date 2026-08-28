import { describe, expect, it } from "vitest"
import {
  formatDuration,
  formatQueryCacheKey,
  formatRelativeTime,
  safeStringify,
} from "./format"

function namedFn() {}

describe("formatQueryCacheKey", () => {
  it("collapses the (undefined) suffix for genuinely no-arg queries", () => {
    expect(formatQueryCacheKey("listPosts(undefined)", undefined)).toBe(
      "listPosts()"
    )
  })

  it("leaves the key untouched when args are actually present", () => {
    expect(formatQueryCacheKey("getPost(1)", 1)).toBe("getPost(1)")
  })

  it("does not touch a key that merely contains the text 'undefined' in real args", () => {
    // originalArgs is defined here (the string "undefined" itself), so this
    // must not be mistaken for the no-arg case.
    expect(formatQueryCacheKey('getPost("undefined")', "undefined")).toBe(
      'getPost("undefined")'
    )
  })
})

describe("formatDuration", () => {
  it("formats sub-second durations in milliseconds", () => {
    expect(formatDuration(0)).toBe("0ms")
    expect(formatDuration(42)).toBe("42ms")
    expect(formatDuration(999)).toBe("999ms")
  })

  it("formats durations under a minute in seconds", () => {
    expect(formatDuration(1000)).toBe("1.00s")
    expect(formatDuration(1500)).toBe("1.50s")
    expect(formatDuration(59999)).toBe("60.00s")
  })

  it("formats durations of a minute or more as minutes and seconds", () => {
    expect(formatDuration(60_000)).toBe("1m 0s")
    expect(formatDuration(90_000)).toBe("1m 30s")
  })

  it("returns a placeholder for undefined or NaN", () => {
    expect(formatDuration(undefined)).toBe("—")
    expect(formatDuration(Number.NaN)).toBe("—")
  })
})

describe("formatRelativeTime", () => {
  const now = 1_000_000

  it("returns a placeholder for undefined", () => {
    expect(formatRelativeTime(undefined, now)).toBe("—")
  })

  it("collapses sub-second differences to 'just now'", () => {
    expect(formatRelativeTime(now - 500, now)).toBe("just now")
    expect(formatRelativeTime(now, now)).toBe("just now")
  })

  it("formats seconds, minutes, hours, and days ago", () => {
    expect(formatRelativeTime(now - 30_000, now)).toBe("30s ago")
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe("5m ago")
    expect(formatRelativeTime(now - 3 * 3_600_000, now)).toBe("3h ago")
    expect(formatRelativeTime(now - 2 * 86_400_000, now)).toBe("2d ago")
  })
})

describe("safeStringify", () => {
  it("stringifies plain values normally", () => {
    expect(safeStringify({ a: 1, b: "two" })).toBe(
      JSON.stringify({ a: 1, b: "two" }, null, 2)
    )
  })

  it("survives circular references", () => {
    const obj: Record<string, unknown> = { name: "self" }
    obj.self = obj
    expect(() => safeStringify(obj)).not.toThrow()
    expect(safeStringify(obj)).toContain("[Circular]")
  })

  it("serializes BigInt values", () => {
    const result = safeStringify({ big: 9_007_199_254_740_993n })
    expect(JSON.parse(result)).toEqual({ big: { $bigint: "9007199254740993" } })
  })

  it("serializes Map and Set values", () => {
    const map = new Map([["a", 1]])
    const set = new Set([1, 2, 3])
    expect(JSON.parse(safeStringify({ map, set }))).toEqual({
      map: { $map: [["a", 1]] },
      set: { $set: [1, 2, 3] },
    })
  })

  it("serializes Date values via their native toJSON, no special-casing needed", () => {
    const date = new Date("2026-01-01T00:00:00.000Z")
    expect(JSON.parse(safeStringify({ date }))).toEqual({
      date: "2026-01-01T00:00:00.000Z",
    })
  })

  it("serializes functions as a readable placeholder instead of dropping them silently", () => {
    expect(JSON.parse(safeStringify({ fn: namedFn }))).toEqual({
      fn: "[Function: namedFn]",
    })
  })

  it("falls back to String() rather than throwing on values it cannot handle", () => {
    expect(() => safeStringify(Symbol("nope"))).not.toThrow()
  })
})
