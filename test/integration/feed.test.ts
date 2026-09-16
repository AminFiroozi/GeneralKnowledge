import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/db/client";
import { CategoriesRepo } from "../../src/db/categories.repo";
import { FactsRepo } from "../../src/db/facts.repo";
import { SeenRepo } from "../../src/db/seen.repo";

describe("unseen-fact selection and exhaustion", () => {
  it("returns each of N facts exactly once, then recycles least-recently-seen", async () => {
    const db = new Db(env.DB);
    const categories = new CategoriesRepo(db);
    const facts = new FactsRepo(db);
    const seen = new SeenRepo(db);
    const userId = 999_100_001;

    const category = await categories.create(null, "Feed Test " + Math.random());
    const range = categories.subtreeRange(category);
    const N = 5;
    const factIds: number[] = [];
    for (let i = 0; i < N; i++) {
      const { fact } = await facts.create(category.id, `Unique feed test fact number ${i} ${Math.random()}`, null, 1);
      factIds.push(fact.id);
    }

    const picked: number[] = [];
    for (let i = 0; i < N; i++) {
      const result = await facts.nextForUser(range, userId);
      expect(result).not.toBeNull();
      expect(result!.exhausted).toBe(false);
      picked.push(result!.fact.id);
      await seen.markSeen(userId, result!.fact.id);
    }
    expect(new Set(picked)).toEqual(new Set(factIds));
    expect(picked).toHaveLength(N);

    // N+1th call: everything seen, falls back to least-recently-seen (the first one picked)
    const recycled = await facts.nextForUser(range, userId);
    expect(recycled).not.toBeNull();
    expect(recycled!.exhausted).toBe(true);
    expect(recycled!.fact.id).toBe(picked[0]);
  });

  it("returns null for a subtree with no published facts", async () => {
    const db = new Db(env.DB);
    const categories = new CategoriesRepo(db);
    const facts = new FactsRepo(db);
    const empty = await categories.create(null, "Empty Category " + Math.random());
    const result = await facts.nextForUser(categories.subtreeRange(empty), 999_100_002);
    expect(result).toBeNull();
  });
});
