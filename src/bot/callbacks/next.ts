import type { AppContext } from "../context";
import type { Callback } from "../../callback/types";
import { deliverFact } from "../deliverFact";
import { resolveReadingCategory } from "../resolveCategory";

export async function handleNext(ctx: AppContext, cb: Extract<Callback, { op: "n" }>): Promise<void> {
  await ctx.answerCallbackQuery();
  const category = cb.catId === 0 ? await resolveReadingCategory(ctx) : await ctx.repos.categories.byId(cb.catId);
  if (!category) {
    await ctx.reply("That topic no longer exists. Try /read to pick another.");
    return;
  }
  // Keep catId 0 as 0 (not category.id): it means "resolve dynamically each
  // tap", so a later /setdefault change takes effect without a stale pin.
  await deliverFact(ctx, category, cb.catId);
}

export async function handleRandom(ctx: AppContext, cb: Extract<Callback, { op: "r" }>): Promise<void> {
  await ctx.answerCallbackQuery();
  const category = cb.catId === 0 ? null : await ctx.repos.categories.byId(cb.catId);
  await deliverFact(ctx, category); // keyboardCatId omitted: pins Next to wherever the roll lands
}
