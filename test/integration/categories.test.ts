import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/db/client";
import { CategoriesRepo } from "../../src/db/categories.repo";
import { normalizeQuery } from "../../src/domain/normalize";

describe("category search pagination", () => {
  it("concatenated pages contain each match exactly once, no duplicates or gaps", async () => {
    const db = new Db(env.DB);
    const categories = new CategoriesRepo(db);
    const marker = "zzzsearchmarker" + Math.floor(Math.random() * 1e6);

    const created = [];
    for (let i = 0; i < 13; i++) {
      created.push(await categories.create(null, `${marker} ${i}`));
    }

    const query = normalizeQuery(marker);
    const pageSize = 5;
    const seen: number[] = [];
    let page = 0;
    for (;;) {
      const result = await categories.search(query, page, pageSize);
      seen.push(...result.items.map((c) => c.id));
      if (!result.hasNext) break;
      page++;
      if (page > 10) throw new Error("pagination did not terminate");
    }

    expect(seen).toHaveLength(created.length);
    expect(new Set(seen).size).toBe(created.length);
    expect(new Set(seen)).toEqual(new Set(created.map((c) => c.id)));
  });

  it("ranks a prefix match above an infix-only match", async () => {
    const db = new Db(env.DB);
    const categories = new CategoriesRepo(db);
    const marker = "rankmarker" + Math.floor(Math.random() * 1e6);

    const infixOnly = await categories.create(null, `Something ${marker} Else`);
    const prefixMatch = await categories.create(null, `${marker} Prime`);

    const result = await categories.search(normalizeQuery(marker), 0, 10);
    const ids = result.items.map((c) => c.id);
    expect(ids.indexOf(prefixMatch.id)).toBeLessThan(ids.indexOf(infixOnly.id));
  });
});

describe("category creation", () => {
  it("de-duplicates slugs for same-named categories", async () => {
    const db = new Db(env.DB);
    const categories = new CategoriesRepo(db);
    const name = "Duplicate Name " + Math.random();
    const a = await categories.create(null, name);
    const b = await categories.create(null, name);
    expect(a.slug).not.toBe(b.slug);
  });

  it("sets path/depth and bumps the parent's child_count", async () => {
    const db = new Db(env.DB);
    const categories = new CategoriesRepo(db);
    const parent = await categories.create(null, "Child Count Parent " + Math.random());
    const before = (await categories.byId(parent.id))!.childCount;
    const child = await categories.create(parent.id, "Child Count Child");
    const after = (await categories.byId(parent.id))!.childCount;

    expect(after).toBe(before + 1);
    expect(child.path).toBe(`${parent.path}${child.id}/`);
    expect(child.depth).toBe(parent.depth + 1);
  });

  it("rename updates name/name_norm but leaves slug, path, and parent untouched", async () => {
    const db = new Db(env.DB);
    const categories = new CategoriesRepo(db);
    const original = await categories.create(null, "Old Name " + Math.random());

    const renamed = await categories.rename(original.id, "Brand New Name");

    expect(renamed.name).toBe("Brand New Name");
    expect(renamed.nameNorm).toBe("brand new name");
    expect(renamed.slug).toBe(original.slug);
    expect(renamed.path).toBe(original.path);
    expect(renamed.parentId).toBe(original.parentId);
  });
});
