import { InlineKeyboard } from "grammy";
import type { Category } from "../../domain/types";
import type { Purpose } from "../../callback/types";
import { encode } from "../../callback/codec";
import { addPaginationRow } from "./pagination";
import type { BrowseView, SearchView } from "../../services/categoryTree";

const COLUMNS = 2;

function categoryLabel(c: Category): string {
  return c.childCount > 0 ? `${c.name} ›` : c.name;
}

function addCategoryGrid(kb: InlineKeyboard, categories: Category[], purpose: Purpose): void {
  categories.forEach((c, i) => {
    // Parent categories drill down first; leaves are picked directly. A
    // parent's own subtree can still be picked via the "use this level"
    // button below the grid.
    const cb = c.childCount > 0
      ? { op: "b" as const, purpose, catId: c.id, page: 0 }
      : { op: "p" as const, purpose, catId: c.id };
    kb.text(categoryLabel(c), encode(cb));
    if (i % COLUMNS === COLUMNS - 1) kb.row();
  });
  if (categories.length % COLUMNS !== 0) kb.row();
}

export function browseKeyboard(view: BrowseView, purpose: Purpose): InlineKeyboard {
  const kb = new InlineKeyboard();
  addCategoryGrid(kb, view.page.items, purpose);

  if (view.current) {
    const pickLabel =
      purpose === "c"
        ? `✅ Make it a child of "${view.current.name}"`
        : purpose === "m"
          ? `✅ Move "${view.current.name}"`
          : purpose === "e"
            ? `✏️ Edit "${view.current.name}"`
            : `✅ Use "${view.current.name}" (incl. subtopics)`;
    kb.row().text(pickLabel, encode({ op: "p", purpose, catId: view.current.id }));
    kb.row().text("⬆️ Up", encode({ op: "u", purpose, catId: view.current.id, page: 0 }));
  } else if (purpose === "c") {
    // catId 0 at the root is a sentinel: "no parent" (top-level category).
    kb.row().text("📁 Top level (no parent)", encode({ op: "p", purpose, catId: 0 }));
  }

  addPaginationRow(kb, view.page, (page) => ({
    op: "b",
    purpose,
    catId: view.current?.id ?? 0,
    page,
  }));

  kb.row().text("✖️ Cancel", encode({ op: "x" }));
  return kb;
}

export function searchKeyboard(view: SearchView, token: string, purpose: Purpose): InlineKeyboard {
  const kb = new InlineKeyboard();
  addCategoryGrid(kb, view.page.items, purpose);
  addPaginationRow(kb, view.page, (page) => ({ op: "s", purpose, token, page }));
  kb.row().text("✖️ Cancel", encode({ op: "x" }));
  return kb;
}
