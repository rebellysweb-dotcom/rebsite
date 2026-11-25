'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

// True for backslashes and ASCII control characters (tab, CR, LF, NUL, DEL ...).
function hasUnsafeChar(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 0x1f || c === 0x7f || c === 0x5c) return true;
  }
  return false;
}

// Only same-origin paths. Parsed with URL so tricks like "/%09/evil.test" or "/\evil.test" resolve
// to another origin and are rejected. Control characters and backslashes are refused outright.
function safeRedirect(value: string | null): string {
  if (!value || hasUnsafeChar(value) || !value.startsWith('/') || value.startsWith('//')) return '/admin';
  // Browsers strip tab/CR/LF even when percent-encoded ("/%09/evil.test" becomes "//evil.test"), so check the decoded form too.
  let decoded: string;
  try { decoded = decodeURIComponent(value); } catch { return '/admin'; }
  if (hasUnsafeChar(decoded) || decoded.startsWith('//')) return '/admin';
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return '/admin';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/admin';
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const redirectTo = safeRedirect(new URLSearchParams(window.location.search).get('redirect'));

    try {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setError(data.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError('Network error. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <span className={styles.wordmark}>Rebelly&apos;s</span>
          <span className={styles.sub}>Admin</span>
        </div>
        <h1 className={styles.title}>Sign in</h1>
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              className={styles.input}
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              className={styles.input}
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
