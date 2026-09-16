import { InlineKeyboard } from "grammy";
import type { AppContext } from "./context";
import type { PendingKind } from "../db/pendingChanges.repo";
import { encode } from "../callback/codec";
import { escapeHtml } from "./html";

export interface AddFactPayload {
  text: string;
  categoryId: number;
  categoryName: string;
}

export interface AddCategoryPayload {
  name: string;
  parentId: number | null;
  parentName: string | null;
}

export type EditCategoryPayload =
  | { action: "rename"; categoryId: number; categoryName: string; newName: string }
  | { action: "move"; categoryId: number; categoryName: string; newParentId: number | null; newParentName: string | null };

export type PendingPayload = AddFactPayload | AddCategoryPayload | EditCategoryPayload;

const KIND_LABEL: Record<PendingKind, string> = {
  add_fact: "fact",
  add_category: "category",
  edit_category: "category edit",
};

function describe(kind: PendingKind, payload: PendingPayload): string {
  switch (kind) {
    case "add_fact": {
      const p = payload as AddFactPayload;
      return `Category: ${escapeHtml(p.categoryName)}\n\n${escapeHtml(p.text)}`;
    }
    case "add_category": {
      const p = payload as AddCategoryPayload;
      return `Name: ${escapeHtml(p.name)}\nParent: ${p.parentName ? escapeHtml(p.parentName) : "(top level)"}`;
    }
    case "edit_category": {
      const p = payload as EditCategoryPayload;
      if (p.action === "rename") {
        return `Category: ${escapeHtml(p.categoryName)}\nNew name: ${escapeHtml(p.newName)}`;
      }
      return `Category: ${escapeHtml(p.categoryName)}\nNew parent: ${p.newParentName ? escapeHtml(p.newParentName) : "(top level)"}`;
    }
  }
}

function submitterLabel(ctx: AppContext): string {
  const from = ctx.from!;
  return from.username ? `@${from.username}` : escapeHtml(from.first_name);
}

/** Records a non-admin's proposed change and posts it to the configured
 * admin channel with Approve/Reject buttons. Applying it (on approve)
 * happens in src/bot/callbacks/review.ts, not here — this only files the
 * request. Silently no-ops with a friendly message if no admin channel
 * has been configured yet (ADMIN_CHANNEL_ID unset). */
export async function submitForReview(ctx: AppContext, kind: PendingKind, payload: PendingPayload): Promise<void> {
  if (!ctx.env.ADMIN_CHANNEL_ID) {
    await ctx.reply("Sorry, review isn't set up on this bot yet — ask an admin to configure ADMIN_CHANNEL_ID.");
    return;
  }

  const pending = await ctx.repos.pendingChanges.create(kind, JSON.stringify(payload), ctx.from!.id);
  const kb = new InlineKeyboard()
    .text("✅ Approve", encode({ op: "v", decision: "a", pendingId: pending.id }))
    .text("❌ Reject", encode({ op: "v", decision: "r", pendingId: pending.id }));

  const text = `<b>New ${KIND_LABEL[kind]} request</b>\nFrom: ${submitterLabel(ctx)} (${ctx.from!.id})\n\n${describe(kind, payload)}`;
  const sent = await ctx.api.sendMessage(ctx.env.ADMIN_CHANNEL_ID, text, {
    parse_mode: "HTML",
    reply_markup: kb,
  });
  await ctx.repos.pendingChanges.setAdminMessage(pending.id, sent.chat.id, sent.message_id);

  await ctx.reply("Submitted for admin review — you'll hear back once it's decided.");
}
