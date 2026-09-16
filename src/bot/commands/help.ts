import type { AppContext } from "../context";

const PUBLIC_HELP = `<b>Commands</b>
/feed or /next — another fact from your current topic
/read or /browse — browse categories
/search &lt;text&gt; — search categories by name
/setdefault — choose your default topic
/me — your stats
/reset — forget what you've seen (start a topic over)
/help — this message`;

const ADMIN_HELP = `

<b>Admin</b>
/addfact — add a fact
/addcat &lt;name&gt; — add a category
/movecat — change a category's parent
/editcat — rename a category or change its parent
/delfact &lt;id&gt; — hide a fact
/stats — bot-wide counts
/import — reply to a .jsonl file to bulk-import facts`;

export async function helpCommand(ctx: AppContext): Promise<void> {
  const text = PUBLIC_HELP + (ctx.isAdmin ? ADMIN_HELP : "");
  await ctx.reply(text, { parse_mode: "HTML" });
}
