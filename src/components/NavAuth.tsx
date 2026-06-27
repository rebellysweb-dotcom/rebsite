'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './Navbar.module.css';

/**
 * Auth control for the navbar: shows "Sign in" when logged out and
 * "Sign out" when logged in. Kept separate so Navbar stays presentational.
 */
export default function NavAuth({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const className = mobile ? styles.mobileLink : styles.link;

  // Avoid a flash of the wrong state before we know the session
  if (!ready) {
    return null;
  }

  if (!email) {
    return (
      <Link href="/auth/login" className={className}>
        Sign in
      </Link>
    );
  }

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail(null);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={signOut}
      className={className}
      aria-label={`Sign out (${email})`}
      style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
    >
      Sign out
    </button>
  );
}
