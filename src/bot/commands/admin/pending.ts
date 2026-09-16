import type { AppContext } from "../../context";

export async function pendingCommand(ctx: AppContext): Promise<void> {
  const items = await ctx.repos.pendingChanges.listPending();
  if (items.length === 0) {
    await ctx.reply("No pending requests.");
    return;
  }
  const lines = items.map((p) => `#${p.id} · ${p.kind} · from ${p.submittedBy}`);
  await ctx.reply(`${items.length} pending:\n${lines.join("\n")}\n\nDecide these from the admin channel.`);
}
