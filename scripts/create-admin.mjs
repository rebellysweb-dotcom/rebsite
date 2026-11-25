// Creates (or re-promotes / resets the password of) the first admin user. Public sign-up is disabled in
// src/lib/auth/index.ts, so this is the only way to get an account.
//
// The password is hashed HERE with Better Auth's own hashPassword (scrypt, same format sign-in verifies);
// only the hash is written to D1 (via wrangler d1 execute). Credentials come from the environment, never from the repo.
//
// PowerShell, local D1 (default):
//   $env:ADMIN_EMAIL_NEW = "owner@example.com"; $env:ADMIN_PASSWORD_NEW = "at-least-10-chars"
//   node scripts/create-admin.mjs --local
// Remote (production) D1, only when you mean it:
//   node scripts/create-admin.mjs --remote
// Optional: ADMIN_NAME_NEW (display name), --persist-to <dir> (local only, matches `wrangler dev --persist-to`).
// Afterwards clear the variables:  Remove-Item Env:ADMIN_PASSWORD_NEW
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';

const args = process.argv.slice(2);
const remote = args.includes('--remote');
if (remote && args.includes('--local')) throw new Error('Choose --local or --remote, not both.');
const persistIdx = args.indexOf('--persist-to');
const persist = persistIdx >= 0 ? args[persistIdx + 1] : null;

const email = (process.env.ADMIN_EMAIL_NEW ?? '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD_NEW ?? '';
const name = (process.env.ADMIN_NAME_NEW ?? 'Admin').trim() || 'Admin';
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set ADMIN_EMAIL_NEW to a valid email.');
if (password.length < 10) throw new Error('Set ADMIN_PASSWORD_NEW (minimum 10 characters, same as the auth config).');

const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
const id = randomBytes(16).toString('hex');
const now = new Date().toISOString();
const hash = await hashPassword(password);

const sql = `
INSERT INTO "user" ("id","name","email","emailVerified","createdAt","updatedAt","role")
VALUES (${q(id)}, ${q(name)}, ${q(email)}, 1, ${q(now)}, ${q(now)}, 'admin')
ON CONFLICT("email") DO UPDATE SET "role" = 'admin', "updatedAt" = excluded."updatedAt";

DELETE FROM "account" WHERE "providerId" = 'credential' AND "userId" = (SELECT "id" FROM "user" WHERE "email" = ${q(email)});
INSERT INTO "account" ("id","accountId","providerId","userId","password","createdAt","updatedAt")
SELECT ${q(randomBytes(16).toString('hex'))}, "id", 'credential', "id", ${q(hash)}, ${q(now)}, ${q(now)}
FROM "user" WHERE "email" = ${q(email)};

-- Invalidate any old sessions for this user (password reset case).
DELETE FROM "session" WHERE "userId" = (SELECT "id" FROM "user" WHERE "email" = ${q(email)});
`;

const dir = mkdtempSync(join(tmpdir(), 'rebellys-admin-'));
const file = join(dir, 'create-admin.sql');
try {
  writeFileSync(file, sql, 'utf8');
  const wranglerArgs = ['wrangler', 'd1', 'execute', 'rebellys-db', remote ? '--remote' : '--local', '--file', file];
  if (!remote && persist) wranglerArgs.push('--persist-to', persist);
  console.log(`Creating admin ${email} on ${remote ? 'REMOTE' : 'local'} D1 ...`);
  const r = spawnSync('npx', wranglerArgs, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) process.exitCode = r.status ?? 1;
  else console.log('Done. Sign in at /admin/login.');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
