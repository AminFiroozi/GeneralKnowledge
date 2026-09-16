import { webhookCallback } from "grammy";
import { createBot } from "./bot/createBot";
import { registerBotCommands } from "./bot/commandsSetup";
import { parseAdminIds } from "./env";
// `Env` below is ambient/global (see src/env.ts), no import needed.

function isAuthorizedAdmin(request: Request, env: Env): boolean {
  return request.headers.get("x-admin-secret") === env.WEBHOOK_SECRET;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/webhook" && request.method === "POST") {
      const bot = createBot(env, ctx);
      return webhookCallback(bot, "cloudflare-mod", {
        secretToken: env.WEBHOOK_SECRET,
        timeoutMilliseconds: 25_000,
        onTimeout: "return",
      })(request);
    }

    if (url.pathname === "/admin/set-webhook" && request.method === "POST") {
      if (!isAuthorizedAdmin(request, env)) return new Response("forbidden", { status: 403 });

      const target = `${url.origin}/webhook`;
      const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: target,
          secret_token: env.WEBHOOK_SECRET,
          allowed_updates: ["message", "callback_query"],
          drop_pending_updates: true,
        }),
      });
      const webhookResult = await res.json();

      // Also (re-)register the "/" command menu — cheap, and doing it
      // here means a fresh deploy is fully set up in one call.
      const bot = createBot(env, ctx);
      await registerBotCommands(bot, parseAdminIds(env.ADMIN_IDS));

      return new Response(JSON.stringify({ webhook: webhookResult, commands: "registered" }), {
        status: res.status,
        headers: { "content-type": "application/json" },
      });
    }

    if (url.pathname === "/admin/set-commands" && request.method === "POST") {
      if (!isAuthorizedAdmin(request, env)) return new Response("forbidden", { status: 403 });

      const bot = createBot(env, ctx);
      await registerBotCommands(bot, parseAdminIds(env.ADMIN_IDS));
      return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
    }

    return new Response("ok");
  },
} satisfies ExportedHandler<Env>;
