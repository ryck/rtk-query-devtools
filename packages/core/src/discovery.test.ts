import { describe, expect, it } from "vitest"
import { findRtkQueryReducerPaths } from "./discovery"

function rtkQuerySlice(reducerPath: string) {
  return {
    queries: {},
    mutations: {},
    provided: { tags: {}, keys: {} },
    subscriptions: {},
    config: {
      reducerPath,
      online: true,
      focused: true,
      middlewareRegistered: true,
    },
  }
}

describe("findRtkQueryReducerPaths", () => {
  it("detects a single RTK Query API", () => {
    const state = { api: rtkQuerySlice("api") }
    expect(findRtkQueryReducerPaths(state)).toEqual(["api"])
  })

  it("detects several RTK Query APIs", () => {
    const state = {
      postsApi: rtkQuerySlice("postsApi"),
      usersApi: rtkQuerySlice("usersApi"),
    }
    expect(findRtkQueryReducerPaths(state)).toEqual(["postsApi", "usersApi"])
  })

  it("ignores slices that don't look like RTK Query state", () => {
    const state = {
      api: rtkQuerySlice("api"),
      counter: { value: 0 },
      auth: { token: "abc", user: null },
    }
    expect(findRtkQueryReducerPaths(state)).toEqual(["api"])
  })

  it("ignores a slice whose config.reducerPath disagrees with its key", () => {
    // e.g. two api instances accidentally sharing a reducerPath, or a
    // moved/renamed reducer key; config.reducerPath is the source of truth.
    const state = { renamedApi: rtkQuerySlice("originalApi") }
    expect(findRtkQueryReducerPaths(state)).toEqual([])
  })

  it("ignores a slice missing required fields", () => {
    const state = { api: { config: { reducerPath: "api" }, queries: {} } }
    expect(findRtkQueryReducerPaths(state)).toEqual([])
  })

  it("returns an empty array for non-object state", () => {
    expect(findRtkQueryReducerPaths(null)).toEqual([])
    expect(findRtkQueryReducerPaths(undefined)).toEqual([])
    expect(findRtkQueryReducerPaths("nope")).toEqual([])
  })
})
