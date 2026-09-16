import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/db/client";
import { CategoriesRepo } from "../../src/db/categories.repo";
import { FactsRepo } from "../../src/db/facts.repo";

describe("subtree queries via materialized path", () => {
  it("serves a grandchild's fact when reading the grandparent, but not a sibling's", async () => {
    const db = new Db(env.DB);
    const categories = new CategoriesRepo(db);
    const facts = new FactsRepo(db);

    const grandparent = await categories.create(null, "Test Root " + Math.random());
    const parent = await categories.create(grandparent.id, "Test Child");
    const child = await categories.create(parent.id, "Test Grandchild");
    const sibling = await categories.create(grandparent.id, "Test Sibling");

    const { fact: deepFact } = await facts.create(child.id, "A fact deep in the tree, unique enough.", null, 1);
    await facts.create(sibling.id, "A fact on a sibling branch, also unique.", null, 1);

    const range = categories.subtreeRange(await categories.byId(grandparent.id).then((c) => c!));
    const seenIds = new Set<number>();
    for (let i = 0; i < 20; i++) {
      const result = await facts.nextForUser(range, 999_000_001);
      if (!result) break;
      seenIds.add(result.fact.id);
      if (result.exhausted) break;
    }
    expect(seenIds.has(deepFact.id)).toBe(true);

    const siblingRange = categories.subtreeRange(sibling);
    const fromSibling = await facts.nextForUser(siblingRange, 999_000_002);
    expect(fromSibling?.fact.categoryId).toBe(sibling.id);
    expect(fromSibling?.fact.id).not.toBe(deepFact.id);
  });

  it("re-parenting rewrites every descendant's path and depth", async () => {
    const db = new Db(env.DB);
    const categories = new CategoriesRepo(db);

    const rootA = await categories.create(null, "Root A " + Math.random());
    const rootB = await categories.create(null, "Root B " + Math.random());
    const mover = await categories.create(rootA.id, "Mover");
    const child = await categories.create(mover.id, "Mover Child");

    await categories.reparent(await categories.byId(mover.id).then((c) => c!), rootB.id);

    const movedMover = await categories.byId(mover.id);
    const movedChild = await categories.byId(child.id);
    expect(movedMover!.parentId).toBe(rootB.id);
    expect(movedMover!.path.startsWith(rootB.path)).toBe(true);
    expect(movedChild!.path.startsWith(movedMover!.path)).toBe(true);
    expect(movedChild!.depth).toBe(movedMover!.depth + 1);

    // subtree query from the new root now finds the moved branch
    const range = categories.subtreeRange(await categories.byId(rootB.id).then((c) => c!));
    expect(movedMover!.path >= range.lo && movedMover!.path < range.hi).toBe(true);
  });

  it("refuses to move a category into its own subtree", async () => {
    const db = new Db(env.DB);
    const categories = new CategoriesRepo(db);
    const root = await categories.create(null, "Cycle Root " + Math.random());
    const child = await categories.create(root.id, "Cycle Child");

    await expect(categories.reparent(root, child.id)).rejects.toThrow();
  });
});
