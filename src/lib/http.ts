import { NextResponse } from 'next/server';

export const MAX_JSON_BYTES = 32 * 1024;

export type JsonResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; response: NextResponse };

const fail = (status: number, error: string): JsonResult => ({
  ok: false,
  response: NextResponse.json({ error }, { status }),
});

/**
 * Reads a JSON object body safely: exact application/json, size capped (header and actual bytes),
 * and 400 (never 500) on malformed or non-object JSON.
 */
export async function readJsonBody(request: Request, maxBytes = MAX_JSON_BYTES): Promise<JsonResult> {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') return fail(400, 'Content-Type must be application/json');

  const declared = request.headers.get('content-length');
  if (declared !== null && Number(declared) > maxBytes) return fail(413, 'Request body too large');

  let text = '';
  if (request.body) {
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return fail(413, 'Request body too large');
      }
      chunks.push(value);
    }
    const all = new Uint8Array(size);
    let offset = 0;
    for (const c of chunks) {
      all.set(c, offset);
      offset += c.byteLength;
    }
    text = new TextDecoder().decode(all);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail(400, 'Invalid JSON body');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return fail(400, 'JSON body must be an object');
  }
  return { ok: true, body: parsed as Record<string, unknown> };
}

/** Strips CR/LF/control characters (header and subject injection). */
export function stripControl(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').trim();
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function isValidEmail(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);
}
