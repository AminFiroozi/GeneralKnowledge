/**
 * Converts a facts JSONL file into SQL for a direct D1 load, for batches
 * bigger than the in-bot /import command's line cap. Category is resolved
 * by slug via a subquery, so this script needs no DB connection itself.
 *
 * Usage:
 *   npx tsx scripts/import-jsonl.ts seeds/batch-02.jsonl > /tmp/batch-02.sql
 *   npx wrangler d1 execute general-knowledge --remote --file=/tmp/batch-02.sql
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

interface Row {
  category: string;
  body: string;
  source?: string;
}

function bodyHash(body: string): string {
  const norm = body.trim().toLowerCase().replace(/\s+/g, " ");
  return createHash("sha256").update(norm).digest("hex");
}

function sqlString(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

const path = process.argv[2];
if (!path) {
  console.error("Usage: import-jsonl.ts <file.jsonl>");
  process.exit(1);
}

const lines = readFileSync(path, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);

const statements: string[] = [];
for (const [i, line] of lines.entries()) {
  let row: Row;
  try {
    row = JSON.parse(line);
  } catch {
    console.error(`line ${i + 1}: invalid JSON, skipped`);
    continue;
  }
  if (!row.category || !row.body) {
    console.error(`line ${i + 1}: missing category or body, skipped`);
    continue;
  }
  const hash = bodyHash(row.body);
  const rnd = Math.random();
  const source = row.source ? sqlString(row.source) : "NULL";
  statements.push(
    `INSERT OR IGNORE INTO facts (category_id, body, source, rnd, body_hash) ` +
      `SELECT id, ${sqlString(row.body)}, ${source}, ${rnd}, ${sqlString(hash)} ` +
      `FROM categories WHERE slug = ${sqlString(row.category)};`,
  );
}

statements.push(
  `UPDATE categories SET fact_count = (SELECT COUNT(*) FROM facts WHERE category_id = categories.id AND status = 'published');`,
);

process.stdout.write(statements.join("\n") + "\n");
console.error(`Generated ${statements.length - 1} insert statement(s).`);
