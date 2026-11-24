'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Only same-origin relative paths. Blocks protocol-relative and absolute URLs.
function safeRedirect(value: string | null): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/admin';
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
    <main style={{ maxWidth: 360, margin: '96px auto', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 24 }}>Admin sign in</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label" htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            className="form-input"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label" htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            className="form-input"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" style={{ color: '#b91c1c', marginBottom: 14 }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
