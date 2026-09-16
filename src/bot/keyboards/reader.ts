import { InlineKeyboard } from "grammy";
import { encode } from "../../callback/codec";

/** Keyboard under a served fact: reels-style "just keep tapping" plus an
 * escape hatch to change topic. `catId` is the subtree being read (0 =
 * user's default category). */
export function readerKeyboard(catId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text("▶️ Next", encode({ op: "n", catId }))
    .text("🎲 Surprise me", encode({ op: "r", catId: 0 }))
    .row()
    .text("🔀 Change topic", encode({ op: "b", purpose: "r", catId: 0, page: 0 }));
}
