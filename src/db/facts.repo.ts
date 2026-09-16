import type { Db } from "./client";
import type { Fact } from "../domain/types";
import { bodyHash } from "../domain/hash";

interface FactRow {
  id: number;
  category_id: number;
  body: string;
  source: string | null;
  category_name?: string;
}

function toFact(row: FactRow): Fact {
  return {
    id: row.id,
    categoryId: row.category_id,
    body: row.body,
    source: row.source,
    categoryName: row.category_name,
  };
}

export type NextFactResult = { fact: Fact; exhausted: boolean } | null;

export class FactsRepo {
  constructor(private readonly db: Db) {}

  /** Next fact in the given path range (a category's subtree, or the
   * whole-tree range for "surprise me") the user hasn't seen. If every fact
   * has been seen, falls back to the least-recently-seen one instead of
   * dead-ending the feed, flagged via `exhausted`. Null only when the
   * range has no published facts at all. */
  async nextForUser(subtree: { lo: string; hi: string }, userId: number): Promise<NextFactResult> {
    const unseen = await this.db.one<FactRow>(
      `SELECT f.id, f.category_id, f.body, f.source, c.name AS category_name
         FROM facts f
         JOIN categories c ON c.id = f.category_id
         LEFT JOIN seen_facts s ON s.fact_id = f.id AND s.user_id = ?1
        WHERE c.path >= ?2 AND c.path < ?3
          AND f.status = 'published'
          AND s.fact_id IS NULL
        ORDER BY RANDOM()
        LIMIT 1`,
      userId,
      subtree.lo,
      subtree.hi,
    );
    if (unseen) return { fact: toFact(unseen), exhausted: false };

    const recycled = await this.db.one<FactRow>(
      `SELECT f.id, f.category_id, f.body, f.source, c.name AS category_name
         FROM facts f
         JOIN categories c ON c.id = f.category_id
         JOIN seen_facts s ON s.fact_id = f.id AND s.user_id = ?1
        WHERE c.path >= ?2 AND c.path < ?3
          AND f.status = 'published'
        ORDER BY s.seen_at ASC, s.rowid ASC
        LIMIT 1`,
      userId,
      subtree.lo,
      subtree.hi,
    );
    return recycled ? { fact: toFact(recycled), exhausted: true } : null;
  }

  async byId(id: number): Promise<Fact | null> {
    const row = await this.db.one<FactRow>(
      `SELECT f.id, f.category_id, f.body, f.source, c.name AS category_name
         FROM facts f JOIN categories c ON c.id = f.category_id
        WHERE f.id = ?1`,
      id,
    );
    return row ? toFact(row) : null;
  }

  /** Inserts a fact, deduping on the normalized body hash. Returns the
   * existing fact (with `duplicate: true`) instead of erroring on a repeat. */
  async create(categoryId: number, body: string, source: string | null, createdBy: number): Promise<{ fact: Fact; duplicate: boolean }> {
    const hash = await bodyHash(body);
    const existing = await this.db.one<FactRow>(
      `SELECT f.id, f.category_id, f.body, f.source FROM facts f WHERE f.body_hash = ?1`,
      hash,
    );
    if (existing) return { fact: toFact(existing), duplicate: true };

    const rnd = Math.random();
    const insert = await this.db.run(
      `INSERT INTO facts (category_id, body, source, rnd, body_hash, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
      categoryId,
      body,
      source,
      rnd,
      hash,
      createdBy,
    );
    await this.db.run(`UPDATE categories SET fact_count = fact_count + 1 WHERE id = ?1`, categoryId);
    const created = await this.byId(insert.meta.last_row_id);
    if (!created) throw new Error("fact disappeared immediately after insert");
    return { fact: created, duplicate: false };
  }

  async hide(id: number): Promise<void> {
    await this.db.run(`UPDATE facts SET status = 'hidden' WHERE id = ?1`, id);
  }

  /** Bulk import for /import and scripts/import-jsonl.ts. Uses `INSERT OR
   * IGNORE` against the body_hash unique index so repeats across batches
   * are silently skipped rather than erroring the whole chunk. Chunked to
   * keep each db.batch() call small; D1 caps bound params per *statement*
   * (100), not per batch, but small chunks also bound how much one failed
   * batch (it's transactional — all-or-nothing) can lose. */
  async bulkInsert(
    rows: { categoryId: number; body: string; source: string | null }[],
    createdBy: number,
    chunkSize = 25,
  ): Promise<{ inserted: number; skipped: number }> {
    let inserted = 0;
    let skipped = 0;
    const touchedCategories = new Set<number>();

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const statements = await Promise.all(
        chunk.map(async (r) => {
          const hash = await bodyHash(r.body);
          return this.db.statement(
            `INSERT OR IGNORE INTO facts (category_id, body, source, rnd, body_hash, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
            r.categoryId,
            r.body,
            r.source,
            Math.random(),
            hash,
            createdBy,
          );
        }),
      );
      const results = await this.db.batch(statements);
      for (let j = 0; j < results.length; j++) {
        const changed = results[j]?.meta.changes ?? 0;
        if (changed > 0) {
          inserted++;
          touchedCategories.add(chunk[j]!.categoryId);
        } else {
          skipped++;
        }
      }
    }

    for (const categoryId of touchedCategories) {
      await this.db.run(
        `UPDATE categories SET fact_count = (SELECT COUNT(*) FROM facts WHERE category_id = ?1 AND status = 'published') WHERE id = ?1`,
        categoryId,
      );
    }
    return { inserted, skipped };
  }

  async countPublished(): Promise<number> {
    const row = await this.db.one<{ n: number }>(`SELECT COUNT(*) AS n FROM facts WHERE status = 'published'`);
    return row?.n ?? 0;
  }
}
