import type { Context, SessionFlavor } from "grammy";
import type { Repos } from "../db/repos";
// `Env` below is ambient/global (see src/env.ts), no import needed.

export type Flow =
  | { kind: "addfact"; step: "await_text" }
  | { kind: "addfact"; step: "await_category"; text: string; source: string | null }
  | { kind: "addcat"; step: "await_name" }
  | { kind: "addcat"; step: "await_parent"; name: string }
  | { kind: "movecat"; step: "await_source" }
  | { kind: "movecat"; step: "await_parent"; categoryId: number }
  | { kind: "editcat"; step: "await_target" }
  | { kind: "editcat"; step: "await_name"; categoryId: number };

export interface SessionData {
  flow?: Flow;
  readingCategoryId?: number; // subtree currently being read via /next; undefined = user's default
  lastFactMsgId?: number; // previous fact message, so its keyboard can be stripped
  exhaustedNotified?: boolean;
}

export type AppContext = Context &
  SessionFlavor<SessionData> & {
    repos: Repos;
    isAdmin: boolean;
    waitUntil: (p: Promise<unknown>) => void;
    env: Env;
  };
