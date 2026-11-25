// The five verbatim Google Maps reviews (copied 2026-11-24, positive reviews only).
// Single source for /reviews and the home page. Do not edit the wording, do not
// paraphrase, and do not add reviews that are not on Google.
export interface Review {
  initial: string;
  color: string;
  name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  stars: string;
  text: string;
}

export const REVIEWS: Review[] = [
  {
    initial: 'T',
    color: 'linear-gradient(135deg, #e91e8c, #ff6b9d)',
    name: 'Tatiana Semaan',
    rating: 5,
    stars: '★★★★★',
    text: '"Great flower shop! I just told them the occasion and what I am looking for, and they prepared the perfect bouquet—full of fresh, beautiful flowers and nicely packaged. Fast, professional, and very friendly. Highly recommended!"',
  },
  {
    initial: 'C',
    color: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    name: 'Christian Hobeika',
    rating: 5,
    stars: '★★★★★',
    text: '"I ordered a bouquet from Rebellys, and it was fresh, and long-lasting! The owners were friendly and helpful, and delivery was fast. They even included a sweet handwritten note. Highly recommend for gorgeous flowers and plants!"',
  },
  {
    initial: 'E',
    color: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    name: 'Erash',
    rating: 5,
    stars: '★★★★★',
    text: '"Beautiful flower shop, charming and extremely helpful owners, incredible prices, variety in flowers, balloons etc. Do check if u pass by zalka!"',
  },
  {
    initial: 'Q',
    color: 'linear-gradient(135deg, #b45309, #f59e0b)',
    name: 'qosai ghawanmeh',
    rating: 5,
    stars: '★★★★★',
    text: '"Thank you so much for your kindness and warm hospitality! The flowers were beautiful, and your friendly service made the whole experience even better."',
  },
  {
    initial: 'S',
    color: 'linear-gradient(135deg, #059669, #34d399)',
    name: 'sam haddad',
    rating: 5,
    stars: '★★★★★',
    text: '"Flowers are fresh and look great. Amazing service, very helpful and kind."',
  },
];
