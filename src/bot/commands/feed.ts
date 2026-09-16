import type { AppContext } from "../context";
import { deliverFact } from "../deliverFact";
import { resolveReadingCategory, keyboardCatIdFor } from "../resolveCategory";

export async function feedCommand(ctx: AppContext): Promise<void> {
  const category = await resolveReadingCategory(ctx);
  await deliverFact(ctx, category, keyboardCatIdFor(ctx));
}
