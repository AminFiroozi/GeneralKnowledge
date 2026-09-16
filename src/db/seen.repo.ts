import type { Db } from "./client";

export class SeenRepo {
  constructor(private readonly db: Db) {}

  async markSeen(userId: number, factId: number): Promise<void> {
    await this.db.batch([
      this.db.statement(
        `INSERT INTO seen_facts (user_id, fact_id) VALUES (?1, ?2)
         ON CONFLICT(user_id, fact_id) DO UPDATE SET seen_at = unixepoch()`,
        userId,
        factId,
      ),
      this.db.statement(
        `UPDATE users SET seen_count = seen_count + 1, last_seen_at = unixepoch() WHERE id = ?1`,
        userId,
      ),
    ]);
  }

  async countForUser(userId: number): Promise<number> {
    const row = await this.db.one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM seen_facts WHERE user_id = ?1`,
      userId,
    );
    return row?.n ?? 0;
  }

  async clearForUser(userId: number): Promise<void> {
    await this.db.run(`DELETE FROM seen_facts WHERE user_id = ?1`, userId);
  }

  async totalCount(): Promise<number> {
    const row = await this.db.one<{ n: number }>(`SELECT COUNT(*) AS n FROM seen_facts`);
    return row?.n ?? 0;
  }
}
