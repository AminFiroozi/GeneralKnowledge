-- ============ categories: tree via materialized path ============
CREATE TABLE categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id   INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
  slug        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  name_norm   TEXT    NOT NULL,
  path        TEXT    NOT NULL,
  depth       INTEGER NOT NULL DEFAULT 0,
  child_count INTEGER NOT NULL DEFAULT 0,
  fact_count  INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (length(path) <= 45),
  CHECK (substr(path,1,1) = '/' AND substr(path,-1,1) = '/')
);
CREATE UNIQUE INDEX ix_cat_path      ON categories(path);
CREATE INDEX        ix_cat_parent    ON categories(parent_id, name_norm, id);
CREATE INDEX        ix_cat_namenorm  ON categories(name_norm, id);

-- ============ facts ============
CREATE TABLE facts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  body        TEXT    NOT NULL,
  source      TEXT,
  rnd         REAL    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'published',
  body_hash   TEXT    NOT NULL,
  created_by  INTEGER,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (length(body) BETWEEN 10 AND 3500),
  CHECK (status IN ('published','draft','hidden'))
);
CREATE UNIQUE INDEX ix_facts_hash    ON facts(body_hash);
CREATE INDEX        ix_facts_cat_rnd ON facts(category_id, rnd, id) WHERE status='published';
CREATE INDEX        ix_facts_cat_id  ON facts(category_id, id);

-- ============ users ============
CREATE TABLE users (
  id                   INTEGER PRIMARY KEY,
  default_category_id  INTEGER REFERENCES categories(id),
  seen_count           INTEGER NOT NULL DEFAULT 0,
  created_at           INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen_at         INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============ seen tracking ============
-- Deliberately NOT `WITHOUT ROWID`: the implicit rowid gives a stable
-- insertion-order tiebreaker for "least recently seen" when two rows land
-- in the same unixepoch() second (seen_at has only second resolution).
CREATE TABLE seen_facts (
  user_id INTEGER NOT NULL,
  fact_id INTEGER NOT NULL,
  seen_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, fact_id)
);
CREATE INDEX ix_seen_user_time ON seen_facts(user_id, seen_at);

-- ============ conversation state (grammY session storage) ============
CREATE TABLE user_state (
  user_id    INTEGER PRIMARY KEY,
  data       TEXT    NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============ short-lived callback payloads (search queries) ============
CREATE TABLE callback_tokens (
  token      TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  kind       TEXT    NOT NULL,
  payload    TEXT    NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
) WITHOUT ROWID;
CREATE INDEX ix_tok_created ON callback_tokens(created_at);
