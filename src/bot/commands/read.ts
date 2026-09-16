import type { AppContext } from "../context";
import { browse } from "../../services/categoryTree";
import { browseKeyboard } from "../keyboards/categoryPicker";

export async function readCommand(ctx: AppContext): Promise<void> {
  const view = await browse(ctx.repos, 0, 0);
  await ctx.reply("Pick a topic:", { reply_markup: browseKeyboard(view, "r") });
}
