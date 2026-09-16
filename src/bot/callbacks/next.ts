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
  // cb.catId 0 means "resolve dynamically" (session default); a nonzero
  // id came from an old message's explicit-category keyboard — pin the
  // session to it so the persistent ▶️ Next button continues from here.
  if (cb.catId !== 0) ctx.session.readingCategoryId = cb.catId;
  await deliverFact(ctx, category);
}

export async function handleRandom(ctx: AppContext, cb: Extract<Callback, { op: "r" }>): Promise<void> {
  await ctx.answerCallbackQuery();
  const category = cb.catId === 0 ? null : await ctx.repos.categories.byId(cb.catId);
  await deliverFact(ctx, category);
}
