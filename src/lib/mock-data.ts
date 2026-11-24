const MOCK_DATE = '2024-01-01T00:00:00.000Z';

export const MOCK_PRODUCTS = [
  // ── Christmas Specials ───────────────────────────────────────────────
  { id: 'xmas-1', name: "Santa's Charm", category: 'christmas', slug: 'santas-charm', tag: 'Christmas Special',
    description: 'Glass bell jar on a black base housing a Santa figurine and a frosted crimson tree, topped with a red bow.',
    image_url: '/images/products/santas-charm.jpg', image_urls: ['/images/products/santas-charm.jpg'],
    price_usd: 30, is_active: true, sort_order: 1, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'xmas-2', name: 'Merry and Bright', category: 'christmas', slug: 'merry-and-bright', tag: 'Christmas Special',
    description: 'White ceramic "Merry" mug, red poinsettia, pinecone, and festive accessories.',
    image_url: '/images/products/merry-and-bright.jpg', image_urls: ['/images/products/merry-and-bright.jpg'],
    price_usd: 35, is_active: true, sort_order: 2, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'xmas-3', name: 'Holiday Magic Mug', category: 'christmas', slug: 'holiday-magic-mug', tag: 'Christmas Special',
    description: 'Mini poinsettia plant nestled in a "Merry and Bright" red ceramic mug with festive accessories.',
    image_url: '/images/products/holiday-magic-mug.jpg', image_urls: ['/images/products/holiday-magic-mug.jpg'],
    price_usd: 22, is_active: true, sort_order: 3, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'xmas-4', name: 'Holiday Berry', category: 'christmas', slug: 'holiday-berry', tag: 'Christmas Special',
    description: 'Red and white roses, red berries, cotton flowers, and accessories in a white round box.',
    image_url: '/images/products/holiday-berry.jpg', image_urls: ['/images/products/holiday-berry.jpg'],
    price_usd: 45, is_active: true, sort_order: 4, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'xmas-5', name: 'Christmas Cuddles', category: 'christmas', slug: 'christmas-cuddles', tag: 'Christmas Special',
    description: 'Potted Gold Crest tree in burgundy wrapping with pink ornaments, paired with a plush brown teddy bear.',
    image_url: '/images/products/christmas-cuddles.jpg', image_urls: ['/images/products/christmas-cuddles.jpg'],
    price_usd: 30, is_active: true, sort_order: 5, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'xmas-6', name: 'Ralph Teddy Bear', category: 'christmas', slug: 'ralph-teddy-bear', tag: 'Christmas Special',
    description: 'Plush brown teddy bear with an Ecosse ribbon. A timeless gift for all ages.',
    image_url: '/images/products/ralph-teddy-bear-1.jpg',
    image_urls: ['/images/products/ralph-teddy-bear-1.jpg', '/images/products/ralph-teddy-bear-2.jpg', '/images/products/ralph-teddy-bear-3.jpg'],
    price_usd: 15, is_active: true, sort_order: 6, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'xmas-7', name: 'Mingle & Jingle', category: 'christmas', slug: 'mingle-and-jingle', tag: 'Christmas Special',
    description: 'Five red poinsettia plants arranged in a black leather box with festive accessories.',
    image_url: '/images/products/mingle-and-jingle.jpg', image_urls: ['/images/products/mingle-and-jingle.jpg'],
    price_usd: 135, is_active: true, sort_order: 7, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'xmas-8', name: "Santa's Little Evergreen", category: 'christmas', slug: 'santas-little-evergreen', tag: 'Christmas Special',
    description: "An Elwoody plant presented in a charming Santa's bag — a perfect festive decoration.",
    image_url: '/images/products/santas-little-evergreen.jpg', image_urls: ['/images/products/santas-little-evergreen.jpg'],
    price_usd: 16, is_active: true, sort_order: 8, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'xmas-9', name: "Rudolph's Red Wine", category: 'christmas', slug: 'rudolphs-red-wine', tag: 'Christmas Special',
    description: 'Ksara Réserve du Couvent 75cl presented with Christmas accessories in an elegant black box.',
    image_url: '/images/products/rudolphs-red-wine.jpg', image_urls: ['/images/products/rudolphs-red-wine.jpg'],
    price_usd: 55, is_active: true, sort_order: 9, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'xmas-10', name: 'Christmas Whispers', category: 'christmas', slug: 'christmas-whispers', tag: 'Christmas Special',
    description: 'Two lush poinsettia plants beautifully arranged in a wicker basket.',
    image_url: '/images/products/christmas-whispers.jpg', image_urls: ['/images/products/christmas-whispers.jpg'],
    price_usd: 70, is_active: true, sort_order: 10, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'xmas-11', name: 'Winter Wonderland', category: 'christmas', slug: 'winter-wonderland', tag: 'Christmas Special',
    description: 'Four orchid plants in a white ceramic pot adorned with Christmas accessories.',
    image_url: '/images/products/winter-wonderland.jpg', image_urls: ['/images/products/winter-wonderland.jpg'],
    price_usd: 155, is_active: true, sort_order: 11, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'xmas-12', name: 'Christmas Basket', category: 'christmas', slug: 'christmas-basket', tag: 'Christmas Special',
    description: "Ksara Réserve du Couvent Red Wine and Côte d'Or 240g chocolates arranged with festive ornaments, pinecones, and seasonal greenery in a natural basket.",
    image_url: '/images/products/christmas-basket.jpg', image_urls: ['/images/products/christmas-basket.jpg'],
    price_usd: 99, is_active: true, sort_order: 12, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'xmas-13', name: 'White Poinsettia', category: 'christmas', slug: 'white-poinsettia', tag: 'Christmas Special',
    description: 'Elegant white poinsettia plant presented in a basket with festive accessories.',
    image_url: '/images/products/white-poinsettia.jpg', image_urls: ['/images/products/white-poinsettia.jpg'],
    price_usd: 30, is_active: true, sort_order: 13, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  // ── New Born ─────────────────────────────────────────────────────────
  { id: 'nb-1', name: 'Little Princess', category: 'new-born', slug: 'little-princess', tag: 'New Born',
    description: 'White orchid plant with a teddy bear in a pink ceramic pot — a magical welcome gift for a baby girl.',
    image_url: '/images/products/baby-girl-orchid.jpg', image_urls: ['/images/products/baby-girl-orchid.jpg'],
    price_usd: 75, is_active: true, sort_order: 14, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'nb-2', name: 'Little Prince', category: 'new-born', slug: 'little-prince', tag: 'New Born',
    description: 'White orchid plant with a teddy bear in a blue ceramic pot — a beautiful welcome gift for a baby boy.',
    image_url: '/images/products/baby-boy-orchid.jpg', image_urls: ['/images/products/baby-boy-orchid.jpg'],
    price_usd: 75, is_active: true, sort_order: 15, created_at: MOCK_DATE, updated_at: MOCK_DATE },

  { id: 'nb-3', name: 'Tiny Treasure', category: 'new-born', slug: 'tiny-treasure', tag: 'New Born',
    description: "Flower arrangement with a brown teddy bear and a helium \"It's a girl\" balloon — perfect for the hospital or the home.",
    image_url: '/images/products/tiny-treasure.jpg', image_urls: ['/images/products/tiny-treasure.jpg'],
    price_usd: 75, is_active: true, sort_order: 16, created_at: MOCK_DATE, updated_at: MOCK_DATE },
];
