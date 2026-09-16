import type { AppContext } from "../context";
import { resolveReadingCategory } from "../resolveCategory";

export async function meCommand(ctx: AppContext): Promise<void> {
  const userId = ctx.from!.id;
  const [user, category, seenCount] = await Promise.all([
    ctx.repos.users.get(userId),
    resolveReadingCategory(ctx),
    ctx.repos.seen.countForUser(userId),
  ]);
  const defaultLabel = user?.default_category_id
    ? (await ctx.repos.categories.byId(user.default_category_id))?.name ?? "General"
    : "General";
  await ctx.reply(
    `Facts seen: ${seenCount}\nCurrent topic: ${category.name}\nDefault topic: ${defaultLabel}`,
  );
}
