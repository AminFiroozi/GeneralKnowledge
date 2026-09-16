// `Env` (DB, BOT_INFO) is generated globally in worker-configuration.d.ts by
// `npm run cf-typegen` (a thin wrapper over `wrangler types`), from
// wrangler.jsonc's bindings/vars. Secrets aren't discoverable statically
// (they're set via `wrangler secret put`), so they're merged in here.
declare global {
  interface Env {
    BOT_TOKEN: string;
    WEBHOOK_SECRET: string;
    ADMIN_IDS: string;
    /** Telegram chat id (group/channel) where non-admin add/edit requests
     * are posted for approval. Empty string = not configured yet. */
    ADMIN_CHANNEL_ID: string;
  }
  namespace Cloudflare {
    interface Env {
      BOT_TOKEN: string;
      WEBHOOK_SECRET: string;
      ADMIN_IDS: string;
      ADMIN_CHANNEL_ID: string;
    }
  }
}

export function parseAdminIds(raw: string): Set<number> {
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number),
  );
}

export const CATEGORY_PAGE_SIZE = 8;
export const GENERAL_CATEGORY_SLUG = "general";
export const CALLBACK_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const CALLBACK_TOKEN_LENGTH = 8;

/** New message per fact with the previous keyboard stripped (vs. editing
 * one message in place). Flip to "edit" to keep a single-message feed. */
export const FEED_MODE: "new-message" | "edit" = "new-message";
