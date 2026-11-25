import { SHOP, whatsappHref } from '@/lib/shop';

export function getLocalBusinessSchema() {
  // No aggregateRating here on purpose: the only reviews in the codebase are the
  // five on /reviews (average 4.4). A hardcoded 4.9 / 20 is not backed by anything
  // on the site and risks a Google structured-data penalty.
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'Florist'],
    '@id': 'https://rebellys.com/#business',
    name: "Rebelly's Flower Shop",
    alternateName: 'Rebellys',
    description:
      'Flower shop on Saydeh Street in Zalka, Lebanon, arranging flowers since 1993: floral decoration for weddings and events, bridal bouquets, vase arrangements, hotels, homes and hand bouquets.',
    url: 'https://rebellys.com',
    telephone: SHOP.phoneE164,
    email: SHOP.email,
    slogan: SHOP.tagline,
    image: [
      'https://rebellys.com/images/og.jpg',
      'https://rebellys.com/images/products/christmas-basket.jpg',
    ],
    logo: 'https://rebellys.com/favicon.svg',
    foundingDate: '1993',
    priceRange: '$$',
    paymentAccepted: 'Cash, Whish Money, WhatsApp Order',
    currenciesAccepted: 'LBP, USD',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Saydeh Street',
      addressLocality: 'Zalka',
      addressRegion: 'Mount Lebanon',
      addressCountry: 'LB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 33.904,
      longitude: 35.58,
    },
    // Sunday omitted = closed (a 00:00-00:00 entry is not a documented closed convention).
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:30',
        closes: '19:30',
      },
    ],
    hasMap: 'https://maps.app.goo.gl/aq7CZ26re22c4KQx7',
    sameAs: [
      'https://www.instagram.com/rebellys.lb',
      whatsappHref(),
    ],
    areaServed: [
      { '@type': 'City', name: 'Zalka' },
      { '@type': 'City', name: 'Antelias' },
      { '@type': 'City', name: 'Dbayeh' },
      { '@type': 'City', name: 'Jdeideh' },
      { '@type': 'City', name: 'Naccache' },
      { '@type': 'AdministrativeArea', name: 'Metn' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Floral Arrangements',
      itemListElement: [
        'Weddings and events',
        'Bridal bouquets',
        'Hotel flowers',
        'Residential flowers',
        'Vase arrangements',
        'Hand bouquets',
      ].map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
    },
  };
}

const SITE = 'https://rebellys.com';
const absUrl = (u: string) => (u.startsWith('http') ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`);

// Product + Offer for one catalog item. No aggregateRating or review on purpose: there is no
// per-product review data. Availability is InStock because items listed in the shop are orderable;
// TODO(owner): if an item can sell out, drive availability from real stock instead of a constant.
export function getProductSchema(product: {
  id?: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  price_usd?: number | null;
  slug: string;
  tag?: string | null;
}) {
  const images = (product.image_urls && product.image_urls.length ? product.image_urls : [product.image_url])
    .filter((u): u is string => !!u)
    .map(absUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.id ? { sku: product.id } : {}),
    description:
      product.description ??
      `Floral arrangement: ${product.name} by Rebelly's Flower Shop`,
    image: images.length ? images : [`${SITE}/images/og.jpg`],
    url: `${SITE}/collections`,
    ...(product.tag ? { category: product.tag } : {}),
    brand: { '@type': 'Brand', name: "Rebelly's" },
    offers:
      product.price_usd != null && product.price_usd > 0
        ? {
            '@type': 'Offer',
            url: `${SITE}/collections`,
            price: product.price_usd.toFixed(2),
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@type': 'Organization', name: "Rebelly's Flower Shop" },
          }
        : undefined,
  };
}

export function getEventSchema(event: {
  name: string;
  description?: string | null;
  slug: string;
  banner_image_url?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description:
      event.description ??
      `Special event collection — ${event.name} at Rebelly's Flower Shop`,
    image:
      event.banner_image_url ??
      'https://rebellys.com/images/og.jpg',
    url: `https://rebellys.com/events/${event.slug}`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    organizer: {
      '@type': 'Organization',
      name: "Rebelly's Flower Shop",
      url: 'https://rebellys.com',
    },
    location: {
      '@type': 'Place',
      name: "Rebelly's Flower Shop",
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Saydeh Street',
        addressLocality: 'Zalka',
        addressCountry: 'LB',
      },
    },
  };
}

export function getBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
