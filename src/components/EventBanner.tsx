'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Event } from '@/types';
import Icon from './icons/Icon';
import styles from './EventBanner.module.css';

export default function EventBanner() {
  const [event, setEvent] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch('/api/events/active');
        if (!res.ok) return;
        const data = await res.json() as { event?: Event | null };
        if (!ignore && data?.event) setEvent(data.event);
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
          <span className={styles.lead} aria-hidden="true"><Icon name="events" size={22} /></span>
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
            <Icon name="arrow-right" size={18} motion="nudge" />
          </Link>

          <button
            className={styles.dismiss}
            onClick={() => setDismissed(true)}
            aria-label={`Dismiss ${event.name} banner`}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
