export function formatUsd(amount: number | null | undefined): string {
  if (amount == null) return 'Price on request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function usdToLbp(usd: number, rate: number): string {
  const lbp = usd * rate;
  return new Intl.NumberFormat('en-LB').format(Math.round(lbp)) + ' LL';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getBlurDataUrl(color = '#fcd8ec'): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
      <rect width="40" height="40" fill="${color}" />
      <path d="M20 10 Q25 5 30 10 Q35 15 30 20 Q35 25 30 30 Q25 35 20 30 Q15 35 10 30 Q5 25 10 20 Q5 15 10 10 Q15 5 20 10" fill="#f8aed6" opacity="0.3" />
    </svg>
  `.replace(/\s+/g, ' ');

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
