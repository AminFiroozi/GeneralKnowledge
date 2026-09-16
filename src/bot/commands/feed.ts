import type { AppContext } from "../context";
import { deliverFact } from "../deliverFact";
import { resolveReadingCategory } from "../resolveCategory";

export async function feedCommand(ctx: AppContext): Promise<void> {
  const category = await resolveReadingCategory(ctx);
  await deliverFact(ctx, category);
}

export async function surpriseCommand(ctx: AppContext): Promise<void> {
  await deliverFact(ctx, null); // null = whole tree, any category
}
