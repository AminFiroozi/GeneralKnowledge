import type { AppContext } from "../context";
import type { Callback } from "../../callback/types";
import type { AddFactPayload, AddCategoryPayload, EditCategoryPayload, PendingPayload } from "../review";

async function applyChange(ctx: AppContext, kind: string, payload: PendingPayload): Promise<string> {
  switch (kind) {
    case "add_fact": {
      const p = payload as AddFactPayload;
      const { fact, duplicate } = await ctx.repos.facts.create(p.categoryId, p.text, null, ctx.from!.id);
      return duplicate ? `Already had that fact (#${fact.id}).` : `Added fact #${fact.id}.`;
    }
    case "add_category": {
      const p = payload as AddCategoryPayload;
      const created = await ctx.repos.categories.create(p.parentId, p.name);
      return `Created category "${created.name}" (#${created.id}).`;
    }
    case "edit_category": {
      const p = payload as EditCategoryPayload;
      if (p.action === "rename") {
        const updated = await ctx.repos.categories.rename(p.categoryId, p.newName);
        return `Renamed to "${updated.name}".`;
      }
      const category = await ctx.repos.categories.byId(p.categoryId);
      if (!category) return "That category no longer exists.";
      await ctx.repos.categories.reparent(category, p.newParentId);
      return `Moved "${category.name}".`;
    }
    default:
      return "Unknown change type.";
  }
}

export async function handleReviewDecision(ctx: AppContext, cb: Extract<Callback, { op: "v" }>): Promise<void> {
  if (!ctx.isAdmin) {
    await ctx.answerCallbackQuery({ text: "Admins only.", show_alert: true });
    return;
  }

  const pending = await ctx.repos.pendingChanges.get(cb.pendingId);
  if (!pending) {
    await ctx.answerCallbackQuery({ text: "This request no longer exists.", show_alert: true });
    return;
  }

  const claimed = await ctx.repos.pendingChanges.decide(
    pending.id,
    cb.decision === "a" ? "approved" : "rejected",
    ctx.from!.id,
  );
  if (!claimed) {
    await ctx.answerCallbackQuery({ text: "Already handled by someone else.", show_alert: true });
    return;
  }

  const message = ctx.callbackQuery!.message;
  const originalText = message && "text" in message ? message.text : "";
  let resultLine: string;
  let submitterMessage: string;

  if (cb.decision === "r") {
    resultLine = "❌ Rejected";
    submitterMessage = "Your submission was reviewed and rejected.";
  } else {
    const payload = JSON.parse(pending.payload) as PendingPayload;
    const applied = await applyChange(ctx, pending.kind, payload);
    resultLine = `✅ Approved — ${applied}`;
    submitterMessage = `Your submission was approved: ${applied}`;
  }

  await ctx.editMessageText(`${originalText}\n\n${resultLine} (by ${ctx.from!.first_name})`, {
    reply_markup: undefined,
  });
  await ctx.answerCallbackQuery();

  ctx.waitUntil(ctx.api.sendMessage(pending.submittedBy, submitterMessage).catch(() => {}));
}
