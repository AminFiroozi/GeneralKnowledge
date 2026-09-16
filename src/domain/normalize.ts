const encoder = new TextEncoder();

export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // strip combining diacritics
}

/** Truncates to at most `maxBytes` UTF-8 bytes without splitting a code point. */
export function clampUtf8Bytes(input: string, maxBytes: number): string {
  if (encoder.encode(input).length <= maxBytes) return input;
  let out = "";
  let bytes = 0;
  for (const ch of input) {
    const chBytes = encoder.encode(ch).length;
    if (bytes + chBytes > maxBytes) break;
    out += ch;
    bytes += chBytes;
  }
  return out;
}

/** Splits into atomic tokens for LIKE-escaping: `\`, `%`, `_` become 2-char
 * escape tokens, everything else is a single code point. Escaping token-wise
 * lets us clamp bytes afterwards without ever splitting an escape pair. */
function escapeLikeTokens(input: string): string[] {
  const tokens: string[] = [];
  for (const ch of input) {
    if (ch === "\\" || ch === "%" || ch === "_") {
      tokens.push(`\\${ch}`);
    } else {
      tokens.push(ch);
    }
  }
  return tokens;
}

const QUERY_MAX_BYTES = 40; // keeps '%' + escaped-query + '%' under D1's 50-byte LIKE pattern cap

/** Normalizes and LIKE-escapes a user search query, clamped so the final
 * `%...%` pattern never exceeds D1's 50-byte LIKE limit — even in the
 * worst case where every character needs a 2-byte escape. */
export function normalizeQuery(raw: string): string {
  const tokens = escapeLikeTokens(normalizeName(raw));
  let out = "";
  let bytes = 0;
  for (const token of tokens) {
    const tokenBytes = encoder.encode(token).length;
    if (bytes + tokenBytes > QUERY_MAX_BYTES) break;
    out += token;
    bytes += tokenBytes;
  }
  return out;
}

/** `raw`, normalized and escaped but not clamped or wrapped — used to build
 * a display label ("Results for '...'") where truncation isn't wanted. */
export function normalizeDisplay(raw: string): string {
  return normalizeName(raw);
}

export function likeInfixPattern(escapedQuery: string): string {
  return `%${escapedQuery}%`;
}

export function likePrefixPattern(escapedQuery: string): string {
  return `${escapedQuery}%`;
}

/** URL/slug-safe form of a category name, e.g. "Space & Astronomy" -> "space-astronomy". */
export function slugify(name: string): string {
  const base = normalizeName(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "category";
}

