import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import type { ApiHealth } from "../../selectors"
import { getClasses } from "../theme"
import { ApiHealthStrip } from "./api-health"

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const classes = getClasses("dark")

function health(overrides: Partial<ApiHealth> = {}): ApiHealth {
  return {
    reducerPath: "postsApi",
    middlewareRegistered: true,
    keepUnusedDataFor: 60,
    invalidationBehavior: "delayed",
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
    cachedQueries: 2,
    cachedMutations: 1,
    subscriberCount: 3,
    ...overrides,
  }
}

describe("ApiHealthStrip", () => {
  it("summarises the api without needing to be expanded", () => {
    render(<ApiHealthStrip classes={classes} health={health()} />)

    const toggle = screen.getByRole("button", { name: /API config/ })
    expect(toggle.getAttribute("aria-expanded")).toBe("false")
    expect(toggle.textContent).toContain("2 queries")
    expect(toggle.textContent).toContain("1 mutations")
    expect(toggle.textContent).toContain("3 subs")
  })

  it("reveals config RTK populates but never surfaces, on demand", () => {
    render(<ApiHealthStrip classes={classes} health={health()} />)

    expect(screen.queryByText("keepUnusedDataFor")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /API config/ }))

    expect(screen.getByText("keepUnusedDataFor")).toBeTruthy()
    expect(screen.getByText("60s")).toBeTruthy()
    expect(screen.getByText("delayed")).toBeTruthy()
  })

  it("stays quiet when the middleware is registered correctly", () => {
    render(<ApiHealthStrip classes={classes} health={health()} />)
    expect(screen.queryByRole("alert")).toBeNull()
  })

  // The one thing that must not be hidden behind the collapse: RTK has
  // detected a genuinely broken setup, and nothing else reports it.
  it("warns about a middleware conflict without needing to be expanded", () => {
    render(
      <ApiHealthStrip
        classes={classes}
        health={health({ middlewareRegistered: "conflict" })}
      />
    )

    const alert = screen.getByRole("alert")
    expect(alert.textContent).toContain("Middleware registered more than once")
    expect(alert.textContent).toContain("postsApi")
    // Still collapsed: the warning is independent of the disclosure.
    expect(
      screen
        .getByRole("button", { name: /API config/ })
        .getAttribute("aria-expanded")
    ).toBe("false")
  })
})
