/** Single source of truth for the bot's commands — feeds both /help text
 * and Telegram's command menu (BotCommandScopeDefault / per-admin
 * BotCommandScopeChat via setMyCommands). Command names must be lowercase
 * ASCII letters/digits/underscores, 1-32 chars; descriptions 1-256 chars
 * (Telegram's setMyCommands constraints). */
export interface CommandDescriptor {
  command: string;
  description: string;
}

export const PUBLIC_COMMANDS: CommandDescriptor[] = [
  { command: "start", description: "Start the feed" },
  { command: "feed", description: "Get another fact" },
  { command: "next", description: "Same as /feed" },
  { command: "surprise", description: "A fact from any category" },
  { command: "read", description: "Browse categories" },
  { command: "browse", description: "Same as /read" },
  { command: "search", description: "Search categories by name" },
  { command: "setdefault", description: "Choose your default topic" },
  { command: "me", description: "Your stats" },
  { command: "reset", description: "Forget what you've seen" },
  { command: "addfact", description: "Suggest a fact (reviewed if not admin)" },
  { command: "addcat", description: "Suggest a category (reviewed if not admin)" },
  { command: "editcat", description: "Rename/move a category (reviewed if not admin)" },
  { command: "help", description: "Show the command list" },
];

export const ADMIN_COMMANDS: CommandDescriptor[] = [
  { command: "movecat", description: "Change a category's parent" },
  { command: "delfact", description: "Hide a fact" },
  { command: "stats", description: "Bot-wide counts" },
  { command: "import", description: "Bulk-import facts from a .jsonl file" },
  { command: "pending", description: "List pending review requests" },
];
