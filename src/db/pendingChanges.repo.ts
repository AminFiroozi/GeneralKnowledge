import type { Db } from "./client";

export type PendingKind = "add_fact" | "add_category" | "edit_category";
export type PendingStatus = "pending" | "approved" | "rejected";

export interface PendingChange {
  id: number;
  kind: PendingKind;
  payload: string; // JSON — parse against the shape for `kind` (see src/bot/review.ts)
  submittedBy: number;
  status: PendingStatus;
  adminChatId: number | null;
  adminMsgId: number | null;
  reviewedBy: number | null;
}

interface PendingChangeRow {
  id: number;
  kind: PendingKind;
  payload: string;
  submitted_by: number;
  status: PendingStatus;
  admin_chat_id: number | null;
  admin_msg_id: number | null;
  reviewed_by: number | null;
}

function toPendingChange(row: PendingChangeRow): PendingChange {
  return {
    id: row.id,
    kind: row.kind,
    payload: row.payload,
    submittedBy: row.submitted_by,
    status: row.status,
    adminChatId: row.admin_chat_id,
    adminMsgId: row.admin_msg_id,
    reviewedBy: row.reviewed_by,
  };
}

const SELECT = `SELECT id, kind, payload, submitted_by, status, admin_chat_id, admin_msg_id, reviewed_by FROM pending_changes`;

export class PendingChangesRepo {
  constructor(private readonly db: Db) {}

  async create(kind: PendingKind, payload: string, submittedBy: number): Promise<PendingChange> {
    const insert = await this.db.run(
      `INSERT INTO pending_changes (kind, payload, submitted_by) VALUES (?1, ?2, ?3)`,
      kind,
      payload,
      submittedBy,
    );
    const created = await this.get(insert.meta.last_row_id);
    if (!created) throw new Error("pending change disappeared immediately after insert");
    return created;
  }

  async get(id: number): Promise<PendingChange | null> {
    const row = await this.db.one<PendingChangeRow>(`${SELECT} WHERE id = ?1`, id);
    return row ? toPendingChange(row) : null;
  }

  async setAdminMessage(id: number, chatId: number, msgId: number): Promise<void> {
    await this.db.run(
      `UPDATE pending_changes SET admin_chat_id = ?1, admin_msg_id = ?2 WHERE id = ?3`,
      chatId,
      msgId,
      id,
    );
  }

  /** Transitions a pending row out of "pending", but only if it's still
   * pending — guards against a double-tap on the same approve/reject
   * button racing two admins (or the same admin twice). */
  async decide(id: number, status: "approved" | "rejected", reviewedBy: number): Promise<boolean> {
    const res = await this.db.run(
      `UPDATE pending_changes SET status = ?1, reviewed_by = ?2, reviewed_at = unixepoch()
        WHERE id = ?3 AND status = 'pending'`,
      status,
      reviewedBy,
      id,
    );
    return (res.meta.changes ?? 0) > 0;
  }

  async listPending(limit = 20): Promise<PendingChange[]> {
    const rows = await this.db.many<PendingChangeRow>(
      `${SELECT} WHERE status = 'pending' ORDER BY id LIMIT ?1`,
      limit,
    );
    return rows.map(toPendingChange);
  }
}
