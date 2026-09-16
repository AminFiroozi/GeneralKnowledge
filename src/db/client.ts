export type Bindable = string | number | null;

export class Db {
  constructor(private readonly d1: D1Database) {}

  async one<T = Record<string, unknown>>(sql: string, ...args: Bindable[]): Promise<T | null> {
    const row = await this.d1
      .prepare(sql)
      .bind(...args)
      .first<T>();
    return row ?? null;
  }

  async many<T = Record<string, unknown>>(sql: string, ...args: Bindable[]): Promise<T[]> {
    const res = await this.d1
      .prepare(sql)
      .bind(...args)
      .all<T>();
    return res.results;
  }

  async run(sql: string, ...args: Bindable[]): Promise<D1Result> {
    return this.d1
      .prepare(sql)
      .bind(...args)
      .run();
  }

  statement(sql: string, ...args: Bindable[]): D1PreparedStatement {
    return this.d1.prepare(sql).bind(...args);
  }

  async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
    return this.d1.batch(statements);
  }
}
