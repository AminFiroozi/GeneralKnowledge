import type { Repos } from "../db/repos";
import type { Category, Page } from "../domain/types";
import { normalizeQuery } from "../domain/normalize";

export interface BrowseView {
  current: Category | null; // null = root level
  page: Page<Category>;
}

/** One level of the category browser: root (catId 0) or a category's
 * direct children, alongside that category itself (for the "up" button
 * and breadcrumb label). */
export async function browse(repos: Repos, catId: number, page: number): Promise<BrowseView> {
  if (catId === 0) {
    return { current: null, page: await repos.categories.topLevel(page) };
  }
  const current = await repos.categories.byId(catId);
  if (!current) throw new Error(`category ${catId} not found`);
  return { current, page: await repos.categories.children(catId, page) };
}

/** Mints a token for a fresh search query. The keyboard only ever carries
 * the token (search strings don't reliably fit in a 64-byte callback_data). */
export async function startSearch(repos: Repos, userId: number, rawQuery: string): Promise<string> {
  const escaped = normalizeQuery(rawQuery);
  return repos.tokens.mint(userId, "search", escaped);
}

export interface SearchView {
  query: string; // the escaped query backing this token, for display/re-use
  page: Page<Category>;
}

export async function searchPage(repos: Repos, token: string, page: number): Promise<SearchView | null> {
  const resolved = await repos.tokens.resolve(token);
  if (!resolved || resolved.kind !== "search") return null;
  return { query: resolved.payload, page: await repos.categories.search(resolved.payload, page) };
}
