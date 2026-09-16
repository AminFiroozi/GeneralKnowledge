import type { Db } from "./client";

/** Backs grammY's session() middleware with a D1 row per user. KV was
 * rejected here: its writes can take up to 60s to propagate and reads are
 * not guaranteed to see your own writes, which would break a multi-step
 * admin flow like /addfact within a single conversation. */
export class StateRepo {
  constructor(private readonly db: Db) {}

  async read(userId: number): Promise<string | undefined> {
    const row = await this.db.one<{ data: string }>(
      `SELECT data FROM user_state WHERE user_id = ?1`,
      userId,
    );
    return row?.data;
  }

  async write(userId: number, data: string): Promise<void> {
    await this.db.run(
      `INSERT INTO user_state (user_id, data, updated_at) VALUES (?1, ?2, unixepoch())
       ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
      userId,
      data,
    );
  }

  async delete(userId: number): Promise<void> {
    await this.db.run(`DELETE FROM user_state WHERE user_id = ?1`, userId);
  }
}
