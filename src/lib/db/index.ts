import { getCloudflareContext } from '@opennextjs/cloudflare';

// Cloudflare D1 access helpers.
// The async form of getCloudflareContext works in request handlers AND in static/ISR/build-time
// contexts, so every accessor here is async.

export type SqlParam = string | number | boolean | null;

export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env as unknown as CloudflareEnv;
}

export async function getDB(): Promise<D1Database> {
  return (await getEnv()).DB;
}

export async function dbQuery<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = []
): Promise<T[]> {
  const db = await getDB();
  const result = await db.prepare(sql).bind(...params).all<T>();
  return result.results;
}

export async function dbQueryOne<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = []
): Promise<T | null> {
  const db = await getDB();
  const result = await db.prepare(sql).bind(...params).first<T>();
  return result ?? null;
}

export async function dbRun(sql: string, params: SqlParam[] = []): Promise<D1Result> {
  const db = await getDB();
  return db.prepare(sql).bind(...params).run();
}

export interface DbStatement {
  sql: string;
  params?: SqlParam[];
}

/**
 * Runs several statements atomically via D1 batch(): they execute sequentially in one implicit
 * transaction, and if any statement fails the whole batch is rolled back (nothing is written).
 * Results are returned in statement order (use a trailing SELECT to read data back in the same round trip).
 */
export async function dbBatch<T = Record<string, unknown>>(statements: DbStatement[]): Promise<D1Result<T>[]> {
  if (statements.length === 0) return [];
  const db = await getDB();
  return db.batch<T>(statements.map((s) => db.prepare(s.sql).bind(...(s.params ?? []))));
}
