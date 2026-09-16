import type { Bot } from "grammy";
import type { AppContext } from "./context";
import { PUBLIC_COMMANDS, ADMIN_COMMANDS } from "./commands/commandList";

/** Registers Telegram's native "/" command menu: the default scope gets
 * the public list, and each admin's private chat gets public + admin
 * commands layered on top via BotCommandScopeChat. Run this once after
 * deploy and again whenever the command list changes — it's account
 * metadata, not per-update state, so it doesn't belong in middleware. */
export async function registerBotCommands(bot: Bot<AppContext>, adminIds: Set<number>): Promise<void> {
  await bot.api.setMyCommands(PUBLIC_COMMANDS);

  const fullList = [...PUBLIC_COMMANDS, ...ADMIN_COMMANDS];
  await Promise.all(
    [...adminIds].map((chatId) =>
      bot.api.setMyCommands(fullList, { scope: { type: "chat", chat_id: chatId } }).catch(() => {
        // Admin hasn't started a chat with the bot yet — Telegram rejects
        // a chat-scoped command list for an unknown chat_id. Harmless;
        // they'll get the default (public) list until they /start once,
        // and re-running this after that fixes it.
      }),
    ),
  );
}
