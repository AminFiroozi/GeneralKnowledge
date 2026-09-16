import type { AppContext } from "../context";
import type { Callback } from "../../callback/types";
import { deliverFact } from "../deliverFact";
import { browse } from "../../services/categoryTree";
import { browseKeyboard } from "../keyboards/categoryPicker";
import { showEditMenu } from "./editcat";
import { submitForReview } from "../review";

async function handlePickC(ctx: AppContext, catId: number): Promise<void> {
  const flow = ctx.session.flow;
  const parentId = catId === 0 ? null : catId; // 0 is the "top level" sentinel

  if (flow?.kind === "addcat" && flow.step === "await_parent") {
    ctx.session.flow = undefined;
    if (!ctx.isAdmin) {
      const parent = parentId === null ? null : await ctx.repos.categories.byId(parentId);
      await ctx.editMessageText("Sent for review.", { reply_markup: undefined });
      await ctx.answerCallbackQuery();
      await submitForReview(ctx, "add_category", { name: flow.name, parentId, parentName: parent?.name ?? null });
      return;
    }
    const created = await ctx.repos.categories.create(parentId, flow.name);
    await ctx.editMessageText(`Created category "${created.name}" (#${created.id}).`, { reply_markup: undefined });
    await ctx.answerCallbackQuery();
    return;
  }

  if (flow?.kind === "movecat" && flow.step === "await_parent") {
    const category = await ctx.repos.categories.byId(flow.categoryId);
    if (!category) {
      ctx.session.flow = undefined;
      await ctx.answerCallbackQuery({ text: "That category no longer exists.", show_alert: true });
      return;
    }
    ctx.session.flow = undefined;

    if (!ctx.isAdmin) {
      const newParent = parentId === null ? null : await ctx.repos.categories.byId(parentId);
      await ctx.editMessageText("Sent for review.", { reply_markup: undefined });
      await ctx.answerCallbackQuery();
      await submitForReview(ctx, "edit_category", {
        action: "move",
        categoryId: category.id,
        categoryName: category.name,
        newParentId: parentId,
        newParentName: newParent?.name ?? null,
      });
      return;
    }

    try {
      await ctx.repos.categories.reparent(category, parentId);
      await ctx.editMessageText(`Moved "${category.name}".`, { reply_markup: undefined });
    } catch (err) {
      await ctx.editMessageText(`Couldn't move it: ${(err as Error).message}`, { reply_markup: undefined });
    }
    await ctx.answerCallbackQuery();
    return;
  }

  await ctx.answerCallbackQuery({ text: "Nothing pending — start again.", show_alert: true });
}

async function handlePickM(ctx: AppContext, catId: number): Promise<void> {
  const flow = ctx.session.flow;
  if (!flow || flow.kind !== "movecat" || flow.step !== "await_source") {
    await ctx.answerCallbackQuery({ text: "Nothing pending — start again with /movecat.", show_alert: true });
    return;
  }
  ctx.session.flow = { kind: "movecat", step: "await_parent", categoryId: catId };
  const view = await browse(ctx.repos, 0, 0);
  await ctx.editMessageText("Where should it move to?", { reply_markup: browseKeyboard(view, "c") });
  await ctx.answerCallbackQuery();
}

export async function handlePick(ctx: AppContext, cb: Extract<Callback, { op: "p" }>): Promise<void> {
  if (cb.purpose === "c") return handlePickC(ctx, cb.catId);
  if (cb.purpose === "m") return handlePickM(ctx, cb.catId);
  if (cb.purpose === "e") return showEditMenu(ctx, cb.catId);

  const category = await ctx.repos.categories.byId(cb.catId);
  if (!category) {
    await ctx.answerCallbackQuery({ text: "That category no longer exists.", show_alert: true });
    return;
  }

  if (cb.purpose === "d") {
    await ctx.repos.users.setDefaultCategory(ctx.from!.id, category.id);
    await ctx.editMessageText(`Default topic set to "${category.name}".`, { reply_markup: undefined });
    await ctx.answerCallbackQuery();
    return;
  }

  if (cb.purpose === "a") {
    const flow = ctx.session.flow;
    if (!flow || flow.kind !== "addfact" || flow.step !== "await_category") {
      await ctx.answerCallbackQuery({ text: "Nothing pending — start again with /addfact.", show_alert: true });
      return;
    }
    ctx.session.flow = undefined;

    if (!ctx.isAdmin) {
      await ctx.editMessageText("Sent for review.", { reply_markup: undefined });
      await ctx.answerCallbackQuery();
      await submitForReview(ctx, "add_fact", { text: flow.text, categoryId: category.id, categoryName: category.name });
      return;
    }

    const { fact, duplicate } = await ctx.repos.facts.create(category.id, flow.text, flow.source, ctx.from!.id);
    await ctx.editMessageText(
      duplicate
        ? `Already have that fact (#${fact.id}) in "${category.name}".`
        : `Added to "${category.name}" (#${fact.id}).`,
      { reply_markup: undefined },
    );
    await ctx.answerCallbackQuery();
    return;
  }

  // purpose === "r": pick this category to read from now on.
  ctx.session.readingCategoryId = category.id;
  ctx.session.exhaustedNotified = false;
  await ctx.editMessageText(`Reading: ${category.name}`, { reply_markup: undefined });
  await ctx.answerCallbackQuery();
  await deliverFact(ctx, category);
}
