// Single source of truth for public shop contact details.
// Values come from NEXT_PUBLIC_SHOP_* env vars, with the current real values as fallback.

const digits = (v: string) => v.replace(/[^\d]/g, '');

const RAW_PHONE = process.env.NEXT_PUBLIC_SHOP_PHONE || '+96176585028';
const RAW_WHATSAPP = process.env.NEXT_PUBLIC_SHOP_WHATSAPP || RAW_PHONE;

function formatLebanese(num: string): string {
  const d = digits(num);
  // 961 76 585 028
  if (d.startsWith('961') && d.length === 11) {
    return `+961 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  }
  return `+${d}`;
}

export const SHOP = {
  name: "Rebelly's",
  fullName: "Rebelly's Flower Shop",
  phoneE164: `+${digits(RAW_PHONE)}`,
  phoneDisplay: formatLebanese(RAW_PHONE),
  whatsappDigits: digits(RAW_WHATSAPP),
  whatsappDisplay: formatLebanese(RAW_WHATSAPP),
  address: process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Saydeh Street, Zalka, Lebanon',
  // One shared business inbox for the whole shop.
  email: 'rebellyslb@outlook.com',
  tagline: 'A Flower Story',
  founded: 1993,
  // Numbers for clients and event planners outside Lebanon.
  international: [
    { country: 'United Arab Emirates', phone: '+971501442465', display: '+971 50 144 2465' },
    { country: 'Morocco', phone: '+212667088012', display: '+212 667 088012' },
  ],
} as const;

export const telHref = `tel:${SHOP.phoneE164}`;

export function whatsappHref(message?: string): string {
  const base = `https://wa.me/${SHOP.whatsappDigits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
