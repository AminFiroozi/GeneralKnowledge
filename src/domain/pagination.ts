import type { Page } from "./types";

/**
 * Turns a fetch of up to `pageSize + 1` rows (offset = page * pageSize) into
 * a Page<T>: trims the sentinel row and derives hasNext/hasPrev. Callers
 * should query with `LIMIT pageSize + 1 OFFSET page * pageSize`.
 */
export function toPage<T>(rows: T[], page: number, pageSize: number): Page<T> {
  const hasNext = rows.length > pageSize;
  const items = hasNext ? rows.slice(0, pageSize) : rows;
  return {
    items,
    page,
    hasNext,
    hasPrev: page > 0,
  };
}

export function clampPage(page: number): number {
  if (!Number.isInteger(page) || page < 0) return 0;
  return page;
}

export function offsetFor(page: number, pageSize: number): number {
  return clampPage(page) * pageSize;
}
