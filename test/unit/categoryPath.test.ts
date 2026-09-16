import { describe, expect, it } from "vitest";
import { buildPath, prefixRange, depthFromPath, parentPathOf, assertPathLength } from "../../src/domain/categoryPath";

describe("categoryPath", () => {
  it("builds a child path from a parent path and id", () => {
    expect(buildPath(null, 1)).toBe("/1/");
    expect(buildPath("/1/", 5)).toBe("/1/5/");
    expect(buildPath("/1/5/", 9)).toBe("/1/5/9/");
  });

  it("computes depth from path segment count", () => {
    expect(depthFromPath("/1/")).toBe(0);
    expect(depthFromPath("/1/5/")).toBe(1);
    expect(depthFromPath("/1/5/9/")).toBe(2);
  });

  it("recovers the parent path", () => {
    expect(parentPathOf("/1/5/9/")).toBe("/1/5/");
    expect(parentPathOf("/1/5/")).toBe("/1/");
    expect(parentPathOf("/1/")).toBe("/");
  });

  describe("prefixRange — the sibling-exclusion edge case", () => {
    it("includes descendants of /1/5/", () => {
      const { lo, hi } = prefixRange("/1/5/");
      expect("/1/5/" >= lo && "/1/5/" < hi).toBe(true); // itself
      expect("/1/5/9/" >= lo && "/1/5/9/" < hi).toBe(true); // child
      expect("/1/5/9/20/" >= lo && "/1/5/9/20/" < hi).toBe(true); // grandchild
    });

    it("excludes a sibling whose id is a numeric extension (/1/5/ vs /1/50/)", () => {
      const { lo, hi } = prefixRange("/1/5/");
      expect("/1/50/" >= lo && "/1/50/" < hi).toBe(false);
    });

    it("excludes the parent and unrelated top-level categories", () => {
      const { lo, hi } = prefixRange("/1/5/");
      expect("/1/" >= lo && "/1/" < hi).toBe(false);
      expect("/2/" >= lo && "/2/" < hi).toBe(false);
    });

    it("produces a half-open range matching a top-level category's whole subtree", () => {
      const { lo, hi } = prefixRange("/2/");
      expect("/2/" >= lo && "/2/" < hi).toBe(true);
      expect("/2/20/" >= lo && "/2/20/" < hi).toBe(true);
      expect("/20/" >= lo && "/20/" < hi).toBe(false); // unrelated top-level id that starts similarly
    });
  });

  it("asserts path length stays within the CHECK constraint bound", () => {
    expect(() => assertPathLength("/1/2/3/")).not.toThrow();
    expect(() => assertPathLength("/" + "1".repeat(50) + "/")).toThrow();
  });
});
