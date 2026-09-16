import { Db } from "./client";
import { CategoriesRepo } from "./categories.repo";
import { FactsRepo } from "./facts.repo";
import { SeenRepo } from "./seen.repo";
import { UsersRepo } from "./users.repo";
import { StateRepo } from "./state.repo";
import { TokensRepo } from "./tokens.repo";
import { PendingChangesRepo } from "./pendingChanges.repo";

export interface Repos {
  categories: CategoriesRepo;
  facts: FactsRepo;
  seen: SeenRepo;
  users: UsersRepo;
  state: StateRepo;
  tokens: TokensRepo;
  pendingChanges: PendingChangesRepo;
}

export function makeRepos(d1: D1Database): Repos {
  const db = new Db(d1);
  return {
    categories: new CategoriesRepo(db),
    facts: new FactsRepo(db),
    seen: new SeenRepo(db),
    users: new UsersRepo(db),
    state: new StateRepo(db),
    tokens: new TokensRepo(db),
    pendingChanges: new PendingChangesRepo(db),
  };
}
