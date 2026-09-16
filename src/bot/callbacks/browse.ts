import type { AppContext } from "../context";
import type { Callback } from "../../callback/types";
import { browse } from "../../services/categoryTree";
import { browseKeyboard } from "../keyboards/categoryPicker";

export async function handleBrowse(ctx: AppContext, cb: Extract<Callback, { op: "b" }>): Promise<void> {
  const view = await browse(ctx.repos, cb.catId, cb.page);
  const label = view.current ? `Browsing "${view.current.name}":` : "Pick a topic:";
  await ctx.editMessageText(label, { reply_markup: browseKeyboard(view, cb.purpose) });
  await ctx.answerCallbackQuery();
}

export async function handleUp(ctx: AppContext, cb: Extract<Callback, { op: "u" }>): Promise<void> {
  const current = await ctx.repos.categories.byId(cb.catId);
  const parentId = current?.parentId ?? 0;
  const view = await browse(ctx.repos, parentId, 0);
  const label = view.current ? `Browsing "${view.current.name}":` : "Pick a topic:";
  await ctx.editMessageText(label, { reply_markup: browseKeyboard(view, cb.purpose) });
  await ctx.answerCallbackQuery();
}
