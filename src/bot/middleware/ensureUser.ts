import type { MiddlewareFn } from "grammy";
import type { AppContext } from "../context";

export const ensureUser: MiddlewareFn<AppContext> = async (ctx, next) => {
  if (ctx.from) {
    const general = await ctx.repos.categories.general();
    // Awaited, not fire-and-forget: handlers further down (e.g. /me,
    // /setdefault) assume the user row already exists.
    await ctx.repos.users.ensure(ctx.from.id, general.id);
  }
  await next();
};
