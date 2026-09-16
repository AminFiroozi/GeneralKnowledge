import type { Repos } from "../db/repos";
import type { Category } from "../domain/types";
import type { NextFactResult } from "../db/facts.repo";

/** Every category path starts with `/<digit>`, which sorts above `/` and
 * below `0` — so this half-open range matches every category in the tree,
 * used for the "surprise me from anywhere" random command. */
export const WHOLE_TREE_RANGE = { lo: "/", hi: "0" };

/** Resolves the fact-lookup range for a category, or `null` for "any category". */
export function rangeFor(category: Category | null, repos: Repos): { lo: string; hi: string } {
  return category ? repos.categories.subtreeRange(category) : WHOLE_TREE_RANGE;
}

export async function nextFact(
  repos: Repos,
  userId: number,
  category: Category | null,
): Promise<NextFactResult> {
  return repos.facts.nextForUser(rangeFor(category, repos), userId);
}
