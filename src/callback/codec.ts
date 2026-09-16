import type { Callback, EditAction, Purpose } from "./types";

export const MAX_CALLBACK_BYTES = 64; // Telegram's callback_data hard limit
const VERSION = "1";
const PURPOSES = new Set<Purpose>(["r", "a", "d", "c", "m", "e"]);
const EDIT_ACTIONS = new Set<EditAction>(["n", "m"]);
const TOKEN_RE = /^[0-9a-z]{1,16}$/;

function isPurpose(x: string): x is Purpose {
  return PURPOSES.has(x as Purpose);
}

function isEditAction(x: string): x is EditAction {
  return EDIT_ACTIONS.has(x as EditAction);
}

function parseIntStrict(x: string | undefined): number | null {
  if (x === undefined || x === "" || !/^\d+$/.test(x)) return null;
  const n = Number(x);
  return Number.isSafeInteger(n) ? n : null;
}

/** Serializes a Callback to a `callback_data` string. Throws if it would
 * exceed Telegram's 64-byte limit — a signal to shorten the grammar or the
 * token, never to swallow silently. */
export function encode(cb: Callback): string {
  let s: string;
  switch (cb.op) {
    case "b":
      s = `${VERSION}:b:${cb.purpose}:${cb.catId}:${cb.page}`;
      break;
    case "s":
      s = `${VERSION}:s:${cb.purpose}:${cb.token}:${cb.page}`;
      break;
    case "p":
      s = `${VERSION}:p:${cb.purpose}:${cb.catId}`;
      break;
    case "u":
      s = `${VERSION}:u:${cb.purpose}:${cb.catId}:${cb.page}`;
      break;
    case "n":
      s = `${VERSION}:n:${cb.catId}`;
      break;
    case "r":
      s = `${VERSION}:r:${cb.catId}`;
      break;
    case "x":
      s = `${VERSION}:x`;
      break;
    case "h":
      s = `${VERSION}:h`;
      break;
    case "z":
      s = `${VERSION}:z`;
      break;
    case "e":
      s = `${VERSION}:e:${cb.action}:${cb.catId}`;
      break;
  }
  const bytes = new TextEncoder().encode(s).length;
  if (bytes > MAX_CALLBACK_BYTES) {
    throw new Error(`callback_data ${bytes}B exceeds ${MAX_CALLBACK_BYTES}B limit: ${s}`);
  }
  return s;
}

/** Parses `callback_data` back into a Callback. Never throws — hostile or
 * corrupted input (stale keyboard, manual API poke) yields null so callers
 * can answer the callback query with a friendly "expired" message. */
export function decode(raw: string): Callback | null {
  if (new TextEncoder().encode(raw).length > MAX_CALLBACK_BYTES) return null;
  const parts = raw.split(":");
  if (parts[0] !== VERSION) return null;
  const op = parts[1];

  switch (op) {
    case "b":
    case "u": {
      const purpose = parts[2];
      const catId = parseIntStrict(parts[3]);
      const page = parseIntStrict(parts[4]);
      if (!purpose || !isPurpose(purpose) || catId === null || page === null) return null;
      return { op, purpose, catId, page };
    }
    case "s": {
      const purpose = parts[2];
      const token = parts[3];
      const page = parseIntStrict(parts[4]);
      if (!purpose || !isPurpose(purpose) || !token || !TOKEN_RE.test(token) || page === null)
        return null;
      return { op: "s", purpose, token, page };
    }
    case "p": {
      const purpose = parts[2];
      const catId = parseIntStrict(parts[3]);
      if (!purpose || !isPurpose(purpose) || catId === null) return null;
      return { op: "p", purpose, catId };
    }
    case "n":
    case "r": {
      const catId = parseIntStrict(parts[2]);
      if (catId === null) return null;
      return { op, catId };
    }
    case "x":
      return { op: "x" };
    case "h":
      return { op: "h" };
    case "z":
      return { op: "z" };
    case "e": {
      const action = parts[2];
      const catId = parseIntStrict(parts[3]);
      if (!action || !isEditAction(action) || catId === null) return null;
      return { op: "e", action, catId };
    }
    default:
      return null;
  }
}
