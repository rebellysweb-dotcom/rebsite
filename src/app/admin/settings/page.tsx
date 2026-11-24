'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SiteSettings } from '@/types';
import styles from '../admin.module.css';

const FIELDS: { key: keyof SiteSettings; label: string; type?: string; help?: string }[] = [
  { key: 'lbp_rate', label: 'USD to LBP rate', type: 'number', help: 'Current market rate used for LBP price display' },
  { key: 'whish_number', label: 'Whish Money number', help: 'Number shown to customers for Whish payments' },
  { key: 'whatsapp_number', label: 'WhatsApp number', help: 'Used for WhatsApp order messages (no + prefix, e.g. 96176585028)' },
  { key: 'shop_phone', label: 'Shop phone', help: 'Displayed in footer and contact pages' },
  { key: 'shop_address', label: 'Shop address', help: 'Physical store address' },
  { key: 'shop_email', label: 'Shop email', type: 'email', help: 'Public contact email' },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [original, setOriginal] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setOriginal(data.settings);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setOriginal(data.settings);
        setMessage({ type: 'success', text: 'Settings saved.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(original);
    setMessage(null);
  };

  if (loading) {
    return <p className={styles.loading} role="status">Loading settings</p>;
  }

  return (
    <>
      <header className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageMeta}>
            Currency rate, payment numbers and shop contact details. Changes go live as soon as you save.
          </p>
        </div>
        <div className={styles.headerActions}>
          {hasChanges && (
            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleReset}>
              Discard changes
            </button>
          )}
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </header>

      {message && (
        <div
          className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <div className={`${styles.card} ${styles.narrow}`}>
        <div className={styles.formGrid}>
          {FIELDS.map(({ key, label, type, help }) => (
            <div className={styles.field} key={key}>
              <label className={styles.label} htmlFor={`settings-${key}`}>{label}</label>
              <input
                id={`settings-${key}`}
                name={key}
                className={styles.input}
                type={type ?? 'text'}
                value={(settings[key] as string) ?? ''}
                aria-describedby={help ? `settings-${key}-help` : undefined}
                onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
              />
              {help && (
                <span id={`settings-${key}-help`} className={styles.help}>
                  {help}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
