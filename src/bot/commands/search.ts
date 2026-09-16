import type { AppContext } from "../context";
import { startSearch, searchPage } from "../../services/categoryTree";
import { searchKeyboard } from "../keyboards/categoryPicker";

export async function searchCommand(ctx: AppContext): Promise<void> {
  const query = typeof ctx.match === "string" ? ctx.match.trim() : "";
  if (!query) {
    await ctx.reply("Usage: /search <text> — e.g. /search physics");
    return;
  }
  // Mid-/addfact, category search should assign the pending fact rather
  // than switch what the user is reading.
  const flow = ctx.session.flow;
  const purpose = flow?.kind === "addfact" && flow.step === "await_category" ? "a" : "r";

  const token = await startSearch(ctx.repos, ctx.from!.id, query);
  const view = await searchPage(ctx.repos, token, 0);
  if (!view || view.page.items.length === 0) {
    await ctx.reply(`No categories match "${query}". Try /read to browse instead.`);
    return;
  }
  await ctx.reply(`Results for "${query}":`, { reply_markup: searchKeyboard(view, token, purpose) });
}
