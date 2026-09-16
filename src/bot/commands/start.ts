import type { AppContext } from "../context";
import { deliverFact } from "../deliverFact";
import { resolveReadingCategory, keyboardCatIdFor } from "../resolveCategory";

export async function startCommand(ctx: AppContext): Promise<void> {
  await ctx.reply(
    "Welcome! I send you one interesting fact at a time — tap ▶️ Next for another, or 🔀 Change topic to browse categories.\n\nUse /help to see everything I can do.",
  );
  const category = await resolveReadingCategory(ctx);
  await deliverFact(ctx, category, keyboardCatIdFor(ctx));
}
