import { describe, expect, it } from "vitest";
import { encode, decode, MAX_CALLBACK_BYTES } from "../../src/callback/codec";
import type { Callback, EditAction, Purpose, ReviewDecision } from "../../src/callback/types";

const PURPOSES: Purpose[] = ["r", "a", "d", "c", "m", "e"];
const EDIT_ACTIONS: EditAction[] = ["n", "m"];
const REVIEW_DECISIONS: ReviewDecision[] = ["a", "r"];
const IDS = [0, 1, 42, 999999999];
const PAGES = [0, 1, 999];

function allCallbacks(): Callback[] {
  const out: Callback[] = [];
  for (const purpose of PURPOSES) {
    for (const catId of IDS) {
      for (const page of PAGES) {
        out.push({ op: "b", purpose, catId, page });
        out.push({ op: "u", purpose, catId, page });
        out.push({ op: "p", purpose, catId });
        out.push({ op: "s", purpose, token: "a1b2c3d4", page });
      }
    }
  }
  for (const catId of IDS) {
    out.push({ op: "n", catId });
    out.push({ op: "r", catId });
    for (const action of EDIT_ACTIONS) {
      out.push({ op: "e", action, catId });
    }
    for (const decision of REVIEW_DECISIONS) {
      out.push({ op: "v", decision, pendingId: catId });
    }
  }
  out.push({ op: "x" }, { op: "h" }, { op: "z" });
  return out;
}

describe("callback codec", () => {
  it("round-trips every generated callback", () => {
    for (const cb of allCallbacks()) {
      const encoded = encode(cb);
      expect(decode(encoded)).toEqual(cb);
    }
  });

  it("never exceeds the 64-byte callback_data limit", () => {
    for (const cb of allCallbacks()) {
      const bytes = new TextEncoder().encode(encode(cb)).length;
      expect(bytes).toBeLessThanOrEqual(MAX_CALLBACK_BYTES);
    }
  });

  it("throws on encode if a payload would exceed the limit", () => {
    expect(() => encode({ op: "s", purpose: "r", token: "x".repeat(60), page: 0 })).toThrow();
  });

  it("decode never throws on hostile input", () => {
    const hostile = [
      "",
      "not-a-callback",
      "1",
      "1:",
      "1:b",
      "1:b:z:abc:xyz", // bad purpose, non-numeric ids
      "2:n:1", // wrong version
      "1:s:r:has:colon:extra:parts:here",
      "x".repeat(200),
      "1:p:r:-5", // negative id
      "1:n:1.5", // non-integer
    ];
    for (const raw of hostile) {
      expect(() => decode(raw)).not.toThrow();
    }
  });

  it("rejects a decoded token with disallowed characters", () => {
    expect(decode("1:s:r:has space:0")).toBeNull();
    expect(decode("1:s:r:HASCAPS:0")).toBeNull();
  });
});
