import type { AppContext } from "../../context";
import { browse } from "../../../services/categoryTree";
import { browseKeyboard } from "../../keyboards/categoryPicker";

export async function editCategoryCommand(ctx: AppContext): Promise<void> {
  ctx.session.flow = { kind: "editcat", step: "await_target" };
  const view = await browse(ctx.repos, 0, 0);
  await ctx.reply("Which category do you want to edit? (or use /search <text>)", {
    reply_markup: browseKeyboard(view, "e"),
  });
}

/** Registered on `message:text`; only acts when an admin is mid-/editcat
 * waiting for the new-name step, otherwise falls through. */
export async function editCategoryTextHandler(ctx: AppContext, next: () => Promise<void>): Promise<void> {
  const flow = ctx.session.flow;
  if (!ctx.isAdmin || !flow || flow.kind !== "editcat" || flow.step !== "await_name") {
    return next();
  }
  const name = ctx.message?.text?.trim();
  if (!name || name.length < 2) {
    await ctx.reply("That name is too short. Try again.");
    return;
  }
  const updated = await ctx.repos.categories.rename(flow.categoryId, name);
  ctx.session.flow = undefined;
  await ctx.reply(`Renamed to "${updated.name}".`);
}
