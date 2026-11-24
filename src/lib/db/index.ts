import { getCloudflareContext } from '@opennextjs/cloudflare';

// Cloudflare D1 access helpers. Replaces @/lib/supabase/server for database access.
// Must be called inside a request handler (getCloudflareContext is per-request).

export function getDB(): D1Database {
  const { env } = getCloudflareContext();
  return (env as unknown as CloudflareEnv).DB;
}

export function getEnv(): CloudflareEnv {
  const { env } = getCloudflareContext();
  return env as unknown as CloudflareEnv;
}

// Type-safe query helper
export async function dbQuery<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T[]> {
  const db = getDB();
  const result = await db.prepare(sql).bind(...params).all<T>();
  return result.results;
}

export async function dbQueryOne<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T | null> {
  const db = getDB();
  const result = await db.prepare(sql).bind(...params).first<T>();
  return result ?? null;
}

export async function dbRun(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<D1Result> {
  const db = getDB();
  return db.prepare(sql).bind(...params).run();
}
