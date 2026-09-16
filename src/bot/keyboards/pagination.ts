import { InlineKeyboard } from "grammy";
import type { Page } from "../../domain/types";
import type { Callback } from "../../callback/types";
import { encode } from "../../callback/codec";

/** Appends a ◀ page N/? ▶ row to `kb`, using `forPage` to build the
 * callback for a given page number. The middle button is a noop (`h`) —
 * it exists only to show the current page. */
export function addPaginationRow(
  kb: InlineKeyboard,
  page: Page<unknown>,
  forPage: (page: number) => Callback,
): InlineKeyboard {
  if (!page.hasPrev && !page.hasNext) return kb;
  kb.row();
  if (page.hasPrev) kb.text("◀", encode(forPage(page.page - 1)));
  kb.text(`· ${page.page + 1} ·`, encode({ op: "h" }));
  if (page.hasNext) kb.text("▶", encode(forPage(page.page + 1)));
  return kb;
}
