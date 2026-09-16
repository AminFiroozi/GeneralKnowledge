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
  { command: "help", description: "Show the command list" },
];

export const ADMIN_COMMANDS: CommandDescriptor[] = [
  { command: "addfact", description: "Add a fact" },
  { command: "addcat", description: "Add a category" },
  { command: "movecat", description: "Change a category's parent" },
  { command: "editcat", description: "Rename or move a category" },
  { command: "delfact", description: "Hide a fact" },
  { command: "stats", description: "Bot-wide counts" },
  { command: "import", description: "Bulk-import facts from a .jsonl file" },
];
