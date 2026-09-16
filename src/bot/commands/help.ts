import type { AppContext } from "../context";
import { PUBLIC_COMMANDS, ADMIN_COMMANDS, type CommandDescriptor } from "./commandList";

function renderList(commands: CommandDescriptor[]): string {
  return commands.map((c) => `/${c.command} — ${c.description}`).join("\n");
}

export async function helpCommand(ctx: AppContext): Promise<void> {
  let text = `<b>Commands</b>\n${renderList(PUBLIC_COMMANDS)}`;
  if (ctx.isAdmin) {
    text += `\n\n<b>Admin</b>\n${renderList(ADMIN_COMMANDS)}`;
  }
  await ctx.reply(text, { parse_mode: "HTML" });
}
