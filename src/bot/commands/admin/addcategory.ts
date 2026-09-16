import type { AppContext } from "../../context";
import { browse } from "../../../services/categoryTree";
import { browseKeyboard } from "../../keyboards/categoryPicker";

async function promptForParent(ctx: AppContext, name: string): Promise<void> {
  ctx.session.flow = { kind: "addcat", step: "await_parent", name };
  const view = await browse(ctx.repos, 0, 0);
  await ctx.reply(`Where should "${name}" live?`, { reply_markup: browseKeyboard(view, "c") });
}

export async function addCategoryCommand(ctx: AppContext): Promise<void> {
  const name = typeof ctx.match === "string" ? ctx.match.trim() : "";
  if (name) {
    await promptForParent(ctx, name);
    return;
  }
  ctx.session.flow = { kind: "addcat", step: "await_name" };
  await ctx.reply("Send the new category's name.");
}

/** Registered on `message:text`; only acts when an admin is mid-/addcat
 * waiting for the name step, otherwise falls through. */
export async function addCategoryTextHandler(ctx: AppContext, next: () => Promise<void>): Promise<void> {
  const flow = ctx.session.flow;
  if (!ctx.isAdmin || !flow || flow.kind !== "addcat" || flow.step !== "await_name") {
    return next();
  }
  const name = ctx.message?.text?.trim();
  if (!name || name.length < 2) {
    await ctx.reply("That name is too short. Try again.");
    return;
  }
  await promptForParent(ctx, name);
}
