-- Offline repair for categories.path / categories.depth from parent_id
-- alone. Not used on any hot path — the app maintains path/depth
-- incrementally on create/reparent. Run this only if the tree is ever
-- suspected to have drifted (e.g. after a manual data fix).
--
--   npx wrangler d1 execute general-knowledge --remote --file=scripts/rebuild-paths.sql

WITH RECURSIVE t(id, path, depth) AS (
  SELECT id, '/' || id || '/', 0 FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, t.path || c.id || '/', t.depth + 1
    FROM categories c JOIN t ON c.parent_id = t.id
)
UPDATE categories
   SET path  = (SELECT path  FROM t WHERE t.id = categories.id),
       depth = (SELECT depth FROM t WHERE t.id = categories.id);

UPDATE categories SET child_count =
  (SELECT COUNT(*) FROM categories k WHERE k.parent_id = categories.id);

UPDATE categories SET fact_count =
  (SELECT COUNT(*) FROM facts f WHERE f.category_id = categories.id AND f.status = 'published');
