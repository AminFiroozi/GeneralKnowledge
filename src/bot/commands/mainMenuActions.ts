import type { AppContext } from "../context";
import { feedCommand, surpriseCommand } from "./feed";
import { readCommand } from "./read";
import { setDefaultCommand } from "./setdefault";
import { meCommand } from "./me";
import { resetCommand } from "./resetSeen";
import { helpCommand } from "./help";
import { runSearch } from "./search";

/** Handlers for the persistent reply-keyboard buttons (mainMenu.ts). Each
 * one (other than 🔍 Search) supersedes any pending admin flow or search
 * prompt — tapping a nav button reads as "never mind that" rather than
 * being swallowed as free-text input by a flow's text handler. Register
 * these with bot.hears() *before* the generic message:text
 * flow-continuation handlers in createBot.ts. */

function clearTransientState(ctx: AppContext): void {
  ctx.session.flow = undefined;
  ctx.session.awaitingSearchQuery = false;
}

export async function onMenuNext(ctx: AppContext): Promise<void> {
  clearTransientState(ctx);
  await feedCommand(ctx);
}

export async function onMenuSurprise(ctx: AppContext): Promise<void> {
  clearTransientState(ctx);
  await surpriseCommand(ctx);
}

export async function onMenuBrowse(ctx: AppContext): Promise<void> {
  clearTransientState(ctx);
  await readCommand(ctx);
}

export async function onMenuSearchPrompt(ctx: AppContext): Promise<void> {
  // Deliberately doesn't touch ctx.session.flow: searching mid-addfact/
  // movecat/editcat should feed that flow's category pick, not abandon it.
  ctx.session.awaitingSearchQuery = true;
  await ctx.reply("What do you want to search for?");
}

export async function onMenuDefaultTopic(ctx: AppContext): Promise<void> {
  clearTransientState(ctx);
  await setDefaultCommand(ctx);
}

export async function onMenuMe(ctx: AppContext): Promise<void> {
  clearTransientState(ctx);
  await meCommand(ctx);
}

export async function onMenuReset(ctx: AppContext): Promise<void> {
  clearTransientState(ctx);
  await resetCommand(ctx);
}

export async function onMenuHelp(ctx: AppContext): Promise<void> {
  clearTransientState(ctx);
  await helpCommand(ctx);
}

/** Registered on `message:text`, after the hears() handlers above but
 * before other flow-continuation handlers — only acts while a 🔍 Search
 * prompt is pending, otherwise falls through. Leaves ctx.session.flow
 * alone so runSearch can still see it (mid-addfact/movecat/editcat). */
export async function searchPromptTextHandler(ctx: AppContext, next: () => Promise<void>): Promise<void> {
  if (!ctx.session.awaitingSearchQuery) {
    return next();
  }
  const query = ctx.message?.text?.trim();
  ctx.session.awaitingSearchQuery = false;
  if (!query) {
    await ctx.reply("Empty search — try again with 🔍 Search.");
    return;
  }
  await runSearch(ctx, query);
}
