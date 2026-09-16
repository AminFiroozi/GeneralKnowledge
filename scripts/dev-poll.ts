/**
 * Local dev bridge: long-polls Telegram's getUpdates and forwards each
 * update to the local Worker's /webhook, with the real secret-token
 * header attached. This exercises the exact production code path without
 * a tunnel or a rotating public URL — see the "Local dev" section of the
 * telegram-bot-cloudflare skill for why this beats cloudflared.
 *
 * Requires a SECOND bot token (a dev bot from BotFather): polling and a
 * webhook can't both be active on the same token at once.
 */
import { readFileSync } from "node:fs";

function loadDevVars(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const text = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
    }
  } catch {
    // fall through to process.env only
  }
  return out;
}

function required(name: string, value: string | undefined): string {
  if (!value) {
    console.error(`Missing ${name} (checked .dev.vars and process.env).`);
    process.exit(1);
  }
  return value;
}

const vars = { ...loadDevVars(), ...process.env };
// Resolved to plain `string` via required() (not just narrowed) so these
// stay valid inside the main() closure below — TS doesn't carry a
// `string | undefined` narrowing across a closure boundary, only a type.
const BOT_TOKEN = required("BOT_TOKEN", vars.BOT_TOKEN);
const WEBHOOK_SECRET = required("WEBHOOK_SECRET", vars.WEBHOOK_SECRET);
const LOCAL_URL = vars.LOCAL_WEBHOOK_URL ?? "http://localhost:8787/webhook";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function main() {
  await fetch(`${API}/deleteWebhook`, { method: "POST" });
  console.log(`Polling ${API}/getUpdates -> forwarding to ${LOCAL_URL}`);

  let offset = 0;
  for (;;) {
    const res = await fetch(`${API}/getUpdates?timeout=30&offset=${offset}`);
    const body = (await res.json()) as { ok: boolean; result: Array<{ update_id: number }> };
    if (!body.ok) {
      console.error("getUpdates failed:", body);
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    for (const update of body.result) {
      offset = update.update_id + 1;
      try {
        const forwarded = await fetch(LOCAL_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-Telegram-Bot-Api-Secret-Token": WEBHOOK_SECRET,
          },
          body: JSON.stringify(update),
        });
        console.log(`update ${update.update_id} -> ${forwarded.status}`);
      } catch (err) {
        console.error(`update ${update.update_id} forwarding failed:`, err);
      }
    }
  }
}

main();
