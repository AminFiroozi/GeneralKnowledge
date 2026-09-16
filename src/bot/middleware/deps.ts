import type { MiddlewareFn } from "grammy";
import { makeRepos } from "../../db/repos";
import type { AppContext } from "../context";
// `Env` below is ambient/global (see src/env.ts), no import needed.

/** Attaches per-request repositories, admin flag, and waitUntil to every
 * update. A fresh Repos instance per request is intentional — Workers may
 * reuse the isolate, but the D1 binding must come from that request's env. */
export function depsMiddleware(env: Env, adminIds: Set<number>, ctx: ExecutionContext): MiddlewareFn<AppContext> {
  const repos = makeRepos(env.DB);
  return async (c, next) => {
    c.repos = repos;
    c.isAdmin = c.from ? adminIds.has(c.from.id) : false;
    c.waitUntil = (p) => ctx.waitUntil(p);
    c.env = env;
    await next();
  };
}
