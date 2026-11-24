# Rebellys — Security Audit (static), 2026-11-24

Scope: Part A (orders, contact, middleware, supabase/server, 18 admin API handlers), Part B (schema.d1.sql, rls-policies.ts, db/index.ts), Part C (app-level RLS). Static review plus `npm audit --package-lock-only`. Semgrep is not installed, so it was not run.

## CRITICAL

**C1. The locked Next.js 16.2.9 has unauthenticated RCE advisories.** `package-lock.json:8671`, `next.config.mjs:7`
`npm audit` (run this session) reports critical advisories against the locked version, including:
- GHSA-2xp9-vwfh-vxw4: RCE in the Image Optimization API when AVIF is used. The app turns on `formats: ['image/avif', ...]`.
- GHSA-2464-fhr4-w9xw: RCE via SVG in the Image Optimization API.
- GHSA-673q-mjm6-r5xr: RCE in `use cache` functions.
- GHSA-6gpp-xcg3-4w24: Middleware/Proxy bypass (high).

Fixed ranges go up to `<=16.4.4`. Whether the OpenNext/Workers runtime exposes Next's own image optimizer was not checked.
Fix: upgrade `next` to the first patched release above 16.4.4 and regenerate the lockfile. The lockfile is also stale: `@opennextjs/cloudflare` is in package.json but missing from the lock. Until the upgrade ships, narrow `images.remotePatterns` (see M10).

Checked items from the CRITICAL list that came back clean:
- No auth bypass in the current code.
- No SQL injection.
- All 18 admin handlers call `requireAdmin` (`src/lib/admin-auth.ts`), which loads the role server-side with the service client.
- No secrets in client code: only the anon key is public, by design.
- No hardcoded secrets in source or git history (7 commits scanned). `.env.local` and `.dev.vars` are gitignored and untracked.
- CSRF is rated MEDIUM (M5), not CRITICAL, because SameSite cookies mitigate it.

## HIGH

**H1. The D1 authorization layer is not wired up. This blocks the migration.** `cloudflare/rls-policies.ts`, `src/lib/db/index.ts`
- `rls-policies.ts` is imported nowhere.
- `dbQuery`, `dbQueryOne` and `dbRun` have no callers.
- No D1 session or auth code exists. `src/middleware.ts` and `requireAdmin` still depend on Supabase.
- Once Supabase is removed, nothing enforces access. Today every admin query is checked twice: `requireAdmin` plus Postgres RLS through the user-scoped client. On D1 only one check is left.

Fix: add one wrapper, `withAuth(handler, { role: 'admin' })`. It verifies the session, re-reads `role` from D1 on every request (never from the token or body), and passes the identity to the service layer. Only the service layer may import `getDB`; enforce that with an ESLint `no-restricted-imports` rule. Add a test that walks every `src/app/api/**/route.ts` export and checks it is wrapped.

**H2. `canReadOwnOrder` and `canReadOwnProfile` allow access when the ids are `undefined`.** `cloudflare/rls-policies.ts:51`, `:67`
```ts
if (orderUserId !== null && userId !== '' && userId === orderUserId) return allow();
```
Take a guest caller (`userId` is `undefined`) and an order row selected without its `user_id` column (`orderUserId` is `undefined`). Then `undefined !== null`, `undefined !== ''` and `undefined === undefined` are all true, so the call returns allow. That is an IDOR on any order. `canReadOwnProfile` has the same flaw. TypeScript types do not stop this at runtime.
Fix:
```ts
if (typeof userId === 'string' && userId.length > 0 && typeof orderUserId === 'string' && userId === orderUserId) return allow();
```

**H3. Role escalation through INSERT, plus two role columns.** `cloudflare/schema.d1.sql:12`, `:23`, `:29-35`
- The `lock_profile_role` trigger fires only on `BEFORE UPDATE OF role ON profiles`. An INSERT with `role = 'admin'` is accepted. `handle_new_user()` was dropped, so registration code now inserts the profile row itself. If it spreads the request body, any user can register as admin.
- `users.role` has no lock at all.
- Role lives in both `users.role` and `profiles.role`. The seed comment says the app reads `profiles.role`; a new auth library will likely read `users.role`. That is two sources of truth.

Fix: keep a single `role` column, in `users`. Add `BEFORE INSERT` and `BEFORE UPDATE OF role` triggers on it that reject `'admin'` unless the change comes through a controlled migration or admin path. Registration code must hard-code `role = 'customer'`.

**H4. The order rate limiter can be bypassed and does not work on Workers.** `src/app/api/orders/route.ts:13-35`
- The limit is an in-memory `Map` per isolate, so separate Workers isolates do not share counts.
- The IP comes from `x-real-ip`, then the first entry of `x-forwarded-for`. On Cloudflare the client controls both. Cloudflare's trusted header is `CF-Connecting-IP`. An attacker who rotates `x-real-ip` gets unlimited orders. Confirm on the deployed Worker.

Fix: use a Workers Rate Limiting binding or a Durable Object keyed on `CF-Connecting-IP`, and ignore client-supplied IP headers.

**H5. `/api/contact` has no rate limit.** `src/app/api/contact/route.ts:8`
Anyone can flood the admin inbox and burn the Resend quota. Fix: apply the same limiter as H4, add a honeypot field or Turnstile, and enforce a body size cap.

**H6. Line items come from the client, so the order flow works as a branded email relay.** `src/app/api/orders/route.ts:200-239`, `src/lib/resend.ts:34`, `:155`
The H-1 fix covers `total_usd` only. These still come from the client: `item.name`, `item.image_url` (any `*.supabase.co` host, including an attacker's own project), `item.event_id`, and `item.price_usd`. The emails are built from `fullOrder = { ...orderData, items }`, so they show client prices per line.

Two attacks follow:
- Order the cheapest product id with the label "Premium 100-rose box". The admin sees the attacker's name and line prices.
- Point `customer_email` at any victim. They receive a rebellys.com-branded email with attacker text, which combined with H4 makes the shop a spam relay.

Fix: build each order item from the DB row (name, image, price, event_id). Pass those server-built items to the emails. Ignore every client item field except `id`, `quantity` and `is_event_product`.

**H7. Security headers will be lost on Cloudflare.** `next.config.mjs:26`, `vercel.json:2-19`
CSP, HSTS, X-Frame-Options and the rest live only in `vercel.json`, which Workers ignores. The CSP also lists Supabase, not R2.
Fix: move the headers into `async headers()` in `next.config.mjs` and update `img-src` and `connect-src` for R2.

## MEDIUM

**M1. Free-text order fields are not validated.** `orders/route.ts:52-67`, `:175-186`
`delivery_address`, `delivery_area`, `delivery_date`, `delivery_time`, `occasion`, `card_message` and `notes` accept any type and any length, and there is no request body size cap. rls-policies.ts:58 itself requires Zod here, and none is present. Fix: one Zod schema with `.max()` on every string, `delivery_date` as an ISO date, and `Content-Length` rejected above 32 KB.

**M2. Validation runs after the insert, leaving orphan orders.** `orders/route.ts:200-214`
The `item.name` and `image_url` checks run after the order row is inserted at line 170. A 400 response leaves that row behind with no rollback. Fix: validate everything before the first write. On D1, use `db.batch()` so the order and its items commit atomically.

**M3. Inactive or unpriced products can be ordered for $0.** `orders/route.ts:127-157`
The lookup has no `is_active` filter and ignores event active windows. `priceMap.get(id) ?? 0` turns a null price into a $0 line. Fix: filter `is_active = 1` and active events, and reject items whose price is null.

**M4. HTML injection in the contact email to the admin.** `contact/route.ts:34`
`${email}` is not escaped, and `EMAIL_RE` allows `<a/href=//evil.example>x</a>@a.co`. Fix: run `email` through the same `esc()` used in `resend.ts`, and also escape `&` and `"` in name and message.

**M5. No CSRF and Origin check on state-changing routes.** These are the admin POST, PATCH and DELETE handlers and `/api/orders`.
- Protection relies on SameSite only. `server.ts:21` forces `strict`, but `src/middleware.ts:16-17` re-sets the refreshed cookies with the library default options, so the effective SameSite is not reliably strict.
- Admin handlers call `request.json()` without checking Content-Type, so a cross-site `text/plain` form body is parsed.

Fix: in middleware, reject non-GET requests whose `Origin` is not on an allowlist, and require `application/json`. The new D1 auth must set `SameSite=Lax` or `Strict`, `HttpOnly` and `Secure` explicitly.

**M6. User email uniqueness is case-sensitive.** `schema.d1.sql:10`
`Admin@x.com` and `admin@x.com` can be separate accounts, which enables account confusion. Fix: `email TEXT NOT NULL UNIQUE COLLATE NOCASE` and normalise to lowercase in code.

**M7. No value constraints on money or quantity.** `schema.d1.sql:46`, `:76`, `:102`, `:114-115`, `admin/products/[id]/route.ts:69-74`
Nothing stops a negative price or quantity. The admin PATCH writes `price_usd`, `is_active` and `sort_order` with no type check. Fix: add `CHECK (price_usd IS NULL OR price_usd >= 0)`, `CHECK (quantity BETWEEN 1 AND 100)` and `CHECK (total_usd >= 0)`, and validate types in the route.

**M8. The new auth has no supporting tables (A07/A09).** `schema.d1.sql`
`password_hash` exists, but there are no session, login-attempt/lockout or admin audit-log tables. Fix: add `sessions` (hashed token, expiry, revocation), `auth_attempts`, and an append-only `audit_log` written on every admin mutation.

**M9. The CSP allows `script-src 'unsafe-inline'`.** `vercel.json:16`
This weakens XSS protection. Fix: when the headers move (H7), switch to nonce-based CSP.

**M10. The image `remotePatterns` wildcard covers every R2 account.** `next.config.mjs:13`
`pub-*.r2.dev` matches any Cloudflare account's public bucket, so `/_next/image` can proxy attacker-hosted images. Combined with C1, that is an RCE delivery path. Fix: use the exact bucket hostname or `images.rebellys.com` only.

## LOW

**L1. Schema and route enum mismatches (A10).** Each causes runtime 500s:
- The `payment_method` CHECK (`schema.d1.sql:99`) has no `card` or `transfer`, which `orders/route.ts:96` accepts.
- The `payment_status` CHECK (`:100`) has no `refunded`, which `admin/orders/[id]/route.ts:70` allows.
- `settings/route.ts:61` uses `.eq('id', 1)` against a TEXT UUID primary key. Enforce a singleton instead.

**L2. `db/index.ts` helpers cannot stop SQL string interpolation, and the import is wrong.**
- The helpers bind parameters correctly, so there is no injection in the helpers themselves. But they take any raw `sql` string, so a caller can still interpolate. Fix: a tagged-template query API that turns each interpolation into a bound `?`, plus a lint rule banning template literals passed to `prepare()`.
- The file imports `@cloudflare/next-on-pages`, which is not a dependency. The build uses `@opennextjs/cloudflare`, so the import should be `getCloudflareContext`.

**L3. The rate-limit `Map` grows without bound.** `orders/route.ts:13` (memory growth). The H4 fix replaces it.

**L4. A duplicate `middleware.ts` sits at the repo root.** With `src/` present, Next uses `src/middleware.ts`, so the root file is dead code and confusing. Delete it. Next 16 renames `middleware` to `proxy`; confirm against the docs when migrating.

**L5. bcrypt cost 12 may not fit Workers.** `seed.d1.sql:3-9`
The seed uses bcrypt cost 12, and in pure JS that may exceed the Workers CPU budget, which creates pressure to lower the cost. Fix: PBKDF2-SHA256 via WebCrypto at 600k iterations (OWASP), or measure bcryptjs CPU time. Password verification must fail closed on a malformed hash such as `REPLACE_WITH_BCRYPT_HASH`.

**L6. The order response returns the full DB row.** `orders/route.ts:260` returns `order: orderData`, including `user_id` and internal flags. Fix: return only `orderNumber` and the total.

**L7. Dev-dependency advisories.** `eslint-config-next@14` (mismatched with Next 16), `glob`, `brace-expansion`, `js-yaml`, `postcss`, `sharp` and others: 9 high, 9 moderate. Mostly build-time. Fix: upgrade with the C1 bump.

## Part C answers

1. **Do any routes query the DB without calling an RLS check?** Every route does, in the sense that no route uses D1 or `rls-policies.ts` yet (H1). On Supabase, all 18 admin handlers call `requireAdmin`. `/api/orders` uses the service role with no check, which is by design for guest checkout.
2. **Is admin-only access enforced consistently?** Yes on Supabase: `requireAdmin` plus middleware plus `admin/layout.tsx`. The earlier dev backdoor cookie is no longer present. On D1 there is no pattern yet.
3. **Is POST /api/orders rate-limited and validated?** Only partly. The limiter can be bypassed (H4), the free-text fields are unvalidated (M1), and validation runs after the insert (M2).
4. **IDOR?** None live, because no user-facing order or account read route exists (no `/account` pages). The latent IDOR is in `canReadOwnOrder` (H2).
5. **SQL injection in parameterized queries?** None. `db/index.ts` binds every parameter, and the admin search strips `%_,()` before the PostgREST `.or()`. The remaining risk is future string interpolation (L2).

## Coverage
```
WSTG-CONF (Config/Headers):      Complete
WSTG-ATHN (Authentication):      Partial  (Supabase auth only; no D1 auth code exists yet)
WSTG-AUTHZ (Authorization/RLS):  Complete (in-scope routes + rls-policies.ts)
WSTG-SESS (Session Management):  Partial  (cookie options reviewed; no D1 session code)
WSTG-INPV (Input Validation):    Complete for in-scope routes
WSTG-ERRH (Error Handling):      Partial
WSTG-CLNT (Client-Side):         Skipped  (pages/components out of scope; JsonLd uses safeJsonLd)
Supply Chain:                     Partial  (npm audit on a stale lockfile; GitHub Actions not reviewed)
Secret Detection:                 Complete (working tree + full git history, 7 commits)
```
Not reviewed:
- Admin events handlers (only their auth calls were checked).
- `/auth/login`.
- Client components.
- The live Supabase RLS state.
- R2 upload code (none exists yet).
- Semgrep (not installed).
