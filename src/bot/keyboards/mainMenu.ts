import { Keyboard } from "grammy";

/** Labels double as the match text for the reply-keyboard handlers in
 * mainMenuActions.ts — keep them in sync (a rename here needs the
 * matching bot.hears() call updated too). */
export const MAIN_MENU = {
  next: "▶️ Next",
  surprise: "🎲 Surprise me",
  search: "🔍 Search",
  browse: "📂 Browse",
  defaultTopic: "⭐ Default topic",
  me: "📊 Me",
  reset: "♻️ Reset",
  help: "❓ Help",
} as const;

/** Persistent bottom keyboard replacing the per-message inline reader
 * controls. Sent once (on /start) and stays until the client is told
 * otherwise — unlike InlineKeyboard, it isn't tied to one message, so it
 * can't carry per-tap state (a page number, a search token). That's why
 * category browsing/search/admin pick-flows still use InlineKeyboard:
 * this bar is for the handful of actions that need none. */
export function mainMenuKeyboard(): Keyboard {
  return new Keyboard()
    .text(MAIN_MENU.next)
    .text(MAIN_MENU.surprise)
    .row()
    .text(MAIN_MENU.search)
    .text(MAIN_MENU.browse)
    .row()
    .text(MAIN_MENU.defaultTopic)
    .text(MAIN_MENU.me)
    .row()
    .text(MAIN_MENU.reset)
    .text(MAIN_MENU.help)
    .resized();
}
