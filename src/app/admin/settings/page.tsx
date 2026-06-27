'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SiteSettings } from '@/types';

const FIELDS: { key: keyof SiteSettings; label: string; type?: string; help?: string }[] = [
  { key: 'lbp_rate', label: 'USD → LBP Rate', type: 'number', help: 'Current market rate used for LBP price display' },
  { key: 'whish_number', label: 'Whish Money Number', help: 'Number shown to customers for Whish payments' },
  { key: 'whatsapp_number', label: 'WhatsApp Number', help: 'Used for WhatsApp order messages (no + prefix, e.g. 96176585028)' },
  { key: 'shop_phone', label: 'Shop Phone', help: 'Displayed in footer and contact pages' },
  { key: 'shop_address', label: 'Shop Address', help: 'Physical store address' },
  { key: 'shop_email', label: 'Shop Email', type: 'email', help: 'Public contact email' },
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
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
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
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="spinner spinner-rose" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Settings</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {hasChanges && (
            <button className="btn btn-outline btn-sm" onClick={handleReset}>
              Discard Changes
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? <span className="spinner" /> : 'Save Settings'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} role="alert" style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      <div className="admin-card" style={{ maxWidth: 640 }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          These settings control live currency rates, payment numbers, and contact information shown to customers.
          Changes take effect immediately on save.
        </p>

        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {FIELDS.map(({ key, label, type, help }) => (
            <div className="form-group" key={key}>
              <label className="form-label" htmlFor={`settings-${key}`}>{label}</label>
              <input
                id={`settings-${key}`}
                className="form-input"
                type={type ?? 'text'}
                value={(settings[key] as string) ?? ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
              />
              {help && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
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
