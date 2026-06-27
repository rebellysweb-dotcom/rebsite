import { Metadata } from 'next';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import EmailAuthForm from '@/components/EmailAuthForm';
import styles from './LoginPage.module.css';

export const metadata: Metadata = {
  title: 'Sign In | Rebelly\'s Flower Shop',
  description: 'Log in to your Rebelly\'s account to manage your orders and profile.',
};

function safeRedirect(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) {
    return raw;
  }
  return '/account';
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string | string[] };
}) {
  const redirectTo = safeRedirect(searchParams.redirectTo);

  return (
    <div className="page-shell">
      <main className={styles.main}>
        <div className={styles.blob} aria-hidden="true" />

        <div className="container">
          <div className={styles.contentWrap}>
            <div className={styles.loginCard}>
              <header className={styles.header}>
                <div className={styles.logo}>✿</div>
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

                <div className={styles.divider} style={{ marginTop: '24px' }}>
                  <span>or browse as guest</span>
                </div>

                <div className={styles.actions}>
                  <Link href="/collections" className="btn btn-outline" style={{ width: '100%' }}>
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
