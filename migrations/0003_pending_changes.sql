-- Non-admin add/edit requests wait here for an admin's approve/reject tap
-- in the configured admin channel, instead of applying directly.
CREATE TABLE pending_changes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  kind           TEXT    NOT NULL, -- 'add_fact' | 'add_category' | 'edit_category'
  payload        TEXT    NOT NULL, -- JSON, shape depends on kind (see src/bot/review.ts)
  submitted_by   INTEGER NOT NULL, -- telegram user id
  status         TEXT    NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  admin_chat_id  INTEGER,
  admin_msg_id   INTEGER, -- so the review message can be edited after a decision
  reviewed_by    INTEGER, -- admin's telegram user id
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  reviewed_at    INTEGER,
  CHECK (kind IN ('add_fact', 'add_category', 'edit_category')),
  CHECK (status IN ('pending', 'approved', 'rejected'))
);
CREATE INDEX ix_pending_status ON pending_changes(status, created_at);
