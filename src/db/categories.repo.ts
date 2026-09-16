import type { Db } from "./client";
import type { Category, Page } from "../domain/types";
import { buildPath, prefixRange, depthFromPath, assertPathLength } from "../domain/categoryPath";
import { normalizeName, slugify, likeInfixPattern, likePrefixPattern } from "../domain/normalize";
import { toPage, offsetFor } from "../domain/pagination";
import { CATEGORY_PAGE_SIZE, GENERAL_CATEGORY_SLUG } from "../env";

interface CategoryRow {
  id: number;
  parent_id: number | null;
  slug: string;
  name: string;
  name_norm: string;
  path: string;
  depth: number;
  child_count: number;
  fact_count: number;
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    parentId: row.parent_id,
    slug: row.slug,
    name: row.name,
    nameNorm: row.name_norm,
    path: row.path,
    depth: row.depth,
    childCount: row.child_count,
    factCount: row.fact_count,
  };
}

const SELECT = `SELECT id, parent_id, slug, name, name_norm, path, depth, child_count, fact_count FROM categories`;

export class CategoriesRepo {
  constructor(private readonly db: Db) {}

  async byId(id: number): Promise<Category | null> {
    const row = await this.db.one<CategoryRow>(`${SELECT} WHERE id = ?1`, id);
    return row ? toCategory(row) : null;
  }

  async bySlug(slug: string): Promise<Category | null> {
    const row = await this.db.one<CategoryRow>(`${SELECT} WHERE slug = ?1`, slug);
    return row ? toCategory(row) : null;
  }

  async general(): Promise<Category> {
    const row = await this.bySlug(GENERAL_CATEGORY_SLUG);
    if (!row) throw new Error("general category missing — did migrations run?");
    return row;
  }

  /** Renames a category's display name only. `slug` is left untouched —
   * it's the stable identifier /import matches on, so it shouldn't shift
   * just because a display label changed. */
  async rename(id: number, name: string): Promise<Category> {
    await this.db.run(
      `UPDATE categories SET name = ?1, name_norm = ?2 WHERE id = ?3`,
      name,
      normalizeName(name),
      id,
    );
    const updated = await this.byId(id);
    if (!updated) throw new Error(`category ${id} not found`);
    return updated;
  }

  /** Top-level categories (no parent), alphabetical, paginated. */
  async topLevel(page: number, pageSize = CATEGORY_PAGE_SIZE): Promise<Page<Category>> {
    const rows = await this.db.many<CategoryRow>(
      `${SELECT} WHERE parent_id IS NULL ORDER BY name_norm, id LIMIT ?1 OFFSET ?2`,
      pageSize + 1,
      offsetFor(page, pageSize),
    );
    return toPage(rows.map(toCategory), page, pageSize);
  }

  /** Direct children of a category, alphabetical, paginated. */
  async children(parentId: number, page: number, pageSize = CATEGORY_PAGE_SIZE): Promise<Page<Category>> {
    const rows = await this.db.many<CategoryRow>(
      `${SELECT} WHERE parent_id = ?1 ORDER BY name_norm, id LIMIT ?2 OFFSET ?3`,
      parentId,
      pageSize + 1,
      offsetFor(page, pageSize),
    );
    return toPage(rows.map(toCategory), page, pageSize);
  }

  /** Category search: normalized-prefix matches rank above infix matches. */
  async search(escapedQuery: string, page: number, pageSize = CATEGORY_PAGE_SIZE): Promise<Page<Category>> {
    const rows = await this.db.many<CategoryRow>(
      `SELECT id, parent_id, slug, name, name_norm, path, depth, child_count, fact_count,
              CASE WHEN name_norm LIKE ?1 ESCAPE '\\' THEN 0 ELSE 1 END AS rank
         FROM categories
        WHERE name_norm LIKE ?2 ESCAPE '\\'
        ORDER BY rank, name_norm, id
        LIMIT ?3 OFFSET ?4`,
      likePrefixPattern(escapedQuery),
      likeInfixPattern(escapedQuery),
      pageSize + 1,
      offsetFor(page, pageSize),
    );
    return toPage(rows.map(toCategory), page, pageSize);
  }

  async count(): Promise<number> {
    const row = await this.db.one<{ n: number }>(`SELECT COUNT(*) AS n FROM categories`);
    return row?.n ?? 0;
  }

  subtreeRange(category: Category): { lo: string; hi: string } {
    return prefixRange(category.path);
  }

  /** Creates a category under `parentId` (null = top level). Bumps the
   * parent's `child_count` in the same batch so it never drifts. */
  async create(parentId: number | null, name: string): Promise<Category> {
    const parent = parentId === null ? null : await this.byId(parentId);
    if (parentId !== null && !parent) throw new Error(`parent category ${parentId} not found`);

    const nameNorm = normalizeName(name);
    let slug = slugify(name);
    // avoid unique-constraint collisions on generic names
    if (await this.bySlug(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const insert = await this.db.run(
      `INSERT INTO categories (parent_id, slug, name, name_norm, path, depth) VALUES (?1, ?2, ?3, ?4, '/', 0)`,
      parentId,
      slug,
      name,
      nameNorm,
    );
    const newId = insert.meta.last_row_id;
    const path = buildPath(parent?.path ?? null, newId);
    assertPathLength(path);
    const depth = depthFromPath(path);

    const statements = [this.db.statement(`UPDATE categories SET path = ?1, depth = ?2 WHERE id = ?3`, path, depth, newId)];
    if (parentId !== null) {
      statements.push(
        this.db.statement(`UPDATE categories SET child_count = child_count + 1 WHERE id = ?1`, parentId),
      );
    }
    await this.db.batch(statements);

    const created = await this.byId(newId);
    if (!created) throw new Error("category disappeared immediately after insert");
    return created;
  }

  /** Moves `category` under `newParentId` (null = top level), rewriting its
   * whole subtree's `path`/`depth` in one range UPDATE — no recursion. */
  async reparent(category: Category, newParentId: number | null): Promise<void> {
    if (newParentId === category.id) throw new Error("category cannot be its own parent");
    const newParent = newParentId === null ? null : await this.byId(newParentId);
    if (newParentId !== null && !newParent) throw new Error(`parent category ${newParentId} not found`);
    if (newParent && newParent.path >= category.path && newParent.path < prefixRange(category.path).hi) {
      throw new Error("cannot move a category into its own subtree");
    }

    const { lo, hi } = prefixRange(category.path);
    const newPrefix = buildPath(newParent?.path ?? null, category.id);
    // Deepest-descendant path length is enforced by the table's CHECK
    // constraint; D1 batches are transactional, so an over-length result
    // aborts the whole move rather than corrupting part of the tree.
    const delta = depthFromPath(newPrefix) - category.depth;
    const oldParentId = category.parentId;

    const statements = [
      this.db.statement(
        `UPDATE categories
            SET path = ?1 || substr(path, ?2 + 1),
                depth = depth + ?3
          WHERE path >= ?4 AND path < ?5`,
        newPrefix,
        category.path.length,
        delta,
        lo,
        hi,
      ),
      this.db.statement(`UPDATE categories SET parent_id = ?1 WHERE id = ?2`, newParentId, category.id),
    ];
    if (oldParentId !== null) {
      statements.push(
        this.db.statement(`UPDATE categories SET child_count = child_count - 1 WHERE id = ?1`, oldParentId),
      );
    }
    if (newParentId !== null) {
      statements.push(
        this.db.statement(`UPDATE categories SET child_count = child_count + 1 WHERE id = ?1`, newParentId),
      );
    }
    await this.db.batch(statements);
  }
}
