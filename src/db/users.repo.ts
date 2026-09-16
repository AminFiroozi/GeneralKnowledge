import type { Db } from "./client";

interface UserRow {
  id: number;
  default_category_id: number | null;
  seen_count: number;
}

export class UsersRepo {
  constructor(private readonly db: Db) {}

  /** Registers a user on first contact; a no-op write on every later one. */
  async ensure(userId: number, defaultCategoryId: number): Promise<void> {
    await this.db.run(
      `INSERT INTO users (id, default_category_id) VALUES (?1, ?2)
       ON CONFLICT(id) DO UPDATE SET last_seen_at = unixepoch()`,
      userId,
      defaultCategoryId,
    );
  }

  async get(userId: number): Promise<UserRow | null> {
    return this.db.one<UserRow>(
      `SELECT id, default_category_id, seen_count FROM users WHERE id = ?1`,
      userId,
    );
  }

  async setDefaultCategory(userId: number, categoryId: number): Promise<void> {
    await this.db.run(`UPDATE users SET default_category_id = ?1 WHERE id = ?2`, categoryId, userId);
  }

  async count(): Promise<number> {
    const row = await this.db.one<{ n: number }>(`SELECT COUNT(*) AS n FROM users`);
    return row?.n ?? 0;
  }
}
