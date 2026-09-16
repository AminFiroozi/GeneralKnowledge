# GeneralKnowledge

A Telegram bot that serves short, interesting facts one at a time — like
scrolling reels, but for learning. No quizzes, no scoring, just tap
**Next**. Categories form a tree (any category can have a parent), and
reading a parent category pulls facts from its whole subtree.

Built on Cloudflare Workers + D1, using [grammY](https://grammy.dev).

## Features

- **Endless feed**: `/feed` or tap **Next** for another unseen fact; falls
  back to your least-recently-seen fact once a topic is exhausted, so the
  feed never dead-ends.
- **Category tree**: every category can have a parent (`general` is the
  default, top-level). Reading a parent category includes all its
  descendants.
- **Search or browse**: `/search <text>` for paginated, ranked results, or
  `/read` to browse from the top level down — both via inline keyboards.
- **Admin content management**: `/addfact`, `/addcat`, `/movecat`,
  `/delfact`, `/stats`, `/import` (bulk JSONL), gated by Telegram user ID.

## Stack

- **Cloudflare Workers** — the bot's HTTP entry point (webhook)
- **D1** (SQLite) — categories (materialized-path tree), facts, per-user
  seen-history, session state, and short-lived search tokens
- **grammY** — Telegram Bot framework, TypeScript, first-class Workers support
- **Vitest** + `@cloudflare/vitest-plugin` — tests run against a real D1
  instance with migrations applied

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars   # fill in a dev bot token + a random secret
npx wrangler d1 create general-knowledge   # copy the database_id into wrangler.jsonc
npm run db:migrate:local
npm run dev            # terminal 1: wrangler dev
npm run dev:poll        # terminal 2: polls Telegram, forwards to localhost
```

The dev bridge (`dev:poll`) needs its own bot token — see the
[telegram-bot-cloudflare](https://github.com/AminFiroozi) skill notes on why
polling beats a tunnel for local development. You cannot poll and webhook
the same token at once, so use a second bot from BotFather for local dev.

## Deploy

```bash
npm run db:migrate:remote
npx wrangler secret put BOT_TOKEN
npx wrangler secret put WEBHOOK_SECRET     # openssl rand -hex 32
npx wrangler secret put ADMIN_IDS          # comma-separated Telegram user IDs
npm run deploy
curl -X POST https://<your-worker>.workers.dev/admin/set-webhook \
  -H "x-admin-secret: $WEBHOOK_SECRET"
```

## Tests

```bash
npm test
npm run typecheck
```
