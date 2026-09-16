import type { AppContext } from "../../context";
import { browse } from "../../../services/categoryTree";
import { browseKeyboard } from "../../keyboards/categoryPicker";

export async function addFactCommand(ctx: AppContext): Promise<void> {
  ctx.session.awaitingSearchQuery = false; // a stale 🔍 Search prompt shouldn't hijack the text step below
  ctx.session.flow = { kind: "addfact", step: "await_text" };
  await ctx.reply("Send the fact's text.");
}

/** Registered on `message:text`; only acts when an admin has an active
 * /addfact flow waiting for the text step, otherwise falls through. */
export async function addFactTextHandler(ctx: AppContext, next: () => Promise<void>): Promise<void> {
  const flow = ctx.session.flow;
  if (!ctx.isAdmin || !flow || flow.kind !== "addfact" || flow.step !== "await_text") {
    return next();
  }
  const text = ctx.message?.text?.trim();
  if (!text || text.length < 10) {
    await ctx.reply("That's too short for a fact (10 characters minimum). Try again.");
    return;
  }
  ctx.session.flow = { kind: "addfact", step: "await_category", text, source: null };
  const view = await browse(ctx.repos, 0, 0);
  await ctx.reply("Got it. Now pick a category (or use /search <text>):", {
    reply_markup: browseKeyboard(view, "a"),
  });
}
