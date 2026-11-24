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

export function getProductSchema(product: {
  name: string;
  description?: string | null;
  image_url?: string | null;
  price_usd?: number | null;
  slug: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description:
      product.description ??
      `Premium floral arrangement — ${product.name} by Rebelly's Flower Shop`,
    image:
      product.image_url ?? 'https://rebellys.com/images/og.jpg',
    url: `https://rebellys.com/collections`,
    brand: { '@type': 'Brand', name: "Rebelly's" },
    offers: product.price_usd
      ? {
          '@type': 'Offer',
          price: product.price_usd,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: "Rebelly's Flower Shop",
          },
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
