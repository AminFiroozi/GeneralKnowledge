import { Bot, type BotConfig } from "grammy";
import type { UserFromGetMe } from "grammy/types";
import { parseAdminIds } from "../env";
import type { AppContext } from "./context";
import { depsMiddleware } from "./middleware/deps";
import { sessionMiddleware } from "./middleware/session";
import { ensureUser } from "./middleware/ensureUser";
import { adminOnly } from "./middleware/adminOnly";
import { installErrorHandler } from "./middleware/errors";
import { installCallbackRouter } from "./callbacks/router";

import { startCommand } from "./commands/start";
import { helpCommand } from "./commands/help";
import { feedCommand, surpriseCommand } from "./commands/feed";
import { readCommand } from "./commands/read";
import { browseCommand } from "./commands/browse";
import { searchCommand } from "./commands/search";
import { setDefaultCommand } from "./commands/setdefault";
import { meCommand } from "./commands/me";
import { resetCommand } from "./commands/resetSeen";

import { addFactCommand, addFactTextHandler } from "./commands/admin/addfact";
import { addCategoryCommand, addCategoryTextHandler } from "./commands/admin/addcategory";
import { moveCategoryCommand } from "./commands/admin/movecategory";
import { editCategoryCommand, editCategoryTextHandler } from "./commands/admin/editcategory";
import { delFactCommand } from "./commands/admin/delfact";
import { statsCommand } from "./commands/admin/stats";
import { importCommand } from "./commands/admin/import";

import { MAIN_MENU } from "./keyboards/mainMenu";
import {
  onMenuNext,
  onMenuSurprise,
  onMenuBrowse,
  onMenuSearchPrompt,
  onMenuDefaultTopic,
  onMenuMe,
  onMenuReset,
  onMenuHelp,
  searchPromptTextHandler,
} from "./commands/mainMenuActions";

import { makeRepos } from "../db/repos";
import { StateRepo } from "../db/state.repo";
import { Db } from "../db/client";

export function createBot(env: Env, execCtx: ExecutionContext): Bot<AppContext> {
  const botInfo = JSON.parse(env.BOT_INFO) as UserFromGetMe;
  const stateRepo = new StateRepo(new Db(env.DB));
  const adminIds = parseAdminIds(env.ADMIN_IDS);

  const config: BotConfig<AppContext> = { botInfo };
  const bot = new Bot<AppContext>(env.BOT_TOKEN, config);

  bot.use(sessionMiddleware(stateRepo));
  bot.use(depsMiddleware(env, adminIds, execCtx));
  bot.use(ensureUser);

  // Public commands
  bot.command("start", startCommand);
  bot.command("help", helpCommand);
  bot.command(["feed", "next"], feedCommand);
  bot.command("surprise", surpriseCommand);
  bot.command("read", readCommand);
  bot.command("browse", browseCommand);
  bot.command("search", searchCommand);
  bot.command("setdefault", setDefaultCommand);
  bot.command("me", meCommand);
  bot.command("reset", resetCommand);

  // Admin commands
  bot.command("addfact", adminOnly, addFactCommand);
  bot.command("addcat", adminOnly, addCategoryCommand);
  bot.command("movecat", adminOnly, moveCategoryCommand);
  bot.command("editcat", adminOnly, editCategoryCommand);
  bot.command("delfact", adminOnly, delFactCommand);
  bot.command("stats", adminOnly, statsCommand);
  bot.command("import", adminOnly, importCommand);

  // Persistent reply-keyboard taps (mainMenu.ts). Registered before the
  // flow-continuation handlers below: a menu tap always supersedes a
  // pending admin flow rather than being swallowed as its text input.
  bot.hears(MAIN_MENU.next, onMenuNext);
  bot.hears(MAIN_MENU.surprise, onMenuSurprise);
  bot.hears(MAIN_MENU.search, onMenuSearchPrompt);
  bot.hears(MAIN_MENU.browse, onMenuBrowse);
  bot.hears(MAIN_MENU.defaultTopic, onMenuDefaultTopic);
  bot.hears(MAIN_MENU.me, onMenuMe);
  bot.hears(MAIN_MENU.reset, onMenuReset);
  bot.hears(MAIN_MENU.help, onMenuHelp);

  // Multi-step flows continue on the next plain-text message.
  bot.on(
    "message:text",
    searchPromptTextHandler,
    addFactTextHandler,
    addCategoryTextHandler,
    editCategoryTextHandler,
  );

  installCallbackRouter(bot);
  installErrorHandler(bot);

  return bot;
}

// Re-exported for scripts/tests that need repos without a full bot (e.g. seeding checks).
export { makeRepos };
