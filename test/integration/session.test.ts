import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/db/client";
import { StateRepo } from "../../src/db/state.repo";
import { TokensRepo } from "../../src/db/tokens.repo";

describe("state repo (grammY session storage)", () => {
  it("round-trips read/write/delete", async () => {
    const db = new Db(env.DB);
    const state = new StateRepo(db);
    const userId = 999_200_001;

    expect(await state.read(userId)).toBeUndefined();

    await state.write(userId, JSON.stringify({ flow: { kind: "addfact", step: "await_text" } }));
    expect(JSON.parse((await state.read(userId))!)).toEqual({ flow: { kind: "addfact", step: "await_text" } });

    await state.delete(userId);
    expect(await state.read(userId)).toBeUndefined();
  });

  it("survives a two-step flow across separate repo instances (simulated separate Worker invocations)", async () => {
    const userId = 999_200_002;

    // "Invocation 1": /addfact captures text, writes state, the request ends.
    const state1 = new StateRepo(new Db(env.DB));
    await state1.write(userId, JSON.stringify({ flow: { kind: "addfact", step: "await_category", text: "hi", source: null } }));

    // "Invocation 2": a brand new Db/StateRepo, as a fresh Worker request would construct.
    const state2 = new StateRepo(new Db(env.DB));
    const data = JSON.parse((await state2.read(userId))!);
    expect(data.flow).toEqual({ kind: "addfact", step: "await_category", text: "hi", source: null });
  });
});

describe("callback tokens", () => {
  it("mints, resolves, and garbage-collects expired tokens", async () => {
    const db = new Db(env.DB);
    const tokens = new TokensRepo(db);
    const userId = 999_200_003;

    const token = await tokens.mint(userId, "search", "physics");
    const resolved = await tokens.resolve(token);
    expect(resolved).toEqual({ userId, kind: "search", payload: "physics" });

    expect(await tokens.resolve("doesnotexist")).toBeNull();

    await db.run(`UPDATE callback_tokens SET created_at = unixepoch() - 999999 WHERE token = ?1`, token);
    const removed = await tokens.gcExpired();
    expect(removed).toBeGreaterThanOrEqual(1);
    expect(await tokens.resolve(token)).toBeNull();
  });
});
