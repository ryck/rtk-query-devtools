import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import type { ApiHealth } from "../../selectors"
import { getClasses } from "../theme"
import { ApiHealthPanel } from "./api-health"

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

describe("ApiHealthPanel: single api", () => {
  it("summarises the api without needing to be expanded", () => {
    render(<ApiHealthPanel classes={classes} healths={[health()]} />)

    const toggle = screen.getByRole("button", { name: /postsApi/ })
    expect(toggle.getAttribute("aria-expanded")).toBe("false")
    expect(toggle.textContent).toContain("2 queries")
    expect(toggle.textContent).toContain("1 mutations")
    expect(toggle.textContent).toContain("3 subs")
  })

  it("reveals config RTK populates but never surfaces, on demand", () => {
    render(<ApiHealthPanel classes={classes} healths={[health()]} />)

    expect(screen.queryByText("keepUnusedDataFor")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /postsApi/ }))

    expect(screen.getByText("keepUnusedDataFor")).toBeTruthy()
    expect(screen.getByText("60s")).toBeTruthy()
    expect(screen.getByText("delayed")).toBeTruthy()
  })

  it("stays quiet when the middleware is registered correctly", () => {
    render(<ApiHealthPanel classes={classes} healths={[health()]} />)
    expect(screen.queryByRole("alert")).toBeNull()
  })

  // The one thing that must not be hidden behind the collapse: RTK has
  // detected a genuinely broken setup, and nothing else reports it.
  it("warns about a middleware conflict without needing to be expanded", () => {
    render(
      <ApiHealthPanel
        classes={classes}
        healths={[health({ middlewareRegistered: "conflict" })]}
      />
    )

    const alert = screen.getByRole("alert")
    expect(alert.textContent).toContain("Middleware registered more than once")
    expect(alert.textContent).toContain("postsApi")
    // Still collapsed: the warning is independent of the disclosure.
    expect(
      screen
        .getByRole("button", { name: /postsApi/ })
        .getAttribute("aria-expanded")
    ).toBe("false")
  })

  it("renders nothing for an empty api list", () => {
    const { container } = render(
      <ApiHealthPanel classes={classes} healths={[]} />
    )
    expect(container.firstChild).toBeNull()
  })
})

describe("ApiHealthPanel: multiple apis (All APIs mode)", () => {
  const healths = [health(), health({ reducerPath: "usersApi", cachedQueries: 5 })]

  it("collapses every api under a single top-level disclosure", () => {
    render(<ApiHealthPanel classes={classes} healths={healths} />)

    // One top-level toggle, not one per api.
    const topToggle = screen.getByRole("button", { name: /API config/i })
    expect(topToggle.getAttribute("aria-expanded")).toBe("false")
    expect(topToggle.textContent).toContain("2 apis")

    // Nested rows aren't in the document until the top level opens.
    expect(screen.queryByText("postsApi")).toBeNull()
    expect(screen.queryByText("usersApi")).toBeNull()
  })

  it("reveals one independently-collapsible row per api on expand", () => {
    render(<ApiHealthPanel classes={classes} healths={healths} />)

    fireEvent.click(screen.getByRole("button", { name: /API config/i }))

    const postsToggle = screen.getByRole("button", { name: /postsApi/ })
    const usersToggle = screen.getByRole("button", { name: /usersApi/ })
    expect(postsToggle.getAttribute("aria-expanded")).toBe("false")
    expect(usersToggle.getAttribute("aria-expanded")).toBe("false")

    fireEvent.click(usersToggle)
    expect(usersToggle.getAttribute("aria-expanded")).toBe("true")
    // Expanding one api's row doesn't expand the other.
    expect(postsToggle.getAttribute("aria-expanded")).toBe("false")
    expect(screen.getByText("reducerPath")).toBeTruthy()
  })

  it("surfaces a conflict alert per affected api, regardless of collapse state", () => {
    const withConflict = [
      health({ middlewareRegistered: "conflict" }),
      health({ reducerPath: "usersApi" }),
    ]
    render(<ApiHealthPanel classes={classes} healths={withConflict} />)

    const alert = screen.getByRole("alert")
    expect(alert.textContent).toContain("postsApi")
    // Only one api conflicted, so only one alert.
    expect(screen.getAllByRole("alert")).toHaveLength(1)
    // The top-level disclosure is still collapsed.
    expect(
      screen.getByRole("button", { name: /API config/i }).getAttribute(
        "aria-expanded"
      )
    ).toBe("false")
  })
})
