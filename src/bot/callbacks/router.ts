import type { Bot } from "grammy";
import type { AppContext } from "../context";
import { decode } from "../../callback/codec";
import { handleBrowse, handleUp } from "./browse";
import { handleSearchPage } from "./search";
import { handlePick } from "./pick";
import { handleNext, handleRandom } from "./next";

export function installCallbackRouter(bot: Bot<AppContext>): void {
  bot.on("callback_query:data", async (ctx) => {
    const cb = decode(ctx.callbackQuery.data);
    if (!cb) {
      await ctx.answerCallbackQuery({ text: "This button expired.", show_alert: true });
      return;
    }

    switch (cb.op) {
      case "b":
        return handleBrowse(ctx, cb);
      case "u":
        return handleUp(ctx, cb);
      case "s":
        return handleSearchPage(ctx, cb);
      case "p":
        return handlePick(ctx, cb);
      case "n":
        return handleNext(ctx, cb);
      case "r":
        return handleRandom(ctx, cb);
      case "h":
        return ctx.answerCallbackQuery();
      case "x":
        ctx.session.flow = undefined;
        await ctx.editMessageText("Cancelled.", { reply_markup: undefined });
        return ctx.answerCallbackQuery();
      case "z":
        await ctx.repos.seen.clearForUser(ctx.from!.id);
        ctx.session.exhaustedNotified = false;
        await ctx.editMessageText("Done — your seen-facts history is cleared.", { reply_markup: undefined });
        return ctx.answerCallbackQuery();
    }
  });
}
