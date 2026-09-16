import type { AppContext } from "../context";
import type { Purpose } from "../../callback/types";
import { startSearch, searchPage } from "../../services/categoryTree";
import { searchKeyboard } from "../keyboards/categoryPicker";

function purposeForCurrentFlow(ctx: AppContext): Purpose {
  const flow = ctx.session.flow;
  if (flow?.kind === "addfact" && flow.step === "await_category") return "a";
  if (flow?.kind === "movecat" && flow.step === "await_source") return "m";
  if (flow?.kind === "editcat" && flow.step === "await_target") return "e";
  return "r";
}

/** Core search logic, reused by /search <text>, the 🔍 Search reply-keyboard
 * button's follow-up prompt, and any future entry point. */
export async function runSearch(ctx: AppContext, query: string): Promise<void> {
  // Mid-flow, category search should feed that flow (assign a fact,
  // pick a category to move/edit) rather than switch what's being read.
  const purpose = purposeForCurrentFlow(ctx);

  const token = await startSearch(ctx.repos, ctx.from!.id, query);
  const view = await searchPage(ctx.repos, token, 0);
  if (!view || view.page.items.length === 0) {
    await ctx.reply(`No categories match "${query}". Try 📂 Browse instead.`);
    return;
  }
  await ctx.reply(`Results for "${query}":`, { reply_markup: searchKeyboard(view, token, purpose) });
}

export async function searchCommand(ctx: AppContext): Promise<void> {
  const query = typeof ctx.match === "string" ? ctx.match.trim() : "";
  if (!query) {
    await ctx.reply("Usage: /search <text> — e.g. /search physics");
    return;
  }
  await runSearch(ctx, query);
}
