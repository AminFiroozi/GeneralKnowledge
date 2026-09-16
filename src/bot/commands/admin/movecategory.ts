import type { AppContext } from "../../context";
import { browse } from "../../../services/categoryTree";
import { browseKeyboard } from "../../keyboards/categoryPicker";

export async function moveCategoryCommand(ctx: AppContext): Promise<void> {
  ctx.session.flow = { kind: "movecat", step: "await_source" };
  const view = await browse(ctx.repos, 0, 0);
  await ctx.reply("Which category do you want to move?", { reply_markup: browseKeyboard(view, "m") });
}
