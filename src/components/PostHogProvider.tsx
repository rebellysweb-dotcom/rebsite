'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';

/**
 * Tracks SPA route changes as PostHog $pageview events (App Router doesn't
 * fire full page loads on client navigation, so we capture manually).
 */
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !(posthog as unknown as { __loaded?: boolean }).__loaded) return;
    let url = window.location.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += '?' + qs;
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Initializes PostHog on the client. No-ops gracefully when
 * NEXT_PUBLIC_POSTHOG_KEY is not set, so the app still runs without analytics.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || (posthog as unknown as { __loaded?: boolean }).__loaded) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      capture_pageview: false, // handled by PageviewTracker for App Router
      capture_pageleave: true,
      person_profiles: 'identified_only',
    });
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </>
  );
}
