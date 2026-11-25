// Storefront facts and merchandising helpers shared by the home page, collections, cart and checkout.
// Only facts that already exist elsewhere in the codebase or were supplied by the owner live here.

import { ADD_ONS } from '@/lib/catalog';

// Google Maps listing: rating and count supplied by the owner (Google Maps, read 2026-11).
// The five verbatim reviews are in src/lib/reviews.ts. The link is the same one the footer uses.
export const GOOGLE = {
  rating: 4.2,
  count: 29,
  url: 'https://maps.app.goo.gl/aq7CZ26re22c4KQx7',
} as const;

// Same opening hours as the footer, contact page and structured data.
export const HOURS_LABEL = 'Mon – Sat, 9:30 AM – 7:30 PM';

// TODO(owner): delivery areas, delivery fee(s), same-day cut-off time and minimum lead time.
// Until the owner answers, every screen says the fee and time are confirmed when we call.
export const DELIVERY_NOTE = 'Delivery fee and time are confirmed when we call you.';

// ── Catalog helpers (work for both the built-in catalog and D1 rows) ──────────────
type CatLike = { category?: string | null; tag?: string | null };

export function categoryOf(p: CatLike): 'christmas' | 'new-born' | 'other' {
  if (p.category === 'christmas' || p.category === 'new-born') return p.category;
  if (p.tag === 'New Born') return 'new-born';
  if (p.tag?.startsWith('Christmas')) return 'christmas';
  return 'other';
}

export const PRICE_BANDS = [
  { value: 'any', label: 'Any budget', test: (_n: number) => true },
  { value: 'u35', label: 'Under $35', test: (n: number) => n < 35 },
  { value: '35-100', label: '$35 – $100', test: (n: number) => n >= 35 && n <= 100 },
  { value: '100+', label: 'Over $100', test: (n: number) => n > 100 },
] as const;
export type PriceBand = (typeof PRICE_BANDS)[number]['value'];

export function inBand(price: number | null | undefined, band: PriceBand): boolean {
  if (band === 'any') return true;
  if (price == null) return false;
  return PRICE_BANDS.find((b) => b.value === band)!.test(price);
}

// ── Add-on relevance (catalog facts) ───────────────────────────────────────────
// Items whose catalog description already includes a teddy bear: do not push a second one first.
const INCLUDES_TEDDY = new Set(['xmas-5', 'xmas-6', 'nb-1', 'nb-2', 'nb-3']);
// Tiny Treasure already includes a helium balloon.
const INCLUDES_HELIUM = new Set(['nb-3']);

export type AddOn = (typeof ADD_ONS)[number];

/** Add-ons ordered by relevance to what is in the cart, with a one-line hint. */
export function relevantAddOns(cartIds: string[]): { list: AddOn[]; hint: string } {
  const hasNewBorn = cartIds.some((id) => id.startsWith('nb-'));
  const hasGift = cartIds.some((id) => id.startsWith('xmas-') || id.startsWith('nb-'));
  const hasTeddy = cartIds.some((id) => INCLUDES_TEDDY.has(id));
  const hasHelium = cartIds.some((id) => INCLUDES_HELIUM.has(id));
  const order: string[] = hasNewBorn
    ? ['addon-card', 'addon-balloon-helium', 'addon-balloon-lg', 'addon-balloon-sm', 'addon-teddy']
    : ['addon-card', 'addon-teddy', 'addon-balloon-helium', 'addon-balloon-lg', 'addon-balloon-sm'];
  let list = order.map((id) => ADD_ONS.find((a) => a.id === id)!).filter(Boolean);
  // Do not suggest what the arrangement already includes.
  if (hasTeddy) list = list.filter((a) => a.id !== 'addon-teddy');
  if (hasHelium) list = list.filter((a) => a.id !== 'addon-balloon-helium');
  const hint = hasNewBorn
    ? 'A balloon makes a newborn gift feel complete.'
    : hasGift
      ? 'A free card with your message is one tap away.'
      : 'Optional extras, added to this order.';
  return { list, hint };
}
