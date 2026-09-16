/**
 * One-shot webhook management, useful when you'd rather not curl the
 * deployed /admin/set-webhook route. Usage:
 *   BOT_TOKEN=... WORKER_URL=https://your-worker.workers.dev WEBHOOK_SECRET=... \
 *     npx tsx scripts/set-webhook.ts set|delete|info
 */
const BOT_TOKEN = process.env.BOT_TOKEN;
const WORKER_URL = process.env.WORKER_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const action = process.argv[2] ?? "info";

if (!BOT_TOKEN) {
  console.error("Set BOT_TOKEN in the environment.");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function main() {
  if (action === "set") {
    if (!WORKER_URL || !WEBHOOK_SECRET) {
      console.error("Set WORKER_URL and WEBHOOK_SECRET to register a webhook.");
      process.exit(1);
    }
    const res = await fetch(`${API}/setWebhook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: `${WORKER_URL.replace(/\/$/, "")}/webhook`,
        secret_token: WEBHOOK_SECRET,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true,
      }),
    });
    console.log(await res.json());
  } else if (action === "delete") {
    const res = await fetch(`${API}/deleteWebhook`, { method: "POST" });
    console.log(await res.json());
  } else {
    const res = await fetch(`${API}/getWebhookInfo`);
    console.log(await res.json());
  }
}

main();
