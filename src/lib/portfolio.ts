// Portfolio photos from the owner's 2021 portfolio. Dimensions were read from the files with sharp.
// Order here is the "All" view (categories interleaved); category views keep this relative order.

export type PortfolioCategory = 'weddings' | 'bridal' | 'hotels' | 'homes' | 'vases' | 'bouquets';

export interface PortfolioItem {
  id: string;
  src: string;
  width: number;
  height: number;
  category: PortfolioCategory;
  alt: string;
  /** Source photo has a thin black frame baked in: crop it slightly inside the tile. */
  trim?: boolean;
}

export const PORTFOLIO_CATEGORIES: { id: PortfolioCategory; label: string }[] = [
  { id: 'weddings', label: 'Weddings' },
  { id: 'bridal', label: 'Bridal' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'homes', label: 'Homes' },
  { id: 'vases', label: 'Vases' },
  { id: 'bouquets', label: 'Bouquets' },
];

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  { id: 'wedding-03-1', src: '/images/portfolio/wedding-03-1.jpg', width: 728, height: 551, category: 'weddings', alt: 'Wedding reception hall with orchid and moss arrangements above gold chairs' },
  { id: 'vases-15-0', src: '/images/portfolio/vases-15-0.jpg', width: 427, height: 605, category: 'vases', alt: 'White delphinium and trailing ivy arrangement in a stone urn by a tall window' },
  { id: 'residential-30-1', src: '/images/portfolio/residential-30-1.jpg', width: 476, height: 587, category: 'homes', alt: 'Rich arrangement of ranunculus, roses, anthurium and ornamental kale in a brass planter' },
  { id: 'bridal-12-0', src: '/images/portfolio/bridal-12-0.jpg', width: 432, height: 566, category: 'bridal', alt: 'Bridal bouquet of pale pink roses edged with pearls and crystal brooches' },
  { id: 'hotels-27-1', src: '/images/portfolio/hotels-27-1.jpg', width: 416, height: 584, category: 'hotels', alt: 'Tall arrangement of pink, white and purple blooms in a gold floor vase in a marble lobby' },
  { id: 'bouquet-39-1', src: '/images/portfolio/bouquet-39-1.jpg', width: 1349, height: 1261, category: 'bouquets', alt: 'Wrapped hand bouquet of red roses, pink anthurium, purple roses and hydrangea in kraft paper' },
  { id: 'wedding-04-1', src: '/images/portfolio/wedding-04-1.jpg', width: 758, height: 555, category: 'weddings', alt: 'Sculpted wedding centrepiece of magenta orchids, moss and branches on a long table' },
  { id: 'vases-16-0', src: '/images/portfolio/vases-16-0.jpg', width: 685, height: 973, category: 'vases', alt: 'Two tall arrangements of white orchids and branches in silver vases wrapped with ivy' },
  { id: 'residential-30-2', src: '/images/portfolio/residential-30-2.jpg', width: 642, height: 585, category: 'homes', alt: 'Dense domed arrangement of pink peonies, garden roses and lilac' },
  { id: 'bridal-13-1', src: '/images/portfolio/bridal-13-1.jpg', width: 407, height: 584, category: 'bridal', alt: 'Pink gypsophila bridal bouquet standing in a glass vase' },
  { id: 'hotels-27-2', src: '/images/portfolio/hotels-27-2.jpg', width: 416, height: 584, category: 'hotels', alt: 'Cascading pink floral centrepiece on a gilded black table in a large hall' },
  { id: 'bouquet-40-1', src: '/images/portfolio/bouquet-40-1.jpg', width: 640, height: 592, category: 'bouquets', alt: 'Close view of a dome of deep red roses with palm leaves' },
  { id: 'wedding-05-0', src: '/images/portfolio/wedding-05-0.jpg', width: 746, height: 548, category: 'weddings', alt: 'White dahlias, orchids and green berries in a glass bowl on a set wedding table' },
  { id: 'vases-17-0', src: '/images/portfolio/vases-17-0.jpg', width: 946, height: 1341, category: 'vases', alt: 'Round pink peony arrangement with succulents in a striped black and white vase' },
  { id: 'residential-31-1', src: '/images/portfolio/residential-31-1.jpg', width: 1274, height: 471, category: 'homes', alt: 'Long low table runner of pale pink roses and hydrangea' },
  { id: 'bridal-13-2', src: '/images/portfolio/bridal-13-2.jpg', width: 586, height: 796, category: 'bridal', alt: 'Hand-tied bridal bouquet of white roses and hydrangea with a dark leaf collar' },
  { id: 'hotels-28-1', src: '/images/portfolio/hotels-28-1.jpg', width: 416, height: 577, category: 'hotels', alt: 'Low nest-shaped arrangement of dried stems and pink flowers on a curved steel stand' },
  { id: 'bouquet-40-2', src: '/images/portfolio/bouquet-40-2.jpg', width: 640, height: 592, category: 'bouquets', alt: 'Red rose bouquet with eucalyptus and green pods in red paper wrap' },
  { id: 'wedding-06-1', src: '/images/portfolio/wedding-06-1.jpg', width: 1000, height: 747, category: 'weddings', alt: 'Cream and pink rose centrepiece on a laid wedding table with mirrored chairs', trim: true },
  { id: 'vases-18-0', src: '/images/portfolio/vases-18-0.jpg', width: 689, height: 965, category: 'vases', alt: 'Full arrangement of pink and purple roses, hydrangea and stock in a black urn' },
  { id: 'residential-32-1', src: '/images/portfolio/residential-32-1.jpg', width: 499, height: 436, category: 'homes', alt: 'Orange roses and orchids in gilded stands on a dining table' },
  { id: 'hotels-28-3', src: '/images/portfolio/hotels-28-3.jpg', width: 416, height: 583, category: 'hotels', alt: 'White orchid column inside a glass stand at a ceremony hall' },
  { id: 'bouquet-40-3', src: '/images/portfolio/bouquet-40-3.jpg', width: 746, height: 677, category: 'bouquets', alt: 'Large round hand bouquet of red spray roses and eucalyptus in kraft paper' },
  { id: 'wedding-07-1', src: '/images/portfolio/wedding-07-1.jpg', width: 326, height: 408, category: 'weddings', alt: 'Long wedding table with pink roses, gypsophila and white flowers down the centre' },
  { id: 'vases-19-0', src: '/images/portfolio/vases-19-0.jpg', width: 408, height: 576, category: 'vases', alt: 'White roses, orchids and snapdragons in a twisted marble-effect vase' },
  { id: 'residential-32-2', src: '/images/portfolio/residential-32-2.jpg', width: 292, height: 416, category: 'homes', alt: 'Two green vases of orange cymbidium orchids on a console beside a lamp' },
  { id: 'bouquet-40-4', src: '/images/portfolio/bouquet-40-4.jpg', width: 724, height: 656, category: 'bouquets', alt: 'Oversized bouquet of dark red roses held in kraft paper wrap' },
  { id: 'wedding-08-1', src: '/images/portfolio/wedding-08-1.jpg', width: 1000, height: 708, category: 'weddings', alt: 'Wedding table decorated with purple and pink flowers, wood slices and glass plates', trim: true },
  { id: 'vases-20-0', src: '/images/portfolio/vases-20-0.jpg', width: 819, height: 1152, category: 'vases', alt: 'White phalaenopsis orchids and ranunculus in a carved crystal vase' },
  { id: 'residential-33-1', src: '/images/portfolio/residential-33-1.jpg', width: 880, height: 534, category: 'homes', alt: 'Dining table centrepiece of deep red roses, ornamental kale and green hydrangea with candles' },
  { id: 'wedding-09-1', src: '/images/portfolio/wedding-09-1.jpg', width: 809, height: 563, category: 'weddings', alt: 'Round banquet table with pink and orange flowers on a tree stump and pine cones' },
  { id: 'vases-21-0', src: '/images/portfolio/vases-21-0.jpg', width: 819, height: 1152, category: 'vases', alt: 'Tall white phalaenopsis orchids in a frosted glass vase' },
  { id: 'residential-34-1', src: '/images/portfolio/residential-34-1.jpg', width: 858, height: 522, category: 'homes', alt: 'Long centrepiece of orange roses, calla lilies and green hydrangea' },
  { id: 'wedding-10-1', src: '/images/portfolio/wedding-10-1.jpg', width: 795, height: 554, category: 'weddings', alt: 'Ballroom with hanging crystal strands above a large dome of pink roses' },
  { id: 'vases-22-0', src: '/images/portfolio/vases-22-0.jpg', width: 704, height: 987, category: 'vases', alt: 'Dome of orange chrysanthemums in a glass bowl vase' },
  { id: 'residential-35-1', src: '/images/portfolio/residential-35-1.jpg', width: 733, height: 389, category: 'homes', alt: 'Pair of tall urn arrangements with pampas grass and lilac flowers flanking a home entrance' },
  { id: 'wedding-11-1', src: '/images/portfolio/wedding-11-1.jpg', width: 521, height: 511, category: 'weddings', alt: 'Sweetheart table with trailing white flowers and clusters of glass candle holders' },
  { id: 'vases-23-0', src: '/images/portfolio/vases-23-0.jpg', width: 542, height: 581, category: 'vases', alt: 'Yellow roses, white anthurium and orchids with craspedia in a tall vase' },
  { id: 'residential-36-1', src: '/images/portfolio/residential-36-1.jpg', width: 959, height: 1194, category: 'homes', alt: 'Asymmetric arrangement of pink orchids, proteas and roses in a white bowl vase' },
  { id: 'vases-24-1', src: '/images/portfolio/vases-24-1.jpg', width: 737, height: 689, category: 'vases', alt: 'Low arrangement of peach and cream garden roses with orchids in a gold bowl' },
  { id: 'residential-36-2', src: '/images/portfolio/residential-36-2.jpg', width: 857, height: 1047, category: 'homes', alt: 'Red and peach rose arrangement in a gold urn with trailing orchids' },
  { id: 'vases-25-0', src: '/images/portfolio/vases-25-0.jpg', width: 416, height: 390, category: 'vases', alt: 'Pair of white textured vases with pale pink orchids and looped grass' },
  { id: 'residential-37-1', src: '/images/portfolio/residential-37-1.jpg', width: 481, height: 640, category: 'homes', alt: 'Tall arrangement of white hydrangea, lilac flowers and bare branches in a silver urn at a staircase' },
  { id: 'vases-25-1', src: '/images/portfolio/vases-25-1.jpg', width: 601, height: 561, category: 'vases', alt: 'Candle centrepiece ringed with magenta roses and purple orchids' },
  { id: 'vases-25-2', src: '/images/portfolio/vases-25-2.jpg', width: 566, height: 534, category: 'vases', alt: 'White calla lilies and gypsophila over a glass bowl of green stems' },
  { id: 'vases-25-3', src: '/images/portfolio/vases-25-3.jpg', width: 597, height: 563, category: 'vases', alt: 'Orange calla lilies in a shallow glass bowl against a mirrored gold wall' },
];

const byId = new Map(PORTFOLIO_ITEMS.map((i) => [i.id, i]));

/** Look a photo up by id (throws at build time if an id is mistyped). */
export function photo(id: string): PortfolioItem {
  const item = byId.get(id);
  if (!item) throw new Error(`Unknown portfolio photo: ${id}`);
  return item;
}
