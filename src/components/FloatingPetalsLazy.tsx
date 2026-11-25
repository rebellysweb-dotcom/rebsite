'use client';

import dynamic from 'next/dynamic';

// Client-only: petal positions are random, so they must not render on the server.
const FloatingPetals = dynamic(() => import('./FloatingPetals'), { ssr: false });

export default function FloatingPetalsLazy() {
  return <FloatingPetals />;
}
