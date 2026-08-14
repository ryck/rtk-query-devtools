import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { enumCodec, setCodec, sortOrderCodec, usePersistentState } from "./use-persistent-state";

const PREFIX = "rtkq-devtools:";

afterEach(() => {
  // Unstub *first* — one test replaces `localStorage` with a throwing stub,
  // and clearing before restoring would throw and leak that stub into the
  // rest of the file.
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("usePersistentState", () => {
  it("starts from the initial value and writes it through to storage", () => {
    const { result } = renderHook(() => usePersistentState("demo.sort", "updated"));

    expect(result.current[0]).toBe("updated");

    act(() => result.current[1]("endpoint"));

    expect(result.current[0]).toBe("endpoint");
    expect(window.localStorage.getItem(`${PREFIX}demo.sort`)).toBe(JSON.stringify("endpoint"));
  });

  it("restores a previously stored value on mount", () => {
    window.localStorage.setItem(`${PREFIX}demo.search`, JSON.stringify("flaky"));

    const { result } = renderHook(() => usePersistentState("demo.search", ""));

    expect(result.current[0]).toBe("flaky");
  });

  it("namespaces keys so it cannot collide with the host app or the devtools shell", () => {
    renderHook(() => usePersistentState("activeTab", "queries"));

    expect(window.localStorage.getItem("activeTab")).toBeNull();
    expect(window.localStorage.getItem(`${PREFIX}activeTab`)).toBe(JSON.stringify("queries"));
  });

  it("falls back to the initial value when the stored JSON is corrupt", () => {
    window.localStorage.setItem(`${PREFIX}demo.sort`, "{not json");

    const { result } = renderHook(() => usePersistentState("demo.sort", "updated"));

    expect(result.current[0]).toBe("updated");
  });

  it("keeps working when storage itself throws, since persistence is best-effort", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });

    const { result } = renderHook(() => usePersistentState("demo.sort", "updated"));

    expect(result.current[0]).toBe("updated");
    expect(() => act(() => result.current[1]("status"))).not.toThrow();
    expect(result.current[0]).toBe("status");
  });

  it("round-trips a Set through setCodec", () => {
    const codec = setCodec(["fresh", "error"] as const);
    const { result, unmount } = renderHook(() =>
      usePersistentState("demo.statuses", new Set<"fresh" | "error">(), codec),
    );

    act(() => result.current[1](new Set(["error"])));
    unmount();

    const restored = renderHook(() =>
      usePersistentState("demo.statuses", new Set<"fresh" | "error">(), codec),
    );
    expect(Array.from(restored.result.current[0])).toEqual(["error"]);
  });
});

describe("codecs", () => {
  it("setCodec drops values a previous build may have written", () => {
    const codec = setCodec(["fresh", "error"] as const);
    expect(Array.from(codec.parse(["fresh", "stale", 7]) ?? [])).toEqual(["fresh"]);
  });

  it("setCodec rejects a non-array payload", () => {
    expect(setCodec().parse("fresh")).toBeUndefined();
  });

  it("enumCodec rejects values outside the allowed set", () => {
    const codec = enumCodec(["updated", "status"] as const);
    expect(codec.parse("status")).toBe("status");
    expect(codec.parse("endpoint")).toBeUndefined();
    expect(codec.parse(3)).toBeUndefined();
  });

  it("sortOrderCodec only accepts 1 and -1", () => {
    expect(sortOrderCodec.parse(1)).toBe(1);
    expect(sortOrderCodec.parse(-1)).toBe(-1);
    expect(sortOrderCodec.parse(0)).toBeUndefined();
    expect(sortOrderCodec.parse("1")).toBeUndefined();
  });
});
