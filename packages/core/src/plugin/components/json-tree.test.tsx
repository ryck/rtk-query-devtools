import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getClasses } from "../theme"
import { JsonTree } from "./json-tree"

afterEach(cleanup)

const classes = getClasses("dark")

describe("JsonTree", () => {
  it("renders nested primitive values without crashing", () => {
    render(
      <JsonTree
        data={{ a: 1, b: "two", c: true, d: null, e: undefined }}
        classes={classes}
      />
    )
    expect(screen.getByText("1")).toBeTruthy()
    expect(screen.getByText('"two"')).toBeTruthy()
    expect(screen.getByText("true")).toBeTruthy()
    expect(screen.getByText("null")).toBeTruthy()
    expect(screen.getByText("undefined")).toBeTruthy()
  })

  it("renders [Circular] instead of recursing forever on a self-referential object", () => {
    const obj: Record<string, unknown> = { name: "self" }
    obj.self = obj

    // The root renders expanded by default, and the circularity check runs
    // before deciding whether a child needs its own expand/collapse toggle,
    // so a direct one-level cycle like this is visible immediately, no
    // click needed.
    render(<JsonTree data={obj} classes={classes} />)

    expect(screen.getByText("[Circular]")).toBeTruthy()
  })

  it("renders a BigInt as an n-suffixed token", () => {
    render(
      <JsonTree data={{ big: 9_007_199_254_740_993n }} classes={classes} />
    )
    expect(screen.getByText("9007199254740993n")).toBeTruthy()
  })

  it("renders Map and Set with a type label and size, without recursing eagerly", () => {
    const map = new Map([["a", 1]])
    const set = new Set([1, 2])

    render(<JsonTree data={{ map, set }} classes={classes} />)

    expect(screen.getByText("Map(1)")).toBeTruthy()
    expect(screen.getByText("Set(2)")).toBeTruthy()
  })

  it("collapses nodes past the default expand depth, and expands them on click", () => {
    render(
      <JsonTree
        data={{ level1: { level2: { value: "deep" } } }}
        classes={classes}
      />
    )

    expect(screen.queryByText('"deep"')).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /level1/ }))
    fireEvent.click(screen.getByRole("button", { name: /level2/ }))

    expect(screen.getByText('"deep"')).toBeTruthy()
  })

  // `name`/`message`/`stack` are non-enumerable, so `Object.entries` on an
  // Error is `[]`, so without special-casing, an error renders as a bare `{}`.
  it("renders an Error's non-enumerable fields instead of an empty object", () => {
    const error = Object.assign(new TypeError("boom"), { status: 500 })

    render(<JsonTree data={{ error }} classes={classes} />)
    fireEvent.click(screen.getByRole("button", { name: /error/ }))

    expect(screen.getByText('"boom"')).toBeTruthy()
    expect(screen.getByText('"TypeError"')).toBeTruthy()
    // Own enumerable props still come through, which is what carries the
    // useful detail on RTK's SerializedError.
    expect(screen.getByText("500")).toBeTruthy()
  })

  it("renders a Date as a value rather than descending into its (empty) own properties", () => {
    render(
      <JsonTree
        data={{ at: new Date("2026-01-01T00:00:00.000Z") }}
        classes={classes}
      />
    )
    expect(screen.getByText("2026-01-01T00:00:00.000Z")).toBeTruthy()
  })

  it("splits a large collection into collapsed chunks rather than rendering every row", () => {
    const big = Array.from({ length: 250 }, (_, i) => i)

    render(<JsonTree data={big} classes={classes} />)

    // 250 entries is past the auto-collapse threshold, so the root itself
    // starts closed. Open it to get at the chunk headers.
    fireEvent.click(screen.getByRole("button", { name: /250/ }))

    // Chunk headers are present...
    expect(screen.getByRole("button", { name: /\[0…99\]/ })).toBeTruthy()
    expect(screen.getByRole("button", { name: /\[100…199\]/ })).toBeTruthy()
    // ...and the final, partial chunk is labelled with the range it actually
    // holds rather than a full-width one it doesn't.
    expect(screen.getByRole("button", { name: /\[200…249\]/ })).toBeTruthy()

    // Nothing inside a chunk is rendered until it's opened.
    expect(screen.queryByText("42")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /\[0…99\]/ }))
    expect(screen.getByText("42")).toBeTruthy()
  })

  it("copies a node's value to the clipboard on demand", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", { clipboard: { writeText } })

    render(<JsonTree data={{ a: 1 }} classes={classes} />)
    fireEvent.click(
      screen.getAllByRole("button", { name: "Copy to clipboard" })[0]!
    )

    expect(writeText).toHaveBeenCalledOnce()
    expect(JSON.parse(writeText.mock.calls[0]![0] as string)).toEqual({ a: 1 })

    vi.unstubAllGlobals()
  })
})
