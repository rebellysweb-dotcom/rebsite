'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Renders storefront chrome (nav, footer, cart, background) everywhere except the admin area. */
export default function StoreOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return <>{children}</>;
}
