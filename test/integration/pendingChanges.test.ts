import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/db/client";
import { PendingChangesRepo } from "../../src/db/pendingChanges.repo";

describe("pending changes (admin approval queue)", () => {
  it("creates, resolves, and lists a pending row", async () => {
    const db = new Db(env.DB);
    const pending = new PendingChangesRepo(db);
    const userId = 999_300_001;

    const created = await pending.create("add_fact", JSON.stringify({ text: "hi" }), userId);
    expect(created.status).toBe("pending");
    expect(created.submittedBy).toBe(userId);

    const listed = await pending.listPending(100);
    expect(listed.map((p) => p.id)).toContain(created.id);

    await pending.setAdminMessage(created.id, -100123, 55);
    const withMsg = await pending.get(created.id);
    expect(withMsg?.adminChatId).toBe(-100123);
    expect(withMsg?.adminMsgId).toBe(55);

    const decided = await pending.decide(created.id, "approved", 999_300_002);
    expect(decided).toBe(true);

    const after = await pending.get(created.id);
    expect(after?.status).toBe("approved");
    expect(after?.reviewedBy).toBe(999_300_002);
  });

  it("only the first decide() on a row wins (double-tap / race guard)", async () => {
    const db = new Db(env.DB);
    const pending = new PendingChangesRepo(db);
    const created = await pending.create("add_category", JSON.stringify({ name: "x" }), 999_300_003);

    const first = await pending.decide(created.id, "approved", 1);
    const second = await pending.decide(created.id, "rejected", 2);

    expect(first).toBe(true);
    expect(second).toBe(false);

    const final = await pending.get(created.id);
    expect(final?.status).toBe("approved");
    expect(final?.reviewedBy).toBe(1);
  });

  it("listPending only returns rows still pending", async () => {
    const db = new Db(env.DB);
    const pending = new PendingChangesRepo(db);
    const stillPending = await pending.create("add_fact", "{}", 999_300_004);
    const resolved = await pending.create("add_fact", "{}", 999_300_004);
    await pending.decide(resolved.id, "rejected", 1);

    const listed = await pending.listPending(1000);
    const ids = listed.map((p) => p.id);
    expect(ids).toContain(stillPending.id);
    expect(ids).not.toContain(resolved.id);
  });
});
