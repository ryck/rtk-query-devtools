import { describe, expect, it } from "vitest";
import { matchesSearch } from "./search";

describe("matchesSearch", () => {
  it("matches everything when the query is empty or whitespace", () => {
    expect(matchesSearch("", "listPosts")).toBe(true);
    expect(matchesSearch("   ", "listPosts")).toBe(true);
  });

  it("still matches plain substrings, so it is a superset of the old filter", () => {
    expect(matchesSearch("post", "addPost")).toBe(true);
    expect(matchesSearch("listp", "listPostsFlaky")).toBe(true);
  });

  it("matches acronyms, which a substring filter would miss", () => {
    expect(matchesSearch("lpf", "listPostsFlaky")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matchesSearch("zzz", "listPosts")).toBe(false);
  });

  it("passes when any one of several fields matches", () => {
    // Endpoint name misses, serialized args hit.
    expect(matchesSearch("3", "getPost", "getPost(3)")).toBe(true);
  });

  it("ignores undefined fields rather than throwing", () => {
    expect(matchesSearch("post", undefined, "addPost")).toBe(true);
    expect(matchesSearch("post", undefined)).toBe(false);
  });
});
