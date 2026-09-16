import { InlineKeyboard } from "grammy";
import type { AppContext } from "../context";
import { encode } from "../../callback/codec";

export async function resetCommand(ctx: AppContext): Promise<void> {
  const kb = new InlineKeyboard()
    .text("✅ Yes, forget everything I've read", encode({ op: "z" }))
    .row()
    .text("✖️ Cancel", encode({ op: "x" }));
  await ctx.reply("This clears your seen-facts history so topics start over. Continue?", {
    reply_markup: kb,
  });
}
