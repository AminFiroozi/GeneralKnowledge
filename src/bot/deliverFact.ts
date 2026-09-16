import type { AppContext } from "./context";
import { nextFact } from "../services/feed";
import type { Category } from "../domain/types";

/** Sends the next fact for `category` (null = whole tree, "surprise me")
 * to the user. No per-message keyboard — the persistent bottom menu
 * (mainMenu.ts) carries Next/Surprise/etc., so every fact is just plain
 * text. Marks the fact seen in the background so the tap feels instant. */
export async function deliverFact(ctx: AppContext, category: Category | null): Promise<void> {
  const userId = ctx.from!.id;
  const result = await nextFact(ctx.repos, userId, category);

  if (!result) {
    await ctx.reply("No facts in this category yet. Try 📂 Browse for another topic.");
    return;
  }

  if (category === null) {
    // "Surprise me" pins subsequent ▶️ Next taps to wherever the roll landed.
    ctx.session.readingCategoryId = result.fact.categoryId;
  }

  if (result.exhausted && !ctx.session.exhaustedNotified) {
    await ctx.reply("You've seen everything here — recycling from the oldest ones you've read.");
    ctx.session.exhaustedNotified = true;
  } else if (!result.exhausted) {
    ctx.session.exhaustedNotified = false;
  }

  const label = result.fact.categoryName ? `<i>${escapeHtml(result.fact.categoryName)}</i>\n\n` : "";
  await ctx.reply(`${label}${escapeHtml(result.fact.body)}`, { parse_mode: "HTML" });

  ctx.waitUntil(ctx.repos.seen.markSeen(userId, result.fact.id));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
