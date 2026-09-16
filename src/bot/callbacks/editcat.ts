import { InlineKeyboard } from "grammy";
import type { AppContext } from "../context";
import type { Callback } from "../../callback/types";
import { encode } from "../../callback/codec";
import { browse } from "../../services/categoryTree";
import { browseKeyboard } from "../keyboards/categoryPicker";

/** Called after picking a category via purpose "e" — shows the /editcat
 * menu (rename vs. change parent) for that category. */
export async function showEditMenu(ctx: AppContext, catId: number): Promise<void> {
  const category = await ctx.repos.categories.byId(catId);
  if (!category) {
    await ctx.answerCallbackQuery({ text: "That category no longer exists.", show_alert: true });
    return;
  }
  const kb = new InlineKeyboard()
    .text("✏️ Rename", encode({ op: "e", action: "n", catId }))
    .row()
    .text("🔀 Change parent", encode({ op: "e", action: "m", catId }))
    .row()
    .text("✖️ Cancel", encode({ op: "x" }));
  await ctx.editMessageText(`Editing "${category.name}":`, { reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleEditAction(ctx: AppContext, cb: Extract<Callback, { op: "e" }>): Promise<void> {
  const category = await ctx.repos.categories.byId(cb.catId);
  if (!category) {
    await ctx.answerCallbackQuery({ text: "That category no longer exists.", show_alert: true });
    return;
  }

  if (cb.action === "n") {
    ctx.session.flow = { kind: "editcat", step: "await_name", categoryId: category.id };
    await ctx.editMessageText(`Send the new name for "${category.name}".`, { reply_markup: undefined });
    await ctx.answerCallbackQuery();
    return;
  }

  // action === "m": reuses the /movecat "pick new parent" flow verbatim.
  ctx.session.flow = { kind: "movecat", step: "await_parent", categoryId: category.id };
  const view = await browse(ctx.repos, 0, 0);
  await ctx.editMessageText("Where should it move to?", { reply_markup: browseKeyboard(view, "c") });
  await ctx.answerCallbackQuery();
}
