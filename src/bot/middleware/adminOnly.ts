import type { MiddlewareFn } from "grammy";
import type { AppContext } from "../context";

/** Drop into a specific command/callback handler chain: `bot.command("addfact", adminOnly, handler)`.
 * Non-admins get silently ignored (public commands are registered separately, so this never
 * blocks unrelated handlers). */
export const adminOnly: MiddlewareFn<AppContext> = async (ctx, next) => {
  if (!ctx.isAdmin) return;
  await next();
};
