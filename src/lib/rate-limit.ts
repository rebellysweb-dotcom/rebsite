import { getEnv, dbQueryOne, dbRun } from '@/lib/db';

// Client IP: ONLY the Cloudflare-set header. x-real-ip / x-forwarded-for are client-controlled.
// Outside Cloudflare (local dev) everything shares one constant bucket.
export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip')?.trim() || 'dev-local';
}

interface RateLimitBinding {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface RateRule {
  limit: number;
  windowSec: number;
}

// Last-resort per-isolate fallback if neither the binding nor the D1 table is usable.
const memory = new Map<string, { count: number; start: number }>();

function memoryHit(key: string, rule: RateRule): boolean {
  const now = Date.now();
  const slot = memory.get(key);
  if (!slot || now - slot.start > rule.windowSec * 1000) {
    if (memory.size > 5000) memory.clear();
    memory.set(key, { count: 1, start: now });
    return true;
  }
  slot.count++;
  return slot.count <= rule.limit;
}

/**
 * Durable fixed-window limiter. Returns true when the request is allowed.
 *  1. D1 table `rate_limits` (durable, any window length, shared across isolates).
 *  2. In-memory fallback if D1 or the table is unavailable (logged).
 */
export async function hit(name: string, id: string, rule: RateRule): Promise<boolean> {
  const key = `${name}:${id}`;
  try {
    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - rule.windowSec;
    const row = await dbQueryOne<{ count: number }>(
      `INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN window_start <= ? THEN 1 ELSE count + 1 END,
         window_start = CASE WHEN window_start <= ? THEN ? ELSE window_start END
       RETURNING count`,
      [key, now, cutoff, cutoff, now]
    );
    if (Math.random() < 0.02) {
      // Opportunistic cleanup of expired windows (longest window used anywhere is 1 hour).
      await dbRun('DELETE FROM rate_limits WHERE window_start < ?', [now - 7200]).catch(() => undefined);
    }
    if (row) return row.count <= rule.limit;
  } catch (err) {
    console.error('rate_limits unavailable, using in-memory fallback:', err instanceof Error ? err.message : err);
  }
  return memoryHit(key, rule);
}

/** Optional Cloudflare ratelimit binding (burst guard, period must be 10 or 60 s). */
async function bindingAllows(id: string): Promise<boolean> {
  try {
    const binding = (getEnv() as unknown as { RATE_LIMITER?: RateLimitBinding }).RATE_LIMITER;
    if (!binding) return true;
    const { success } = await binding.limit({ key: id });
    return success;
  } catch {
    return true;
  }
}

/** Per-IP check: binding burst guard first, then the durable D1 counter. */
export async function rateLimitIp(request: Request, name: string, rule: RateRule): Promise<boolean> {
  const ip = clientIp(request);
  if (!(await bindingAllows(`${name}:${ip}`))) return false;
  return hit(name, ip, rule);
}
