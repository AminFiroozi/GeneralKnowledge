import type { AppContext } from "../../context";

interface JsonlRow {
  category: string; // category slug
  body: string;
  source?: string;
}

function isJsonlRow(x: unknown): x is JsonlRow {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return typeof r.category === "string" && typeof r.body === "string";
}

const MAX_LINES = 500; // keeps one /import within the webhook's ~25s budget

export async function importCommand(ctx: AppContext): Promise<void> {
  const doc = ctx.message?.reply_to_message?.document;
  if (!doc) {
    await ctx.reply("Reply to a .jsonl file with /import. Each line: {\"category\":\"slug\",\"body\":\"...\"}");
    return;
  }

  const file = await ctx.api.getFile(doc.file_id);
  const url = `https://api.telegram.org/file/bot${ctx.env.BOT_TOKEN}/${file.file_path}`;
  const text = await (await fetch(url)).text();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  if (lines.length > MAX_LINES) {
    await ctx.reply(`That's ${lines.length} lines — split into batches of ${MAX_LINES} or fewer, or use scripts/import-jsonl.ts for a direct D1 load.`);
    return;
  }

  const slugCache = new Map<string, number | null>();
  const rows: { categoryId: number; body: string; source: string | null }[] = [];
  const errors: string[] = [];

  for (const [i, line] of lines.entries()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      errors.push(`line ${i + 1}: invalid JSON`);
      continue;
    }
    if (!isJsonlRow(parsed)) {
      errors.push(`line ${i + 1}: missing "category" or "body"`);
      continue;
    }
    if (!slugCache.has(parsed.category)) {
      const cat = await ctx.repos.categories.bySlug(parsed.category);
      slugCache.set(parsed.category, cat?.id ?? null);
    }
    const categoryId = slugCache.get(parsed.category)!;
    if (categoryId === null) {
      errors.push(`line ${i + 1}: unknown category slug "${parsed.category}"`);
      continue;
    }
    rows.push({ categoryId, body: parsed.body, source: parsed.source ?? null });
  }

  const { inserted, skipped } = await ctx.repos.facts.bulkInsert(rows, ctx.from!.id);
  const errorSummary = errors.length ? `\n${errors.length} lines skipped:\n${errors.slice(0, 10).join("\n")}` : "";
  await ctx.reply(`Imported ${inserted}, duplicates skipped ${skipped}.${errorSummary}`);
}
