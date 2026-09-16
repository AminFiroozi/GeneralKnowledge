import type { AppContext } from "../context";
import { deliverFact } from "../deliverFact";
import { resolveReadingCategory } from "../resolveCategory";
import { mainMenuKeyboard } from "../keyboards/mainMenu";

export async function startCommand(ctx: AppContext): Promise<void> {
  // Attaching reply_markup here is enough — a reply keyboard persists
  // client-side until replaced or removed, no need to resend it.
  await ctx.reply(
    "Welcome! I send you one interesting fact at a time — use the buttons below.\n\nUse ❓ Help to see everything I can do.",
    { reply_markup: mainMenuKeyboard() },
  );
  const category = await resolveReadingCategory(ctx);
  await deliverFact(ctx, category);
}
