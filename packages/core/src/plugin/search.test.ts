import { describe, expect, it } from "vitest";
import { createSearchMatcher } from "./search";

describe("createSearchMatcher (fuzzy)", () => {
  it("matches everything when the query is empty or whitespace", () => {
    expect(createSearchMatcher("").matches("listPosts")).toBe(true);
    expect(createSearchMatcher("   ").matches("listPosts")).toBe(true);
  });

  it("still matches plain substrings, so it is a superset of a substring filter", () => {
    expect(createSearchMatcher("post").matches("addPost")).toBe(true);
    expect(createSearchMatcher("listp").matches("listPostsFlaky")).toBe(true);
  });

  it("matches acronyms, which a substring filter would miss", () => {
    expect(createSearchMatcher("lpf").matches("listPostsFlaky")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(createSearchMatcher("zzz").matches("listPosts")).toBe(false);
  });

  it("passes when any one of several fields matches", () => {
    // Endpoint name misses, serialized args hit.
    expect(createSearchMatcher("3").matches("getPost", "getPost(3)")).toBe(true);
  });

  it("ignores undefined fields rather than throwing", () => {
    expect(createSearchMatcher("post").matches(undefined, "addPost")).toBe(true);
    expect(createSearchMatcher("post").matches(undefined)).toBe(false);
  });
});

describe("createSearchMatcher (regex)", () => {
  it("matches on a compiled pattern, case-insensitively", () => {
    const matcher = createSearchMatcher("^list.*Flaky$", "regex");
    expect(matcher.invalid).toBe(false);
    expect(matcher.matches("listPostsFlaky")).toBe(true);
    expect(matcher.matches("LISTPOSTSFLAKY")).toBe(true);
    expect(matcher.matches("listPosts")).toBe(false);
  });

  it("is stricter than fuzzy: an acronym no longer matches", () => {
    expect(createSearchMatcher("lpf", "regex").matches("listPostsFlaky")).toBe(false);
  });

  // Typing a pattern goes through invalid intermediate states like `(`, and
  // blanking the list mid-keystroke would be worse than showing everything.
  it("flags an uncompilable pattern and matches everything rather than filtering", () => {
    const matcher = createSearchMatcher("(unclosed", "regex");
    expect(matcher.invalid).toBe(true);
    expect(matcher.matches("anything at all")).toBe(true);
  });

  it("treats regex metacharacters literally in fuzzy mode", () => {
    // `(` would be a syntax error as a pattern; fuzzy must not care.
    expect(createSearchMatcher("(").invalid).toBe(false);
  });
});
