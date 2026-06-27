# Rebellys — Audit & Competitive Research

**Generated:** 2026-06-27  
**Audit agents:** UI, UX, Backend, API, Security (×2), Performance, SEO, Testing, Pentest (11 agents, 521k tokens)  
**Research agents:** Orchestrator → Research-Specialist (competitor scrape of Exotica LB + Fleurs de la Sagesse)

---

## PART 1: MULTI-AGENT SITE AUDIT

### Executive Summary

The codebase has two production-blocking criticals that expose full admin access to any internet user. Beyond those, checkout is broken in multiple ways that affect every live order. The app must not go to production in its current state.

---

### CRITICAL — Block Launch

| # | Finding | File | CVSS |
|---|---------|------|------|
| C-1 | **Admin backdoor cookie** — `Cookie: admin-backdoor=rebellys-dev-2026` bypasses all auth entirely | `src/app/admin/layout.tsx:13-15, 43-45` | 10.0 |
| C-2 | **RLS privilege escalation** — any signed-in user can `UPDATE public.profiles SET role='admin'` | `supabase-schema.sql:205-208` | 9.9 |
| C-3 | **Cart cleared before WhatsApp confirmed** — if popup blocked, cart is wiped with no recovery path | `src/app/checkout/CheckoutClient.tsx:89` | — |

**Fixes:**

**C-1:** Delete lines 13-15 (cookie read + `isBackdoor` assignment) and lines 43-45 (else branch setting `Dev Backdoor` userName). Remove the `if (!isBackdoor)` wrapper. Run `git filter-repo` to scrub from history. Rotate all secrets that were active while backdoor existed.

**C-2:**
```sql
ALTER POLICY "Users can update own profile" ON public.profiles
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.prevent_role_change() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role <> OLD.role THEN
    RAISE EXCEPTION 'Role cannot be changed via this path';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER lock_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();
```

**C-3:** Move `clearCart()` from line 89 (right after API call) into `closeWhishModal()` so it only fires after the user explicitly acknowledges the modal.

---

### HIGH — Fix Alongside Launch

| # | Finding | File | Details |
|---|---------|------|---------|
| H-1 | **Middleware auth bypass** — checks only cookie name pattern (`sb-*-auth-token`), no JWT verification | `middleware.ts:6-8` | Setting `sb-x-auth-token=garbage` passes the guard. Replace with `@supabase/ssr` `createServerClient` + `supabase.auth.getUser()`. |
| H-2 | **Client-supplied `total_usd` written to DB** — attacker orders $200 bouquet for $0.01 | `api/orders/route.ts:27,62` | Fetch canonical prices server-side by product ID. Never trust client-supplied `price_usd`. |
| H-3 | **Open redirect in OAuth callback** — `next=%2F%2Fattacker.com` redirects after login | `api/auth/callback/route.ts:10,21-23` | Add `safeNext()`: must start with `/`, must not start with `//`. Also validate `x-forwarded-host` against `NEXT_PUBLIC_SITE_URL`. |
| H-4 | **HTML injection in admin emails** — `customer_name`, item names etc. interpolated raw into email HTML | `lib/resend.ts:66,150+` | Add `esc()` function escaping `& < > " '` and apply to all user-supplied fields. |
| H-5 | **No input validation on POST `/api/orders`** — any string length, any enum value accepted | `api/orders/route.ts` | Add Zod schema. Validate enum fields against allowlists. Cap string lengths. |
| H-6 | **Orphaned orders on `order_items` insert failure** — logs error, returns 200 success | `api/orders/route.ts:83-89` | On `itemsError`: delete parent order row and return 500. Never return success for a partial order. |
| H-7 | **WhishModal shows $0.00** — `totalUsd={0}` hardcoded, copy button copies "0" | `CheckoutClient.tsx:314` | Remove amount fields from modal or hide copy UI when `totalUsd === 0` with "Amount confirmed via WhatsApp" note. |
| H-8 | **`requireAdmin` uses anon-key client** — RLS can shadow profile rows, false auth denials | `lib/admin-auth.ts:8-27` | Use `createAdminClient()` (service-role) for the profiles lookup inside `requireAdmin`. |
| H-9 | **No rate limiting on order endpoint** — anonymous spam exhausts Resend quota | `api/orders/route.ts` | Add `@upstash/ratelimit`: 5 orders per IP per hour at Vercel edge. |
| H-10 | **CSS Modules hover selectors dead** — `:global(.card:hover)` never matches scoped class | `ProductGallery.module.css:33-35,79` | Use `data-hovered="true"` attribute set via `onMouseEnter`/`onMouseLeave` on the card; selector becomes `[data-hovered='true'] .img`. |
| H-11 | **Cart `lineId` not implemented** — same product as regular + event item merges incorrectly | `CartDrawer.tsx:110`, `cart.ts:29` | Generate `lineId = id + (event_id ?? '')`. Key store deduplication and list renders on `lineId`. |
| H-12 | **Submit button stuck loading forever** after successful order | `CheckoutClient.tsx` success branch | Add `setLoading(false)` after `clearCart()`, or use a `finally` block. |
| H-13 | **`ilike` search string injected raw into PostgREST DSL** — ReDoS / filter injection | `api/admin/orders/route.ts:33-37` | Strip DSL-meaningful chars, cap to 100 chars, use two separate `.ilike()` calls. |

---

### MEDIUM — Fix Soon

| # | Title | File |
|---|-------|------|
| M-1 | `window.open()` popup blocked silently — no fallback WhatsApp link | `CheckoutClient.tsx:86` |
| M-2 | Decrement-to-zero silently removes cart items with no undo | `cart.ts:43-53` |
| M-3 | "Clear" button on checkout has no confirmation — destroys order on single tap | `CheckoutClient.tsx:157` |
| M-4 | Success page accessible directly with no order guard | `checkout/success/page.tsx` |
| M-5 | Forgot password flow completely absent | `EmailAuthForm.tsx` |
| M-6 | Delivery address not required for delivery orders | `CheckoutClient.tsx:244-255` |
| M-7 | Phone field has no format guidance for Lebanese numbers (+961) | `CheckoutClient.tsx:193-202` |
| M-8 | Google Sign-In forces consent screen every login (`prompt: 'consent'`) | `GoogleSignInButton.tsx:26-35` |
| M-9 | No pagination on `GET /api/admin/products` and `GET /api/admin/events` | Admin routes |
| M-10 | Inconsistent response envelope across all API routes | Multiple routes |
| M-11 | `parseInt()` with no NaN guard on pagination params | `admin/orders/route.ts:17-18` |
| M-12 | `image_urls` array field ignored in product create/update API | `admin/products/route.ts` |
| M-13 | Product DELETE returns `{ success: true }` even when no row matched | `admin/products/[id]/route.ts:90-99` |
| M-14 | No enum validation on order/payment status fields | `admin/orders/[id]/route.ts:49-54` |
| M-15 | Fire-and-forget admin email promise — unhandled rejection | `orders/route.ts:95-111` |
| M-16 | `createAdminClient` service-role key falls back to empty string silently | `supabase/server.ts:30-36` |
| M-17 | RLS INSERT policy allows client-supplied `user_id` to be any UUID | `supabase-schema.sql:267` |
| M-18 | CSP `unsafe-inline` + `unsafe-eval` negate XSS protection | `vercel.json:17` |
| M-19 | Order number collision risk — Math.random() 4-char suffix | `orders/route.ts:39` |
| M-20 | EventBanner async fetch blocks critical render path | `EventBanner.tsx:15-38` |
| M-21 | PostHog loaded synchronously — ~100-150KB on first load | `PostHogProvider.tsx:5` |
| M-22 | Missing Suspense boundaries for product data on slow networks | `collections/page.tsx:90` |
| M-23 | Excessive Zustand store subscriptions in CheckoutClient (6 selectors) | `CheckoutClient.tsx:16` |
| M-24 | Body scroll lock race between CartDrawer and Navbar | `CartDrawer.tsx:47`, `Navbar.tsx:40-43` |
| M-25 | Mobile menu not `inert` when closed — keyboard reaches hidden links | `Navbar.tsx:133-156` |
| M-26 | `aria-live` placed on `<button>` — unreliable screen reader announcements | `ProductCard.tsx:97` |
| M-27 | Form labels not associated with inputs via `htmlFor`/`id` | `CheckoutClient.tsx:182,245,294` |
| M-28 | Placeholder phone number in structured-data.ts (+961-1-234567) | `structured-data.ts:9` |
| M-29 | Missing Arabic locale in OpenGraph and hreflang | `layout.tsx:60,72-75` |
| M-30 | Missing breadcrumb schema on about/services/contact/events pages | Multiple pages |
| M-31 | robots.txt disallows all of `/auth/` including indexable login page | `robots.ts:9` |
| M-32 | Missing AggregateRating schema despite 4.9★ shown on reviews page | `structured-data.ts` |
| M-33 | ProductGallery dot buttons keyed by index — wrong remounts on error | `ProductGallery.tsx:108` |
| M-34 | settings PATCH updates without WHERE clause — multi-row silent failure | `admin/settings/route.ts:52-57` |
| M-35 | Password minimum enforced client-side only; Supabase default may be 6 chars | `EmailAuthForm.tsx:50,133` |

---

### LOW / INFO

| # | Title | File |
|---|-------|------|
| L-1 | `NavAuth` pre-hydration hidden link is `aria-hidden` on interactive element | `NavAuth.tsx:34-37` |
| L-2 | `searchParams` accessed synchronously — breaks on Next.js 15 | `auth/login/page.tsx:24` |
| L-3 | `.img` and `.card:hover .img` rules in `ProductCard.module.css` are dead code | `ProductCard.module.css:32-39` |
| L-4 | `.authSlot` class referenced in JSX but not defined in CSS | `Navbar.module.css` |
| L-5 | Scheduling section uses raw inline styles instead of module CSS | `CheckoutClient.tsx:258-291` |
| L-6 | `confirm` field not reset when switching signin/signup tabs | `EmailAuthForm.tsx:20-24` |
| L-7 | Add-to-cart on checkout page gives no visual feedback | `CheckoutClient.tsx:139-145` |
| L-8 | No username indicator shown when signed in | `NavAuth.tsx:57-66` |
| L-9 | X-XSS-Protection header obsolete and potentially harmful | `vercel.json:8` |
| L-10 | Admin contact hardcoded in email templates instead of from `site_settings` | `resend.ts:102,109` |
| L-11 | Email confirm field not cleared on mode switch | `EmailAuthForm.tsx:20-24` |
| L-12 | Missing password confirm placeholder text | `EmailAuthForm.tsx:142-152` |
| L-13 | ProductCard missing `React.memo` — rerenders on unrelated parent changes | `ProductCard.tsx:18` |
| L-14 | `FloatingPetals` not memoized | `layout.tsx` |
| L-15 | `Intl.NumberFormat` instantiated on every render in ProductCard | `ProductCard.tsx:41` |
| L-16 | Scroll event fires Navbar rerender at 60fps — throttle to 100ms | `Navbar.tsx:26-28` |
| L-17 | Touch handlers recreated on every render without `useCallback` | `ProductGallery.tsx:37-47` |
| L-18 | FAQ schema missing on services/contact pages | `services/page.tsx` |
| L-19 | Missing `ImageObject` schema for gallery slides | `structured-data.ts:53-84` |
| L-20 | Missing hreflang on `/collections` page | `collections/page.tsx:12` |
| L-21 | Sitemap missing product detail routes | `sitemap.ts` |
| L-22 | No OpenAPI spec or endpoint documentation | `src/app/api/` |
| L-23 | No Content-Type check before `request.json()` — returns 500 not 400 | All POST/PATCH routes |
| L-24 | Missing DELETE endpoint for admin orders | `admin/orders/route.ts` |

---

### Debloat Opportunities

- **Dead CSS:** `ProductCard.module.css` lines 32-39 — `.img` and `.card:hover .img` rules; ProductCard no longer renders a bare `<img>`. Delete both rules.
- **Unused function:** `createAdminClient()` in `supabase/server.ts` has zero import sites. Delete or add lint guard.
- **NavAuth placeholder anti-pattern:** Replace the `opacity:0` / `aria-hidden` hidden-link pattern with `return null` during not-ready state.
- **Dual scroll lock:** CartDrawer and Navbar both independently manage `document.body.style.overflow`. Extract to a ref-counted utility or `[data-scroll-locked]` CSS hook.
- **CheckoutClient god component:** Destructures 6 Zustand selectors. Split into `<CartItemsSection>`, `<OrderFormSection>`, `<CartSummarySection>` with targeted selectors.
- **ScrollAnimations.tsx:** `MutationObserver` with `subtree: true` on entire `<main>` — change to `{ childList: true, subtree: false }`.
- **PostHog:** Loads ~100-150KB synchronously. Defer with dynamic import inside `useEffect`.

---

### Quick Wins (≤10 lines each — apply immediately)

```typescript
// QW-1: Fix placeholder phone in structured-data.ts
telephone: '+96176585028',  // was: '+961-1-234567'

// QW-2: Remove obsolete X-XSS-Protection header
// vercel.json — delete: { "key": "X-XSS-Protection", "value": "1; mode=block" }

// QW-3: Fix searchParams for Next.js 15 compat
export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ redirectTo?: string }> }) {
  const { redirectTo: rawRedirect } = await searchParams;

// QW-4: Add missing .authSlot CSS class
// Navbar.module.css:
.authSlot { display: contents; }

// QW-5: Guard image_url null in checkout
<Image src={product.image_url ?? '/placeholder-flower.jpg'} alt={product.name} fill style={{ objectFit: 'cover' }} />

// QW-6: Fix dot button keys in ProductGallery
key={validImages[i]}  // was: key={i}

// QW-7: Add safe redirect to OAuth callback
function safeNext(v: string | null): string {
  return typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? v : '/';
}
const next = safeNext(searchParams.get('next'));

// QW-8: Fix Google sign-in consent re-prompt
queryParams: { prompt: 'select_account' }  // was: 'consent'

// QW-9: Throw on missing service role key at startup
if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

// QW-10: Fix aria-live on button
<button onClick={handleAdd}>{added ? 'Added!' : 'Add to Cart'}</button>
<span aria-live="polite" aria-atomic="true" className="sr-only">{added ? 'Added to cart' : ''}</span>

// QW-11: Delete dead CSS rules in ProductCard.module.css (lines 32-39)

// QW-12: Move clearCart() to inside closeWhishModal() (move 1 line)
```

---

## PART 2: COMPETITOR ANALYSIS

**Research date:** 2026-06-27  
**Sites analyzed:** Exotica Lebanon (exotica.com), Fleurs de la Sagesse (fleursdelasagesse.com)

---

### Exotica Lebanon

**Strengths:**
- Multi-column responsive grid with inline variant selectors (size, color)
- Transparent USD pricing displayed on every product ($22–$387)
- Rich add-on ecosystem at checkout: balloons, sweets, wines, plant care
- Same-day delivery cutoff messaging: "before 4:30 PM"
- Multiple payment methods: cards, Western Union, MoneyGram, cash in-store
- Blog, FAQ, help docs, seasonal campaigns
- Trust signals: newsletter, hotline (1533), active WhatsApp support

**Gaps:**
- No dynamic filtering/sorting (category nav only)
- No review/rating section visible
- No hero promotional banner carousel

---

### Fleurs de la Sagesse

**Strengths:**
- 4-column grid with "Hot" / "Sale" urgency badges
- Luxury tier section: "Luxury and Elegance" ($150–$670)
- Wedding specialization: distinct category + hero messaging
- Heritage & social proof: "Established 1980", press mentions, Toters app listing
- Bundle offerings: flowers + chocolate, balloons, cake pre-packaged
- Same-day delivery before 5:00 PM across Lebanon
- WhatsApp numbers for custom arrangement requests

**Gaps:**
- No blog or extensive content
- No newsletter or account features
- Less diversified payment information

---

### Side-by-Side Comparison

| Feature | Exotica | Fleurs de la Sagesse | Rebellys (Current) |
|---------|---------|---------------------|---------------------|
| Pricing display | Transparent USD ($22–$387) | Transparent USD ($50–$670) | "Confirmed by WhatsApp" |
| Product filtering | Category nav only | Sidebar + badges | **None** |
| Variant selectors | Inline (size/color) | "Select options" button | None |
| Add-ons at checkout | 4+ types (balloons, wine, sweets) | Minimal (balloons) | None |
| Same-day cutoff | 4:30 PM explicit | 5:00 PM explicit | Not shown |
| WhatsApp role | Support channel | Customization requests | **Primary order channel** |
| Reviews/ratings | Not visible | Heritage + press | None |
| Trust signals | Blog + FAQ + hotline | Est. 1980 + press | None |
| Product badges | Seasonal campaigns | Hot/Sale urgency | None |
| Product detail page | Full gallery + description | Full gallery | No detail page |
| Add-ons | Extensive | Bundles | None |
| Payment methods | Cards + cash + transfer | Cards + cash | WhatsApp-confirmed |

---

### Top 10 Recommendations for Rebellys

#### Tier 1 — Quick Wins (Week 1)

**1. Add price range + "Confirmed by WhatsApp" badge**
- Display: `$45–$120 · Confirmed by WhatsApp ✓`
- Differentiates from competitors while maintaining your model
- Impact: High | Effort: < 1 day

**2. Category filtering sidebar**
- Categories: Roses, Tulips, Occasions (Birthday, Wedding, Sympathy), Seasonal, Luxury, Bundles, Plants
- Borrow Fleurs' sidebar layout (cleaner on mobile than Exotica's top nav)
- Impact: High | Effort: 2–3 days

**3. Same-day delivery cutoff badge**
- "Order before 4:30 PM for same-day delivery"
- Show available delivery dates in the scheduling section (already built)
- Impact: High | Effort: < 1 day

**4. Product urgency badges**
- "Hot", "New", "Trending", "Seasonal" — Fleurs' pattern
- Drives attention and urgency without requiring pricing
- Impact: Medium | Effort: < 1 day

**5. Product variant selectors**
- Size (Small / Medium / Large), color direction (Warm / Cool / Mixed)
- "Need custom? Chat on WhatsApp" fallback CTA
- Impact: High | Effort: 2–3 days

#### Tier 2 — Revenue (Week 2–3)

**6. Add-on suggestions at checkout**
- Balloons, greeting card, vase, chocolate box — Exotica gets ~15–25% AOV lift
- Modal before final WhatsApp submit: "Add some extras?"
- Impact: Very High | Effort: 2–3 days

**7. Full product detail page**
- Multi-image gallery (already have gallery component)
- Full description, variant selection, add-ons, WhatsApp CTA
- Impact: High | Effort: 1–2 days

**8. Luxury Arrangements premium section**
- Fleurs positions $150–$670 items separately with premium visual treatment
- Rebellys: "Premium & Custom Arrangements" with WhatsApp customization CTA
- Impact: Medium-High | Effort: 1 day

#### Tier 3 — Differentiation (Week 3–4)

**9. WhatsApp floating customization widget (unique advantage)**
- Floating button: "Need a custom arrangement? Chat on WhatsApp"
- Pre-fills message: "Hi, I'm interested in [product]. Can we customize [color/size/message]?"
- Both competitors use WhatsApp for support — Rebellys makes it seamless
- Impact: High | Effort: 1 day

**10. Seasonal campaign hero banners**
- Exotica: "Graduation Blooms", "Green Escape", "Bloom & Shine"
- Rebellys opportunities: Ramadan, Mother's Day, Valentine's, Anniversary, Graduation, Eid
- Impact: Medium | Effort: 1 day per campaign

---

### Strategic Insight

Rebellys' WhatsApp-based ordering is **not a weakness — it's the competitive advantage**. Both Exotica and Fleurs use WhatsApp only for support and customization. Rebellys should position it as the *seamless, transparent ordering channel* with:

1. Upfront price ranges (USD + WhatsApp confirmation badge)
2. Clear customization options visible on-site (variants, add-ons)
3. WhatsApp CTA pre-filled per product for special requests

This reduces back-and-forth friction both competitors experience and makes Rebellys feel intentional and modern, not incomplete.

---

### Recommended Execution Roadmap

| Phase | Week | Items |
|-------|------|-------|
| Foundation | Week 1 | C-1, C-2, C-3 (critical security) + QW-1 through QW-12 + Recs #3, #4 |
| Security hardening | Week 1 | H-1 through H-9 (auth, price validation, rate limit, emails) |
| UX improvements | Week 2 | Recs #1, #2, #5 (pricing badge, filtering, variants) + M-1 through M-8 |
| Revenue features | Week 3 | Recs #6, #7, #8 (add-ons, detail pages, luxury section) |
| Differentiation | Week 4 | Recs #9, #10 (WhatsApp widget, seasonal campaigns) |
