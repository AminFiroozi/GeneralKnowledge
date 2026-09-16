import type { AppContext } from "./context";
import type { Category } from "../domain/types";

/** The category currently being read: whatever the user last picked via
 * /read or /browse for this session, falling back to their saved default
 * (set via /setdefault), falling back to "general". */
export async function resolveReadingCategory(ctx: AppContext): Promise<Category> {
  if (ctx.session.readingCategoryId) {
    const picked = await ctx.repos.categories.byId(ctx.session.readingCategoryId);
    if (picked) return picked;
  }
  const user = await ctx.repos.users.get(ctx.from!.id);
  if (user?.default_category_id) {
    const def = await ctx.repos.categories.byId(user.default_category_id);
    if (def) return def;
  }
  return ctx.repos.categories.general();
}
