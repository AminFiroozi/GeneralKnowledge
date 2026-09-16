import type { Bot } from "grammy";
import type { AppContext } from "../context";

export function installErrorHandler(bot: Bot<AppContext>): void {
  bot.catch((err) => {
    console.error("bot error", err.ctx.update.update_id, err.error);
    const ctx = err.ctx;
    if (ctx.callbackQuery) {
      // Always ack callback queries, even on failure, or Telegram shows a
      // client-side spinner/timeout to the user.
      ctx.answerCallbackQuery({ text: "Something went wrong, try again.", show_alert: false }).catch(() => {});
    } else if (ctx.chat) {
      ctx.reply("Something went wrong. Please try again.").catch(() => {});
    }
  });
}
