import { describe, expect, it } from "vitest";
import { normalizeName, normalizeQuery, clampUtf8Bytes, slugify, likeInfixPattern } from "../../src/domain/normalize";

describe("normalizeName", () => {
  it("lowercases and strips diacritics", () => {
    expect(normalizeName("Café Über")).toBe("cafe uber");
  });

  it("trims whitespace", () => {
    expect(normalizeName("  Physics  ")).toBe("physics");
  });
});

describe("clampUtf8Bytes", () => {
  it("leaves short strings untouched", () => {
    expect(clampUtf8Bytes("hello", 40)).toBe("hello");
  });

  it("truncates without splitting a multi-byte code point", () => {
    const emoji = "🎉"; // 4 bytes in UTF-8
    const input = "ab" + emoji; // 2 + 4 = 6 bytes
    const clamped = clampUtf8Bytes(input, 5); // not enough room for the emoji
    expect(clamped).toBe("ab");
    expect(new TextEncoder().encode(clamped).length).toBeLessThanOrEqual(5);
  });
});

describe("normalizeQuery — LIKE-escaping and the 50-byte D1 cap", () => {
  it("escapes percent, underscore, and backslash", () => {
    const q = normalizeQuery("100%_off\\sale");
    expect(q).toBe("100\\%\\_off\\\\sale");
  });

  it("keeps the wrapped %...% pattern under 50 bytes even in the pathological all-escaped case", () => {
    const worstCase = "%".repeat(40); // every char needs a 2-byte escape
    const escaped = normalizeQuery(worstCase);
    const pattern = likeInfixPattern(escaped);
    expect(new TextEncoder().encode(pattern).length).toBeLessThanOrEqual(50);
  });

  it("clamps long queries without exceeding the byte budget", () => {
    const long = "a".repeat(200);
    const escaped = normalizeQuery(long);
    expect(new TextEncoder().encode(escaped).length).toBeLessThanOrEqual(40);
  });
});

describe("slugify", () => {
  it("produces a url-safe slug", () => {
    expect(slugify("Space & Astronomy")).toBe("space-astronomy");
  });

  it("falls back to a placeholder for an empty/symbol-only name", () => {
    expect(slugify("###")).toBe("category");
  });
});
