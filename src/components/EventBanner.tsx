'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Event } from '@/types';
import styles from './EventBanner.module.css';

export default function EventBanner() {
  const [event, setEvent] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Get the first active event — auto-activation handled by checking dates
        const now = new Date().toISOString();

        const { data: events } = await supabase
          .from('events')
          .select('*')
          .or(`is_active.eq.true,and(auto_activate_from.lte.${now},auto_deactivate_at.gte.${now})`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!ignore && events && events.length > 0) {
          setEvent(events[0]);
        }
      } catch {
        // Silently fail — banner is optional
      }
    }

    load();
    return () => { ignore = true; };
  }, []);

  if (!event || dismissed) return null;

  const bannerStyle = event.banner_color
    ? { '--banner-color': event.banner_color } as React.CSSProperties
    : undefined;

  return (
    <div
      className={styles.banner}
      style={bannerStyle}
      role="region"
      aria-label={`Special event: ${event.name}`}
    >
      {/* Background image */}
      {event.banner_image_url && (
        <div
          className={styles.bgImg}
          style={{ backgroundImage: `url(${event.banner_image_url})` }}
          aria-hidden="true"
        />
      )}

      <div className={`container ${styles.inner}`}>
        {/* Left: icon + copy */}
        <div className={styles.left}>
          <span className={styles.eventIcon} aria-hidden="true">🌸</span>
          <div className={styles.copy}>
            <strong className={styles.name}>{event.name}</strong>
            {event.description && (
              <span className={styles.desc}>{event.description}</span>
            )}
          </div>
        </div>

        {/* Right: CTA + dismiss */}
        <div className={styles.right}>
          <Link
            href={`/events/${event.slug}`}
            className={styles.cta}
            aria-label={`View ${event.name} special menu`}
          >
            {event.button_label ?? 'View Special Menu'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>

          <button
            className={styles.dismiss}
            onClick={() => setDismissed(true)}
            aria-label={`Dismiss ${event.name} banner`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
