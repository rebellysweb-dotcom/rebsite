import { Metadata } from 'next';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import EmailAuthForm from '@/components/EmailAuthForm';
import styles from './LoginPage.module.css';

export const metadata: Metadata = {
  title: 'Sign In | Rebelly\'s Flower Shop',
  description: 'Log in to your Rebelly\'s account to manage your orders and profile.',
};

// True for backslashes and ASCII control characters (tab, CR, LF, NUL, DEL ...).
function hasUnsafeChar(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 0x1f || c === 0x7f || c === 0x5c) return true;
  }
  return false;
}

// Server-side: no window, so resolve against a fixed dummy origin and require it to stay unchanged.
// Backslashes, tabs, CR/LF and other control characters are rejected before parsing.
function safeRedirect(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  const fallback = '/account';
  if (typeof raw !== 'string' || raw.length > 2000) return fallback;
  if (hasUnsafeChar(raw) || !raw.startsWith('/') || raw.startsWith('//')) return fallback;
  // Browsers strip tab/CR/LF even when percent-encoded ("/%09/evil.test" becomes "//evil.test"), so check the decoded form too.
  let decoded: string;
  try { decoded = decodeURIComponent(raw); } catch { return fallback; }
  if (hasUnsafeChar(decoded) || decoded.startsWith('//')) return fallback;
  const base = 'http://redirect.invalid';
  try {
    const url = new URL(raw, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string | string[] }>;
}) {
  const { redirectTo: redirectToParam } = await searchParams;
  const redirectTo = safeRedirect(redirectToParam);

  return (
    <div className="page-shell">
      <main className={styles.main}>
        <div className={styles.blob} aria-hidden="true" />

        <div className="container">
          <div className={styles.contentWrap}>
            <div className={styles.loginCard}>
              <header className={styles.header}>
                <p className={styles.logo}>Rebelly&apos;s</p>
                <h1 className={styles.title}>Welcome Back</h1>
                <p className={styles.subtitle}>
                  Sign in to access your flower shop account
                </p>
              </header>

              <div className={styles.body}>
                <GoogleSignInButton redirectTo={redirectTo} />

                <div className={styles.divider}>
                  <span>or</span>
                </div>

                <EmailAuthForm redirectTo={redirectTo} />

                <div className={`${styles.divider} ${styles.dividerSpaced}`}>
                  <span>or browse as guest</span>
                </div>

                <div className={styles.actions}>
                  <Link href="/collections" className={`btn btn-outline ${styles.fullBtn}`}>
                    Continue Shopping
                  </Link>
                </div>
              </div>

              <footer className={styles.footer}>
                <p>
                  Need help?{' '}
                  <Link href="/contact" className={styles.link}>
                    Contact support
                  </Link>
                </p>
              </footer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
