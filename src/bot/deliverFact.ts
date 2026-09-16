import type { AppContext } from "./context";
import { nextFact } from "../services/feed";
import { readerKeyboard } from "./keyboards/reader";
import type { Category } from "../domain/types";

/** Sends the next fact for `category` (null = whole tree, "surprise me")
 * to the user, in the reels style: a new message per fact with the
 * previous message's keyboard stripped, so there's always exactly one
 * live "Next" button and a scrollable history above it. Marks the fact
 * seen in the background so the tap feels instant. */
export async function deliverFact(
  ctx: AppContext,
  category: Category | null,
  keyboardCatId?: number,
): Promise<void> {
  const userId = ctx.from!.id;
  const result = await nextFact(ctx.repos, userId, category);

  if (!result) {
    await ctx.reply("No facts in this category yet. Try another topic with /read.");
    return;
  }
  // "Surprise me" queries the whole tree (category = null); pin the
  // resulting Next button to wherever the roll landed rather than a fixed
  // catId, so continued taps stay on that topic instead of re-rolling.
  const resolvedKeyboardCatId = keyboardCatId ?? result.fact.categoryId;

  if (result.exhausted && !ctx.session.exhaustedNotified) {
    await ctx.reply("You've seen everything here — recycling from the oldest ones you've read.");
    ctx.session.exhaustedNotified = true;
  } else if (!result.exhausted) {
    ctx.session.exhaustedNotified = false;
  }

  const label = result.fact.categoryName ? `<i>${escapeHtml(result.fact.categoryName)}</i>\n\n` : "";
  const sent = await ctx.reply(`${label}${escapeHtml(result.fact.body)}`, {
    parse_mode: "HTML",
    reply_markup: readerKeyboard(resolvedKeyboardCatId),
  });

  const previousMsgId = ctx.session.lastFactMsgId;
  ctx.session.lastFactMsgId = sent.message_id;
  if (previousMsgId) {
    ctx.waitUntil(
      ctx.api.editMessageReplyMarkup(ctx.chat!.id, previousMsgId, { reply_markup: undefined }).catch(() => {}),
    );
  }

  ctx.waitUntil(ctx.repos.seen.markSeen(userId, result.fact.id));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
