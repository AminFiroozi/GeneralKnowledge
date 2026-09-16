import type { AppContext } from "../context";
import type { Callback } from "../../callback/types";
import { searchPage } from "../../services/categoryTree";
import { searchKeyboard } from "../keyboards/categoryPicker";

export async function handleSearchPage(ctx: AppContext, cb: Extract<Callback, { op: "s" }>): Promise<void> {
  const view = await searchPage(ctx.repos, cb.token, cb.page);
  if (!view) {
    await ctx.answerCallbackQuery({ text: "This search expired — run /search again.", show_alert: true });
    return;
  }
  await ctx.editMessageText(`Results for "${view.query}":`, {
    reply_markup: searchKeyboard(view, cb.token, cb.purpose),
  });
  await ctx.answerCallbackQuery();
}
