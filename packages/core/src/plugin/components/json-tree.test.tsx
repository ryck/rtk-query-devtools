import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getClasses } from "../theme";
import { JsonTree } from "./json-tree";

afterEach(cleanup);

const classes = getClasses("dark");

describe("JsonTree", () => {
  it("renders nested primitive values without crashing", () => {
    render(
      <JsonTree data={{ a: 1, b: "two", c: true, d: null, e: undefined }} classes={classes} />,
    );
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText('"two"')).toBeTruthy();
    expect(screen.getByText("true")).toBeTruthy();
    expect(screen.getByText("null")).toBeTruthy();
    expect(screen.getByText("undefined")).toBeTruthy();
  });

  it("renders [Circular] instead of recursing forever on a self-referential object", () => {
    const obj: Record<string, unknown> = { name: "self" };
    obj.self = obj;

    // The root renders expanded by default, and the circularity check runs
    // before deciding whether a child needs its own expand/collapse toggle
    // — so a direct one-level cycle like this is visible immediately, no
    // click needed.
    render(<JsonTree data={obj} classes={classes} />);

    expect(screen.getByText("[Circular]")).toBeTruthy();
  });

  it("renders a BigInt as an n-suffixed token", () => {
    render(<JsonTree data={{ big: 9_007_199_254_740_993n }} classes={classes} />);
    expect(screen.getByText("9007199254740993n")).toBeTruthy();
  });

  it("renders Map and Set with a type label and size, without recursing eagerly", () => {
    const map = new Map([["a", 1]]);
    const set = new Set([1, 2]);

    render(<JsonTree data={{ map, set }} classes={classes} />);

    expect(screen.getByText("Map(1)")).toBeTruthy();
    expect(screen.getByText("Set(2)")).toBeTruthy();
  });

  it("collapses nodes past the default expand depth, and expands them on click", () => {
    render(<JsonTree data={{ level1: { level2: { value: "deep" } } }} classes={classes} />);

    expect(screen.queryByText('"deep"')).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /level1/ }));
    fireEvent.click(screen.getByRole("button", { name: /level2/ }));

    expect(screen.getByText('"deep"')).toBeTruthy();
  });
});
