# Rebellys — Full Site Audit

## 1. Executive Summary

Rebellys is a functionally complete Next.js 14 (App Router) + Supabase + Resend florist storefront for a Zalka, Lebanon shop, with a genuinely strong accessibility and image-optimization baseline (focus-trapped modals, `next/image` with blur placeholders, correct AVIF/WebP config). The recent session changes are verified correct at the code level: ordering is now login-gated server-side, the order rollback works, the open-redirect guard on `?redirectTo=` is present, and migrations 0002/0003 implement the right RLS patterns (`is_admin()` `SECURITY DEFINER` + role-escalation trigger). **The single most urgent functional defect is the Whish payment modal showing `$0` / `0 LL` to every customer** (a payment-trust break), followed by a cluster of broken user-facing flows: a success page that falsely promises a confirmation email that is never sent, a default post-login redirect to a non-existent `/account` (404), and a contact form that fakes success while silently discarding messages. On the security side, the known dev backdoor cookie and a stale `supabase/schema.sql` (which would re-open the guest-checkout RLS hole if applied) are the items that must be resolved before production; **good news: `next ^14.2.35` is already patched against CVE-2025-29927**, and `vercel.json` ships a solid header set. SEO has several high-value data-consistency bugs (placeholder phone, false Sunday hours, noindex-in-sitemap). The committed Lighthouse report was captured against `localhost` dev and must be disregarded as a production baseline.

| Severity | Count |
|---|---|
| CRITICAL | 1 |
| HIGH | 11 |
| MEDIUM | 21 |
| LOW | 16 |
| INFO | 9 |
| **Total** | **58** |

> Note: `next ^14.2.35` in `package.json` is **already >= 14.2.25**, so CVE-2025-29927 (middleware auth-bypass) is patched. It is not counted as an open finding; it is verified as satisfied in the standards map.

---

## 2. Top Priorities (highest-impact, fix first)

| # | Severity | Item | File:Line | One-line fix |
|---|---|---|---|---|
| 1 | **CRITICAL** | Whish modal shows `$0` / `0 LL` as the amount to pay | `src/app/checkout/CheckoutClient.tsx:291`; `WhishModal.tsx:28,168,173,177` | Capture `const paid = totalUsd()` before `clearCart()` and pass `totalUsd={paid}` to the modal (or hide the amount card). |
| 2 | **HIGH** | Dev backdoor cookie `admin-backdoor=rebellys-dev-2026` bypasses admin auth | `src/app/admin/layout.tsx:13-16,20,43-45` | Delete the backdoor block; add a CI grep guard for the literal string. |
| 3 | **HIGH** | Stale `supabase/schema.sql` still has guest-checkout RLS (`with check (true)`); reapplying it reopens the hole | `supabase/schema.sql:141-142,169-170` vs `supabase-schema.sql` | Delete `supabase/schema.sql` (or replace with a pointer); keep root `supabase-schema.sql` + numbered migrations as canonical. |
| 4 | **HIGH** | Success page falsely claims "We've sent a confirmation email" — no email field collected, email never sends | `success/page.tsx:17`; `CheckoutClient.tsx:22-28`; `resend.ts:19` | Remove the email claim, or add an email field and wire it through to `/api/orders`. |
| 5 | **HIGH** | Default post-login redirect targets non-existent `/account` → 404 right after sign-in | `auth/login/page.tsx:21`; `GoogleSignInButton.tsx:13` | Create `/account` or change both defaults to `/` or `/collections`. |
| 6 | **HIGH** | Contact form is a stub that fakes success and discards messages | `contact/ContactForm.tsx:28-37` (no `/api/contact` route) | Wire to a real `/api/contact` Resend route, or replace with a WhatsApp/call CTA. |
| 7 | **HIGH** | Checkout form labels not associated with inputs (no `htmlFor`/`id`); WCAG 1.3.1/4.1.2 | `checkout/CheckoutClient.tsx:207-276` | Add matching `id`+`htmlFor`; wrap fulfillment radios in `<fieldset>`/`<legend>`. |
| 8 | **HIGH** | Brand pink/WhatsApp-green text fail WCAG AA contrast (`#e91e8c`=4.18:1, `#25D366`=1.98:1) | `globals.css:9`; `page.tsx:146,151,156`; `contact/page.tsx:48` | Use `--rose-700` (#7a1448, ~10.4:1) for link/body text; darken the green. |
| 9 | **HIGH** | SEO data drift: schema phone is placeholder `+961-1-234567`; schema falsely says open Sunday | `structured-data.ts:9,22-42` | Set `telephone:'+96176585028'`; remove the Sunday entry, set Mon–Sat 09:30–19:30. |
| 10 | **HIGH** | Closed `CartDrawer` keeps focusable controls in tab order while `aria-hidden` (WCAG 4.1.2) | `CartDrawer.tsx:66-213`; `layout.tsx:108` | Add `inert` to the drawer when `!isOpen`, or gate inner render on `isOpen`. |

---

## 3. Per-Dimension Findings

### 3.1 Security

| Severity | Title | File:Line |
|---|---|---|
| HIGH | Hard-coded admin backdoor cookie | `src/app/admin/layout.tsx:13-16,20,43-45` |
| MEDIUM | HTML injection into order emails (unescaped customer fields) | `src/lib/resend.ts:28,66,92,95,150` |
| MEDIUM | Order endpoint trusts client `price_usd`/`total_usd` (price/total tampering) | `src/app/api/orders/route.ts:27,68,82` |
| MEDIUM | Order endpoint can email arbitrary addresses; no validation/rate-limit (spam relay) | `src/app/api/orders/route.ts:16,55,104-108` |
| LOW | CSP allows `'unsafe-inline'` + `'unsafe-eval'` in `script-src` | `vercel.json:17` |
| LOW | Live `VERCEL_OIDC_TOKEN` in working-tree `.env.local` (git-ignored, ~12h TTL) | `.env.local:2` |
| LOW | OAuth callback `next` param not validated | `src/app/api/auth/callback/route.ts:10,20-25` |
| LOW | Middleware checks auth-cookie *presence*, not validity | `middleware.ts:6-20` |
| INFO ✅ | Admin API authz + `requireAdmin` (uses `getUser()`, not `getSession()`) implemented correctly | `src/lib/admin-auth.ts:8-27` |

**Hard-coded admin backdoor (HIGH).** `admin/layout.tsx:14-15` reads cookie `admin-backdoor`; if value === `'rebellys-dev-2026'`, line 20 `if (!isBackdoor)` skips the entire `getUser()`+role-check block. A static literal in a git repo = anyone who reads source can become admin. **Mitigation that keeps it HIGH not CRITICAL:** `/api/admin/*` routes still call `requireAdmin()` and `/admin/page.tsx` relies on RLS, so a backdoor visitor with no real auth sees empty data. **Fix:** delete lines 14-15 and the `isBackdoor` branching; if a dev shortcut is needed, gate on `NODE_ENV==='development'` + a non-committed env secret.

**Email HTML injection (MEDIUM).** `resend.ts` builds HTML via template literals with no escaping (`${item.name}`, `Hi <strong>${order.customer_name}</strong>`, `${order.delivery_area}`, etc.); these originate from the unvalidated `POST /api/orders` body. No `escapeHtml`/`sanitize` exists in `src/lib`. **Fix:** add `escapeHtml()` and apply to every interpolated user value.

**Price/total tampering (MEDIUM).** `total_usd` is taken from the request body (line 27) and inserted verbatim (line 68); `order_items` use client `price_usd` (line 82). `/admin/page.tsx:72,87` sums stored `total_usd` as "Revenue This Month," so any authenticated user can corrupt revenue stats and per-line prices shown to staff. **Fix:** re-derive prices server-side from `products`/`event_products` by id; never trust client totals.

**Spam relay (MEDIUM).** `customer_email` is unvalidated (line 16), stored (55), and used to send a branded Resend email (104-108); no rate-limiting exists anywhere in `src`. **Fix:** validate email format; prefer sending only to the authenticated user's `user.email`; add per-user/IP rate limiting on `POST /api/orders`.

**CSP weakness (LOW).** `vercel.json:17` keeps `'unsafe-inline' 'unsafe-eval'` in `script-src`. Defense-in-depth only — React auto-escapes and there is no in-app injection sink (the unescaped email HTML renders in mail clients, not in-app). The rest of the policy is solid (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-src` scoped to Google, plus HSTS/`X-Frame-Options: DENY`/`nosniff`/`Referrer-Policy`/`Permissions-Policy`). **Fix:** drop `'unsafe-eval'` first; migrate to nonce/hash later.

> **Uncertain (security):**
> **RLS migrations 0002/0003 may not be applied to the live DB (INFO/uncertain)** — `supabase/migrations/0003_fix_admin_rls_recursion.sql` is well-formed (`is_admin()` is `SECURITY DEFINER STABLE SET search_path=public`, `EXECUTE` revoked from public/anon; `prevent_role_change()` BEFORE UPDATE trigger; admin policies de-recursed). Migration 0002 is actually named `0002_require_login_to_order.sql` (prompt's `0002_login_required_inserts.sql` is stale) and drops guest INSERT policies, adding authenticated-only inserts `WITH CHECK (auth.uid()=user_id)`. **The code is correct; the operational risk is whether it is live.** Verify against production via `pg_policies`/`pg_proc`; until applied, the app-layer 401 is the only guest barrier. Also confirm 0002's `DROP POLICY` names match the live DB's actual policy names (the stale `supabase/schema.sql` names them differently — `"Anyone can insert orders"` vs `"Anyone can create orders"` — so a `DROP IF EXISTS` could silently miss and leave guest-insert policies alive).

---

### 3.2 SEO

| Severity | Title | File:Line |
|---|---|---|
| HIGH | Schema phone is placeholder `+961-1-234567`, not real `+96176585028` | `src/lib/structured-data.ts:9` |
| HIGH | Schema opening hours contradict site (claims open Sunday; site = closed) | `src/lib/structured-data.ts:22-42` |
| MEDIUM | OG/Twitter image declared 1200×630 but is actually 1024×1024 JPEG mislabeled `.png` (~967 KB) | `src/app/layout.tsx:51-57,67` |
| MEDIUM | Event pages are `noindex` but still listed in sitemap | `src/app/sitemap.ts:50-61` vs `events/[slug]/page.tsx:20` |
| MEDIUM | No real per-product pages; Product schema `url` points to `/collections#slug` fragments | `src/lib/structured-data.ts:69` |
| MEDIUM | No favicon wired (`public/favicon.svg` only; no `app/icon`, no `metadata.icons`) | `src/app/layout.tsx:32-76` |
| LOW | Home title `Home | Rebelly's…` wastes top title; template double-suffix risk | `src/app/page.tsx:10` |
| LOW | Invalid `servesCuisine` on a Florist `LocalBusiness` | `src/lib/structured-data.ts:47` |
| LOW | `sameAs: []` — no social/profile entity links; `hasMap` is a generic query | `src/lib/structured-data.ts:45,46` |
| LOW | `NEXT_PUBLIC_SITE_URL` defined but unused; domain hardcoded everywhere | `src/app/sitemap.ts:9` (+ layout/robots/structured-data) |
| INFO | No `viewport`/`themeColor` export and no web app manifest | `src/app/layout.tsx:32` |

**Phone mismatch (HIGH).** `getLocalBusinessSchema()` emits `telephone:'+961-1-234567'` (a textbook dummy) while every customer surface uses `+961 76 585 028` (`Footer.tsx:101`, `contact/page.tsx:38-39`, `resend.ts:102`). This is the only machine-readable phone Google ingests. **Fix:** set `'+96176585028'` (E.164), sourced from one shared config constant.

**False Sunday hours (HIGH).** Schema (22-42) declares Mon–Sat 09:00–20:00 **and** a Sunday 10:00–18:00 entry; the site says Mon–Sat 09:30–19:30, Sunday **Closed** (`contact/page.tsx:56-57`, `Footer.tsx:109`). Google can surface "open Sunday" in the local panel → customers arrive at a closed shop. **Fix:** single `OpeningHoursSpecification` Mon–Sat 09:30/19:30; omit Sunday.

**OG image (MEDIUM).** `layout.tsx:53-56` declares 1200×630 for `/images/shop_interior.png`, but the asset is 1024×1024, ~967 KB, and is actually a JPEG (signature `ffd8ffe0`) mislabeled `.png` → cropping/letterboxing in previews. **Fix:** ship a real, compressed 1200×630 OG image with the correct extension.

**noindex + sitemap conflict (MEDIUM).** `sitemap.ts:50-61` emits `/events/{slug}` (priority 0.85, daily) while `events/[slug]/page.tsx:20` sets `robots:{index:false}` → "Submitted URL marked noindex" warnings. **Fix:** pick one — drop the `eventRoutes` block, or remove the `noindex`.

**No per-product pages (MEDIUM).** `getProductSchema` sets `url:/collections#${slug}`; there is no `src/app/products/**` route, so every Product offer resolves to the same page fragment (not rich-result eligible). **Fix:** add a real `products/[slug]` route, or drop per-item Product offers and keep `ItemList` only.

> **Uncertain (SEO):** **Lighthouse SEO=1.0 captured against localhost (INFO/uncertain)** — positive scaffolding is real (per-page canonicals, `robots.ts` disallows `/admin`,`/api`,`/auth`,`/checkout`, dynamic sitemap, `JsonLd` for LocalBusiness + Event, geo meta, hreflang/x-default), but the reported clean score coexists with several real defects above, confirming a localhost run missed host-dependent issues. Re-run Rich Results Test + Lighthouse against live `https://rebellys.com` after fixing phone/hours/OG/favicon.

---

### 3.3 Performance

| Severity | Title | File:Line |
|---|---|---|
| MEDIUM | `lighthouse-report.json` captured against dev server (`localhost:3000`); score 55 not representative | `lighthouse-report.json:2-6` |
| MEDIUM | Home + collections use `force-dynamic`, opting product grids out of caching | `src/app/page.tsx:17`; `collections/page.tsx:16` |
| MEDIUM | Google fonts load all weights for Playfair + Inter (no `weight` subset) | `src/app/layout.tsx:13-30` |
| LOW | `CartDrawer`/`CheckoutClient` use raw `<img>`, bypassing `next/image` | `CartDrawer.tsx:120`; `CheckoutClient.tsx:151` |
| LOW | Floating/scroll/banner/cart all mount in root layout; per-route client JS + Supabase fetch | `src/app/layout.tsx:98-109`; `EventBanner.tsx:12-40` |
| LOW | `FloatingPetals` sway animates `margin-left` (layout-triggering, non-composited) | `src/app/globals.css:405-408` |
| INFO ✅ | Core `next/image` usage + config correct; LCP/CLS fundamentals sound (CLS 0.094) | `src/components/ProductCard.tsx:66-77`; `next.config.mjs:3-17` |

**Dev-server Lighthouse (MEDIUM).** `finalUrl=http://localhost:3000/`; the bad numbers (LCP 8.73s, FCP 4.24s, "Root document took 7,220 ms") are dev cold-compile/unminified artifacts. App-intrinsic audits are clean (TBT 0, `mainthread-work-breakdown` score 1, `bootup-time` 14ms) — nothing in the app is actually slow. **Fix:** do not optimize against this file; re-run against `next build && next start` or the live Vercel URL and rename/remove the committed dev report.

**`force-dynamic` (MEDIUM).** `page.tsx:17`, `collections/page.tsx:16`, and `events/[slug]/page.tsx:9` force fresh SSR+DB per visit for a catalog that changes rarely (contrast `about/page.tsx:13` and `services/page.tsx:14` which use `revalidate=3600`). **Fix:** `export const revalidate = 60` (or 300) and call `revalidatePath('/')`/`revalidatePath('/collections')` from admin mutations for instant updates.

**Font weights (MEDIUM).** Playfair (13-17) and Inter (26-30) set `subsets:['latin']` + `display:'swap'` but **no `weight` array** → full variable axis self-hosted (only Cormorant is restricted). **Fix:** add explicit `weight` arrays matching real usage.

---

### 3.4 Accessibility

| Severity | Title | File:Line |
|---|---|---|
| HIGH | Closed `CartDrawer` keeps focusable controls in tab order while `aria-hidden` (4.1.2) | `CartDrawer.tsx:66-213`; `layout.tsx:108`; `globals.css:420-430` |
| HIGH | Dialogs don't restore focus to trigger on close (`CartDrawer` + `WhishModal`; 2.4.3) | `CartDrawer.tsx:44-52`; `WhishModal.tsx:57-66` |
| HIGH | Checkout form labels not programmatically associated (1.3.1/4.1.2/3.3.2) | `checkout/CheckoutClient.tsx:207-276` |
| HIGH | Brand pink/WhatsApp-green text fail AA contrast | `globals.css:9`; `page.tsx:146,151,156`; `contact/page.tsx:48`; `CheckoutClient.tsx:153` |
| MEDIUM | Checkout cart qty buttons lack accessible name *(downgraded from HIGH — visible glyph + duplicates accessible CartDrawer)* | `checkout/CheckoutClient.tsx:195-199` |
| MEDIUM | No "skip to main content" link; `.sr-only` defined but unused | `layout.tsx:98-109`; `globals.css:84` |
| MEDIUM | No `prefers-reduced-motion` support for continuous/entrance animations | `globals.css:95-104,224-232,365-408,530-540` |
| MEDIUM | Hamburger lacks `aria-controls`; no Escape/focus management on mobile menu | `Navbar.tsx:108-149` |
| LOW | Decorative emoji inside `<h1>` is announced | `contact/page.tsx:18`; `Navbar.tsx:147` |
| LOW | Heading skip on success page (h1 → h3) | `checkout/success/page.tsx:15,26` |
| LOW | Per-item `qty-val` live region announces a bare number with no item context | `CartDrawer.tsx:155-157` |
| INFO | `WhishModal` always invoked with `totalUsd=0` → exposes "$0"/"0 LL" (functional bug; see CRITICAL) | `CheckoutClient.tsx:291`; `WhishModal.tsx:168,173,177` |
| INFO ✅ | Strong a11y baseline: focus trap, Escape, scroll-lock, `:focus-visible`, labeled icon buttons, alt text | `globals.css:80`; `CartDrawer.tsx`; `WhishModal.tsx` |

**`aria-hidden` focusable controls (HIGH).** Drawer is permanently mounted (`layout.tsx:108`); root sets `aria-hidden={!isOpen}` while inner content renders on `items.length` (not `isOpen`), and closed state is only `transform: translateX(100%)` (no `display:none`/`hidden`/`inert`). With items present, the close/qty/remove/checkout controls stay keyboard-focusable inside an `aria-hidden` subtree — the exact axe `aria-hidden-focus` violation. **Fix:** add `inert` when `!isOpen` (or gate inner render on `isOpen`).

**No focus restore (HIGH).** Both dialogs move focus in on open but neither captures `document.activeElement` nor restores it on close → focus falls to `<body>` (2.4.3). **Fix:** capture `prev` on open, call `prev?.focus()` in the close cleanup (restore to `#nav-cart-btn` / the checkout submit button).

**Unassociated labels (HIGH).** Full Name (207-214), Phone (217-224), Delivery Address (257-264), Special Notes (269-276) use bare `<label>` with no `htmlFor` and inputs have no `id`. (Radios `f-delivery`/`f-pickup` *are* correctly paired.) **Fix:** add `id`+`htmlFor`; wrap fulfillment in `<fieldset>`/`<legend>`.

**Contrast (HIGH).** `--rose-500` #e91e8c on white = **4.18:1** (fails AA 4.5 for normal text) used as link text; WhatsApp `#25D366` on white = **1.98:1** (severe fail, `contact/page.tsx:48`); placeholder ~2.6:1. `--rose-700` #7a1448 passes strongly (~10.4:1). White-on-rose-500 buttons (4.18:1) pass the 3:1 large/bold threshold. **Fix:** use `--rose-700`/`--text-main` for link/body text; darken the green and placeholder.

---

### 3.5 Code Quality

| Severity | Title | File:Line |
|---|---|---|
| HIGH | Customer confirmation email can never send (email field not collected) yet success page claims it was | `CheckoutClient.tsx:22-28,43-67`; `resend.ts:19`; `success/page.tsx:17` |
| HIGH | Two divergent schema files; `supabase/schema.sql` still has guest-checkout RLS + stale defs | `supabase/schema.sql:141-142,169-170` vs `supabase-schema.sql` |
| MEDIUM | `order_number` from 4 base36 chars — collision risk vs UNIQUE, no retry | `api/orders/route.ts:44-46,73-76` |
| MEDIUM | Fire-and-forget `email_sent` update unreliable on serverless + uses wrong (cookie) client | `api/orders/route.ts:104-122` |
| MEDIUM | Default post-login redirect `/account` does not exist (404) | `auth/login/page.tsx:21`; `GoogleSignInButton.tsx:13`; `middleware.ts:12` |
| MEDIUM | Auth callback redirects to non-existent `/auth/auth-code-error` | `api/auth/callback/route.ts:30` |
| MEDIUM | Extras not persisted as structured data; stored as `↳`-prefixed pseudo line items | `CheckoutClient.tsx:58-65`; `admin/orders/[id]/page.tsx:110`; `types/index.ts:79,90` |
| LOW | Type safety lost: `products:any[]`, `settings:any`, `item:any` | `CheckoutClient.tsx:9-12`; `api/orders/route.ts:79` |
| LOW | WhatsApp `window.open` fire-and-forget; popup-block fails silently; `whatsapp_sent` never auto-set | `CheckoutClient.tsx:106-110`; `admin/orders/[id]/page.tsx:55-63` |
| LOW | `removeItem`/`addItem` destructured but unused/mismatched | `CheckoutClient.tsx:16,163,196` |
| INFO ✅ | Recent session changes verified correct (login-gate, rollback, RLS migrations, item alias, orderNumber) | `api/orders/route.ts`; `middleware.ts`; migrations 0002/0003 |

**Email never sends + false success (HIGH).** Form state collects only name/phone/fulfillment/address/notes — no `customer_email`, `delivery_date/time/area`, `occasion`, `card_message`. `sendOrderConfirmationEmail` returns `false` on `!order.customer_email` (`resend.ts:19`), but `success/page.tsx:17` unconditionally says an email was sent; the API writes all the uncollected columns as NULL. **Fix:** pick one direction — collect the fields and wire them through, or remove the dead columns/email-UI and fix the copy.

**Divergent schemas (HIGH).** `supabase/schema.sql` still has `"Anyone can insert orders" ... with check (true)` (guest hole), recursive admin `exists(...)` checks, `delivery_date text`, no `is_admin()`, no role guard, no `addresses` table. Root `supabase-schema.sql` is the secure one. Nothing marks which is authoritative → applying the wrong file is a live security regression. **Fix:** keep root `supabase-schema.sql` + numbered migrations; delete `supabase/schema.sql` or replace with a pointer. Note: 0002's `DROP POLICY` names won't match the stale file's policy names, so reconcile names against the live DB.

---

### 3.6 UX / Conversion

| Severity | Title | File:Line |
|---|---|---|
| CRITICAL | Whish modal always shows `$0` / `0 LL` to pay | `CheckoutClient.tsx:291`; `WhishModal.tsx:28,168,173,177` |
| HIGH | Success page falsely claims a confirmation email was sent | `checkout/success/page.tsx:17` |
| HIGH | Post-login redirect default → non-existent `/account` (404) | `auth/login/page.tsx:18-21`; `GoogleSignInButton.tsx:13` |
| MEDIUM | Checkout page can't select extras → add-on AOV lever undiscoverable in main flow | `checkout/CheckoutClient.tsx:149-169` |
| MEDIUM | Cart/checkout show "Price confirmed by WhatsApp" even when price is known | `checkout/CheckoutClient.tsx:158,193` |
| MEDIUM | `alert()` is the only empty-cart/error feedback on checkout submit | `checkout/CheckoutClient.tsx:33,113` |
| MEDIUM | Cart badge hydration mismatch/flash (store read during SSR, no mount guard) | `Navbar.tsx:22,92-96`; `cart.ts:88` |
| MEDIUM | Contact form is a non-functional stub that fakes success | `contact/ContactForm.tsx:28-37` |
| LOW | Success page renders a blank order number if reached without `?order` | `checkout/success/page.tsx:9-23` |
| LOW | Event page has no persistent cart/checkout affordance after drawer is dismissed | `events/[slug]/page.tsx:93-119` |
| INFO ✅ | Cart drawer / WhishModal / product card a11y + empty/loading states well implemented | `CartDrawer.tsx:95-107` |

**Whish modal $0 (CRITICAL).** `CheckoutClient.tsx:291` hard-codes `totalUsd={0}`; the modal renders `formatUsd(0)="$0"`, `usdToLbp(0)="0 LL"`, and Copy copies `"0"` — while instructing "Send the exact amount." Root cause: `totalUsd()` returns 0 after `clearCart()` (line 109). The total *is* available (it's even sent to the API at line 46). **Fix:** capture before clearing and pass it in, or hide the amount card and show "Amount confirmed via WhatsApp."

**"Price confirmed by WhatsApp" everywhere (MEDIUM).** `CheckoutClient.tsx:158,193` hard-code the string with no reference to `product.price_usd`, whereas `CartDrawer.tsx:112-113,143,188-189` correctly computes `unitPrice(...)*qty` and shows `formatUsd`. The checkout view shows no per-item price and no running total. **Fix:** mirror CartDrawer logic on checkout.

> **Uncertain (UX):** **Login friction surfaces only as a silent redirect at final click (LOW/uncertain)** — partially refuted: `middleware.ts:10-18` gates `/checkout` and redirects guests to `/auth/login?redirectTo=/checkout` *before* the form renders, so the "maximal effort then wall" framing is overstated. The `401` handler (`CheckoutClient.tsx:72-77`) is only hit when an auth cookie exists at the edge but `getUser()` returns nothing server-side (expired session) — in that narrow case the entered `formData` (local state, not persisted) is lost. **Fix:** persist `formData` to `sessionStorage` before the 401 redirect and restore after login.

---

## 4. Standards-to-Findings Map

| External best-practice (area) | Source | Rebellys finding(s) | Status |
|---|---|---|---|
| Pin Next.js ≥ 14.2.25 vs CVE-2025-29927 middleware bypass | [NVD CVE-2025-29927](https://nvd.nist.gov/vuln/detail/CVE-2025-29927) · [JFrog](https://jfrog.com/blog/cve-2025-29927-next-js-authorization-bypass/) | `package.json` = `next ^14.2.35` (>= 14.2.25) | ✅ **Satisfied** |
| Don't rely on middleware alone; re-check auth server-side | [Datadog](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/) · [Next.js auth guide](https://nextjs.org/docs/app/guides/authentication) | Middleware checks cookie *presence* only (`middleware.ts:6-20`), but `admin/layout.tsx` + `requireAdmin()` re-check via `getUser()` | ✅ Mostly satisfied (LOW residual) |
| Server endpoints must validate inputs & recompute price server-side | [Next.js security blog](https://nextjs.org/blog/security-nextjs-server-components-actions) | Order endpoint trusts client `price_usd`/`total_usd` (`api/orders/route.ts:27,68,82`) | ❌ **Violated** |
| Return minimal DTOs; never leak raw rows / PII | [Next.js data security](https://nextjs.org/docs/app/guides/data-security) | Admin email leaks PII only to authenticated admins; HTML injection in emails (`resend.ts`) | ⚠️ Partial (injection MEDIUM) |
| Enable RLS on every public table; service_role server-only | [Supabase: Securing data](https://supabase.com/docs/guides/database/secure-data) · [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | Migrations 0002/0003 correct in code; **may not be applied live**; stale `supabase/schema.sql` reopens guest hole | ⚠️ **Verify on live DB** |
| Strict security headers (CSP, HSTS, nosniff, frame-ancestors) | [Next.js CSP](https://nextjs.org/docs/app/guides/content-security-policy) | `vercel.json` ships HSTS/`X-Frame-Options: DENY`/nosniff/Referrer/Permissions; CSP present but `unsafe-inline`+`unsafe-eval` | ⚠️ Partial (LOW) |
| Secrets unprefixed/server-only on Vercel; Deployment Protection | [Vercel sensitive env](https://vercel.com/docs/environment-variables/sensitive-environment-variables) · [Vercel rotating](https://vercel.com/docs/environment-variables/rotating-secrets) | `VERCEL_OIDC_TOKEN` in git-ignored `.env.local` (LOW); verify Preview protection + separate keys | ⚠️ Verify |
| Remove hard-coded admin backdoors (CWE-798) | [Next.js security blog](https://nextjs.org/blog/security-nextjs-server-components-actions) | `admin-backdoor=rebellys-dev-2026` (`admin/layout.tsx:13-16`) | ❌ **Violated (HIGH)** |
| Use `getUser()`/`getClaims()` not `getSession()` for authz | [Supabase SSR Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) · [auth-js #898](https://github.com/supabase/auth-js/issues/898) | `requireAdmin` uses `getUser()`; `user_id` set from session | ✅ **Satisfied** |
| `is_admin()` SECURITY DEFINER avoids 42P17 recursion; fixed `search_path` | [Supabase #3328](https://github.com/orgs/supabase/discussions/3328) · [DEV: SECURITY DEFINER gotcha](https://dev.to/bairescodeai/infinite-recursion-in-postgres-rls-a-security-definer-gotcha-1916) | 0003 adds `is_admin()` `SECURITY DEFINER STABLE SET search_path=public`, EXECUTE revoked from anon | ✅ Correct in code (consider plpgsql/private schema) |
| INSERT needs `WITH CHECK`; UPDATE needs USING+WITH CHECK; no self-role-write | [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | 0002 `WITH CHECK (auth.uid()=user_id)`; 0003 `prevent_role_change` trigger | ✅ Correct in code; **test on live DB** |
| Florist `LocalBusiness` JSON-LD with full NAP, hours, geo | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) · [schema.org](https://schema.org/LocalBusiness) | Placeholder phone (`structured-data.ts:9`); false Sunday hours (22-42); empty `sameAs` | ❌ **Violated (HIGH×2 + LOW)** |
| JSON-LD via Server Component, escape `<` | [Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld) | `JsonLd` wired in layout; `servesCuisine` invalid on Florist (`:47`) | ⚠️ Partial (LOW) |
| Product/Offer + ItemList; real per-product URLs | [Google Product](https://developers.google.com/search/docs/appearance/structured-data/product) | Product schema `url` = `/collections#slug` fragments; no `products/[slug]` route (`:69`) | ❌ **Violated (MEDIUM)** |
| NAP byte-for-byte identical across site/schema/GBP | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) | Schema phone ≠ Footer/Contact/Resend phone | ❌ **Violated (HIGH)** |
| hreflang only if multilingual | [Google multi-regional](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) | hreflang/x-default present (single-language) | ⚠️ Verify (no-op if 1 lang) |
| `sitemap.ts` + `robots.ts`; don't list noindex URLs | [Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) · [robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) | Event pages `noindex` but in sitemap (`sitemap.ts:50-61`) | ❌ **Violated (MEDIUM)** |
| CWV thresholds (LCP<2.5s, INP<200ms, CLS<0.1); field not lab; not `next dev` | [web.dev Vitals](https://web.dev/articles/vitals) · [lab vs field](https://web.dev/articles/lab-and-field-data-differences) | Lighthouse run against `localhost` dev (`lighthouse-report.json`); CLS 0.094 good | ⚠️ **Re-measure on prod** |
| `next/image` sized + priority on LCP; allowlist remotePatterns | [Next.js images](https://nextjs.org/docs/app/getting-started/images) · [web.dev CLS](https://web.dev/articles/cls) | ProductCard/hero correct; raw `<img>` in CartDrawer/Checkout (`:120`/`:151`) | ✅ Mostly (LOW residual) |
| `next/font` with weight subsetting | [Next.js fonts](https://nextjs.org/docs/app/getting-started/fonts) · [Vercel next/font](https://vercel.com/blog/nextjs-next-font) | `next/font` used; Playfair/Inter load all weights (`layout.tsx:13-30`) | ⚠️ Partial (MEDIUM) |
| Prefer static rendering; keep auth surfaces dynamic | [Next.js static/dynamic](https://nextjs.org/learn/dashboard-app/static-and-dynamic-rendering) · [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) | Home/collections `force-dynamic` for rarely-changing catalog (`page.tsx:17`) | ❌ **Violated (MEDIUM)** |
| Minimize client JS; push `'use client'` to leaves; lazy-load | [Next.js lazy-loading](https://nextjs.org/docs/app/guides/lazy-loading) · [web.dev INP](https://web.dev/articles/inp) | All decorative/banner/cart client comps mount in root layout (`layout.tsx:98-109`) | ⚠️ Partial (LOW) |
| Avoid layout-triggering animation props | [web.dev Optimize CLS](https://web.dev/articles/optimize-cls) | Sway animates `margin-left` (`globals.css:405-408`) | ⚠️ LOW |
| Don't force account creation; persist cart across login | [Baymard checkout](https://baymard.com/learn/checkout-flow-ux-optimization) · [Baymard 2025](https://baymard.com/blog/current-state-of-checkout-ux) · [Amazon Pay/Baymard](https://pay.amazon.com/blog/for-businesses/the-baymard-report-series-how-forcing-sign-ups-drives-down-sales) | Login-gated checkout (intentional); `formData` not persisted on expired-session 401 | ⚠️ Verify cart-persist; LOW residual |
| Validate `?redirectTo=` as same-origin relative | [DEV: returnTo validation](https://dev.to/dalenguyen/fixing-nextjs-authentication-redirects-preserving-deep-links-after-login-pkk) · [Authgear](https://www.authgear.com/post/nextjs-security-best-practices/) | Login page validates (`startsWith('/')&&!'//'`); callback `next` unvalidated (`:10`) | ⚠️ Partial (LOW) |
| Accessible modal dialog (focus trap, Escape, restore focus, inert) | [W3C APG Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) · [MDN aria-modal](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-modal) | Trap/Escape ✅ but no focus restore (HIGH) + closed drawer focusable under `aria-hidden` (HIGH) | ❌ **Violated (HIGH×2)** |
| WCAG 2.2 2.4.11 Focus Not Obscured | [W3C 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) · [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Verify sticky header/cart bar doesn't obscure focus | ⚠️ Verify |
| WCAG 2.2 3.3.7 Redundant Entry | [W3C 3.3.7](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html) | Tied to checkout field re-entry / preserve on error | ⚠️ Verify |
| WCAG 2.2 3.3.8 Accessible Auth (OAuth satisfies) | [W3C 3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) | Google OAuth as primary login | ✅ **Satisfied** |
| WCAG 1.3.5 autocomplete tokens | [W3C 1.3.5](https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose.html) · [H98](https://www.w3.org/WAI/WCAG21/Techniques/html/H98) | Checkout inputs lack `id`/labels (`CheckoutClient.tsx:207-276`) — add autocomplete too | ❌ **Violated (HIGH)** |
| Clear add-to-cart/async feedback; inline cart edits | [Vervaunt cart drawers](https://vervaunt.com/ecommerce-cart-drawers-examples-technologies-ux-best-practices) · [Aureate Labs](https://aureatelabs.com/guide/ecommerce-ux-audit-checklist/shopping-cart-ux/) | CartDrawer good; checkout uses `alert()` (`:33,113`); extras absent from checkout (`:149-169`) | ⚠️ Partial (MEDIUM×2) |
| GEO: server-render content + entity markup, consistent facts | [Search Engine Land GEO](https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142) · [Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld) | Server-rendered ✅; entity facts inconsistent (phone/hours) undermine extraction | ⚠️ Partial |
| Core Web Vitals as ranking signal | [Google CWV](https://developers.google.com/search/docs/appearance/core-web-vitals) · [Page experience](https://developers.google.com/search/docs/appearance/page-experience) | Re-measure on prod (dev Lighthouse invalid); CLS already good | ⚠️ Verify |

---

## 5. Sources

**CVE / Next.js security**
- https://nvd.nist.gov/vuln/detail/CVE-2025-29927
- https://jfrog.com/blog/cve-2025-29927-next-js-authorization-bypass/
- https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/
- https://nextjs.org/blog/security-nextjs-server-components-actions
- https://nextjs.org/docs/app/guides/authentication
- https://nextjs.org/docs/app/guides/data-security
- https://nextjs.org/docs/app/guides/content-security-policy
- https://www.authgear.com/post/nextjs-security-best-practices/

**Supabase / database**
- https://supabase.com/docs/guides/database/secure-data
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/server-side/nextjs
- https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z
- https://supabase.com/docs/guides/troubleshooting/rls-simplified-BJTcS8
- https://github.com/orgs/supabase/discussions/3328
- https://github.com/supabase/auth-js/issues/898
- https://dev.to/bairescodeai/infinite-recursion-in-postgres-rls-a-security-definer-gotcha-1916

**Vercel**
- https://vercel.com/docs/environment-variables/sensitive-environment-variables
- https://vercel.com/docs/environment-variables/rotating-secrets
- https://vercel.com/blog/nextjs-next-font

**SEO / GEO**
- https://developers.google.com/search/docs/appearance/structured-data/local-business
- https://schema.org/LocalBusiness
- https://nextjs.org/docs/app/guides/json-ld
- https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- https://developers.google.com/search/docs/appearance/structured-data/product
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
- https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142

**Performance / Core Web Vitals**
- https://web.dev/articles/vitals
- https://web.dev/articles/lab-and-field-data-differences
- https://web.dev/articles/cls
- https://web.dev/articles/optimize-cls
- https://web.dev/articles/inp
- https://developers.google.com/search/docs/appearance/core-web-vitals
- https://developers.google.com/search/docs/appearance/page-experience
- https://nextjs.org/docs/app/getting-started/images
- https://nextjs.org/docs/app/getting-started/fonts
- https://nextjs.org/learn/dashboard-app/static-and-dynamic-rendering
- https://nextjs.org/docs/app/api-reference/functions/generate-static-params
- https://nextjs.org/docs/app/guides/lazy-loading

**Checkout UX / WCAG accessibility**
- https://baymard.com/learn/checkout-flow-ux-optimization
- https://baymard.com/blog/current-state-of-checkout-ux
- https://pay.amazon.com/blog/for-businesses/the-baymard-report-series-how-forcing-sign-ups-drives-down-sales
- https://dev.to/dalenguyen/fixing-nextjs-authentication-redirects-preserving-deep-links-after-login-pkk
- https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-modal
- https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
- https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html
- https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose.html
- https://www.w3.org/WAI/WCAG21/Techniques/html/H98
- https://vervaunt.com/ecommerce-cart-drawers-examples-technologies-ux-best-practices
- https://aureatelabs.com/guide/ecommerce-ux-audit-checklist/shopping-cart-ux/