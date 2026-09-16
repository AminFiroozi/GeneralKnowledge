import type { AppContext } from "../../context";

export async function statsCommand(ctx: AppContext): Promise<void> {
  const [categories, facts, users, seen] = await Promise.all([
    ctx.repos.categories.count(),
    ctx.repos.facts.countPublished(),
    ctx.repos.users.count(),
    ctx.repos.seen.totalCount(),
  ]);
  await ctx.reply(
    `Categories: ${categories}\nPublished facts: ${facts}\nUsers: ${users}\nTotal reads: ${seen}`,
  );
}
