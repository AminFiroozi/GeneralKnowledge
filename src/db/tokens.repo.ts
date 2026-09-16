import type { Db } from "./client";
import { CALLBACK_TOKEN_LENGTH, CALLBACK_TOKEN_TTL_SECONDS } from "../env";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

function randomToken(length: number): string {
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/** Short-lived storage for payloads too big for callback_data (64 bytes) —
 * currently just search queries. Tokens outlive the session that minted
 * them so a stale keyboard keeps paginating its own query instead of
 * silently reusing whatever the user searched for most recently. */
export class TokensRepo {
  constructor(private readonly db: Db) {}

  async mint(userId: number, kind: string, payload: string): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const token = randomToken(CALLBACK_TOKEN_LENGTH);
      try {
        await this.db.run(
          `INSERT INTO callback_tokens (token, user_id, kind, payload) VALUES (?1, ?2, ?3, ?4)`,
          token,
          userId,
          kind,
          payload,
        );
        return token;
      } catch {
        // token collision (astronomically unlikely) — retry with a new one
      }
    }
    throw new Error("failed to mint a unique callback token");
  }

  async resolve(token: string): Promise<{ userId: number; kind: string; payload: string } | null> {
    const row = await this.db.one<{ user_id: number; kind: string; payload: string }>(
      `SELECT user_id, kind, payload FROM callback_tokens WHERE token = ?1`,
      token,
    );
    return row ? { userId: row.user_id, kind: row.kind, payload: row.payload } : null;
  }

  async gcExpired(): Promise<number> {
    const res = await this.db.run(
      `DELETE FROM callback_tokens WHERE created_at < unixepoch() - ?1`,
      CALLBACK_TOKEN_TTL_SECONDS,
    );
    return res.meta.changes ?? 0;
  }
}
