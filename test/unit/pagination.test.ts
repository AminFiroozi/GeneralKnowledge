import { describe, expect, it } from "vitest";
import { toPage, clampPage, offsetFor } from "../../src/domain/pagination";

describe("pagination", () => {
  it("reports no next/prev on an empty page", () => {
    const page = toPage([], 0, 8);
    expect(page).toEqual({ items: [], page: 0, hasNext: false, hasPrev: false });
  });

  it("has no next page on an exact page-size multiple with no sentinel row", () => {
    const items = Array.from({ length: 8 }, (_, i) => i);
    const page = toPage(items, 0, 8); // exactly pageSize rows, no +1 sentinel fetched
    expect(page.items).toHaveLength(8);
    expect(page.hasNext).toBe(false);
  });

  it("detects a next page via the sentinel row and trims it", () => {
    const items = Array.from({ length: 9 }, (_, i) => i); // pageSize(8) + 1 sentinel
    const page = toPage(items, 0, 8);
    expect(page.items).toHaveLength(8);
    expect(page.hasNext).toBe(true);
  });

  it("hasPrev is true on any page after the first", () => {
    expect(toPage([], 0, 8).hasPrev).toBe(false);
    expect(toPage([], 1, 8).hasPrev).toBe(true);
    expect(toPage([], 5, 8).hasPrev).toBe(true);
  });

  it("clamps invalid page numbers to 0", () => {
    expect(clampPage(-1)).toBe(0);
    expect(clampPage(1.5)).toBe(0);
    expect(clampPage(NaN)).toBe(0);
    expect(clampPage(3)).toBe(3);
  });

  it("computes offsets from a clamped page", () => {
    expect(offsetFor(0, 8)).toBe(0);
    expect(offsetFor(2, 8)).toBe(16);
    expect(offsetFor(-1, 8)).toBe(0);
  });
});
