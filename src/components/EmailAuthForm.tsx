'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './EmailAuthForm.module.css';

type Mode = 'signin' | 'signup';

export default function EmailAuthForm({ redirectTo = '/account' }: { redirectTo?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSent(false);
    setPassword('');
    setConfirm('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === 'signin') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : err.message);
        setLoading(false);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } else {
      if (password !== confirm) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        setLoading(false);
        return;
      }
      const origin = window.location.origin;
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
      } else {
        setSent(true);
        setLoading(false);
      }
    }
  }

  async function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault();

    if (!email.trim()) {
      setError('Enter your email address first.');
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const origin = window.location.origin;

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/api/auth/callback?next=/account`,
    });

    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className={styles.successBox}>
        <div className={styles.successIcon}>📬</div>
        <strong>Check your inbox</strong>
        <p>We sent a confirmation link to <em>{email}</em>. Click it to activate your account.</p>
        <button type="button" className={styles.resend} onClick={() => { setSent(false); setMode('signin'); }}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          className={mode === 'signin' ? styles.tabActive : styles.tab}
          onClick={() => switchMode('signin')}
        >
          Sign In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          className={mode === 'signup' ? styles.tabActive : styles.tab}
          onClick={() => switchMode('signup')}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            className="form-input"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            className="form-input"
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={8}
            placeholder={mode === 'signup' ? 'At least 8 characters' : ''}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {mode === 'signin' && (
            <div style={{ textAlign: 'right', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-rose-600, #e11d48)',
                  fontSize: '0.875rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>

        {mode === 'signup' && (
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="auth-confirm">Confirm Password</label>
            <input
              id="auth-confirm"
              type="password"
              className="form-input"
              required
              autoComplete="new-password"
              minLength={8}
              placeholder="Repeat your password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>
        )}

        {error && (
          <p className={styles.error} role="alert" aria-live="assertive">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '4px' }}
          disabled={loading}
        >
          {loading
            ? <span className="spinner" aria-hidden="true" />
            : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
