import { session, type StorageAdapter, Context } from "grammy";
import type { StateRepo } from "../../db/state.repo";
import type { SessionData } from "../context";

function d1Storage(stateRepo: StateRepo): StorageAdapter<SessionData> {
  return {
    async read(key) {
      const data = await stateRepo.read(Number(key));
      return data ? (JSON.parse(data) as SessionData) : undefined;
    },
    async write(key, value) {
      await stateRepo.write(Number(key), JSON.stringify(value));
    },
    async delete(key) {
      await stateRepo.delete(Number(key));
    },
  };
}

export function sessionMiddleware(stateRepo: StateRepo) {
  return session<SessionData, Context>({
    initial: () => ({}),
    getSessionKey: (ctx) => ctx.from?.id.toString(),
    storage: d1Storage(stateRepo),
  });
}
