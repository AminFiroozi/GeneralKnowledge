import type { AppContext } from "../../context";
import { browse } from "../../../services/categoryTree";
import { browseKeyboard } from "../../keyboards/categoryPicker";
import { submitForReview } from "../../review";

export async function editCategoryCommand(ctx: AppContext): Promise<void> {
  ctx.session.flow = { kind: "editcat", step: "await_target" };
  const view = await browse(ctx.repos, 0, 0);
  await ctx.reply("Which category do you want to edit? (or use /search <text>)", {
    reply_markup: browseKeyboard(view, "e"),
  });
}

/** Registered on `message:text`; only acts while mid-/editcat waiting for
 * the new-name step, otherwise falls through. Open to non-admins too —
 * their rename goes to review instead of applying directly. */
export async function editCategoryTextHandler(ctx: AppContext, next: () => Promise<void>): Promise<void> {
  const flow = ctx.session.flow;
  if (!flow || flow.kind !== "editcat" || flow.step !== "await_name") {
    return next();
  }
  const name = ctx.message?.text?.trim();
  if (!name || name.length < 2) {
    await ctx.reply("That name is too short. Try again.");
    return;
  }
  ctx.session.flow = undefined;

  if (!ctx.isAdmin) {
    const category = await ctx.repos.categories.byId(flow.categoryId);
    if (!category) {
      await ctx.reply("That category no longer exists.");
      return;
    }
    await submitForReview(ctx, "edit_category", {
      action: "rename",
      categoryId: category.id,
      categoryName: category.name,
      newName: name,
    });
    return;
  }

  const updated = await ctx.repos.categories.rename(flow.categoryId, name);
  await ctx.reply(`Renamed to "${updated.name}".`);
}
