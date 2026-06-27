export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Florist',
    name: "Rebelly's Flower Shop",
    description:
      "Premium handcrafted floral arrangements for weddings, occasions, and everyday beauty. Delivery across Lebanon.",
    url: 'https://rebellys.com',
    telephone: '+96176585028',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Saydeh Street',
      addressLocality: 'Zalka',
      addressRegion: 'Metn',
      addressCountry: 'LB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '33.904',
      longitude: '35.580',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        opens: '09:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday'],
        opens: '10:00',
        closes: '18:00',
      },
    ],
    priceRange: '$$',
    image: 'https://rebellys.com/images/shop_interior.png',
    sameAs: [],
    hasMap: 'https://maps.google.com/?q=Zalka+Lebanon',
    servesCuisine: 'Floristry',
    currenciesAccepted: 'USD, LBP',
    paymentAccepted: 'Cash, Whish Money',
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
      product.image_url ?? 'https://rebellys.com/images/shop_interior.png',
    url: `https://rebellys.com/collections#${product.slug}`,
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
      'https://rebellys.com/images/shop_interior.png',
    url: `https://rebellys.com/events/${event.slug}`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
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
