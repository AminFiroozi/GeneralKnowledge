import type { AppContext } from "../../context";

export async function delFactCommand(ctx: AppContext): Promise<void> {
  const arg = typeof ctx.match === "string" ? ctx.match.trim() : "";
  const id = Number(arg);
  if (!arg || !Number.isInteger(id) || id <= 0) {
    await ctx.reply("Usage: /delfact <id>");
    return;
  }
  const fact = await ctx.repos.facts.byId(id);
  if (!fact) {
    await ctx.reply(`No fact #${id}.`);
    return;
  }
  await ctx.repos.facts.hide(id);
  await ctx.reply(`Hidden fact #${id}.`);
}
