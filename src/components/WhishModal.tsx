'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { SiteSettings } from '@/types';
import { formatUsd, usdToLbp } from '@/lib/utils';
import styles from './WhishModal.module.css';

interface WhishModalProps {
  isOpen:        boolean;
  onClose:       () => void;
  totalUsd:      number;
  orderNumber:   string;
  settings:      SiteSettings;
}

export default function WhishModal({
  isOpen,
  onClose,
  totalUsd,
  orderNumber,
  settings,
}: WhishModalProps) {
  const [copied, setCopied] = useState<'number' | 'amount' | null>(null);
  const modalRef  = useRef<HTMLDivElement>(null);
  const closeRef  = useRef<HTMLButtonElement>(null);

  const lbpRate = parseFloat(settings.lbp_rate) || 89500;
  const lbpAmount = usdToLbp(totalUsd, lbpRate);
  const whishNum  = settings.whish_number;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const el = modalRef.current;
      if (!el) return;
      const focusable = el.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first?.focus();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setCopied(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  async function copyToClipboard(text: string, which: 'number' | 'amount') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback silent fail — not critical
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-wrap" role="presentation">
      {/* Backdrop */}
      <div className="overlay" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whish-modal-title"
        aria-describedby="whish-modal-desc"
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className={styles.whishLogo} aria-hidden="true">
              <span className={styles.whishIcon}>📱</span>
              <span className={styles.whishBrand}>Whish Payment</span>
            </div>
            <h2 id="whish-modal-title" className="modal-title">
              Complete Your Payment
            </h2>
          </div>
          <button
            ref={closeRef}
            className="drawer-close"
            onClick={onClose}
            aria-label="Close payment instructions"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p id="whish-modal-desc" className={styles.intro}>
            Send the exact amount to our Whish number, then screenshot your
            payment and send it to us on WhatsApp to confirm your order.
          </p>

          {/* Order reference */}
          <div className={styles.orderRef}>
            <span className={styles.orderLabel}>Order Reference</span>
            <strong className={styles.orderNum}>{orderNumber}</strong>
          </div>

          {/* Steps */}
          <ol className={styles.steps} aria-label="Payment steps">
            {/* Step 1: Open Whish */}
            <li className={styles.step}>
              <span className={styles.stepNum} aria-hidden="true">1</span>
              <div className={styles.stepBody}>
                <strong className={styles.stepTitle}>Open the Whish app</strong>
                <p className={styles.stepDesc}>Tap <em>Send Money</em> → <em>Mobile Number</em></p>
              </div>
            </li>

            {/* Step 2: Enter number */}
            <li className={styles.step}>
              <span className={styles.stepNum} aria-hidden="true">2</span>
              <div className={styles.stepBody}>
                <strong className={styles.stepTitle}>Send to our number</strong>
                <div className={styles.copyRow}>
                  <span className={styles.copyValue} aria-label={`Whish number: ${whishNum}`}>
                    {whishNum}
                  </span>
                  <button
                    className={`btn btn-sm ${styles.copyBtn}`}
                    onClick={() => copyToClipboard(whishNum, 'number')}
                    aria-label="Copy Whish number"
                    aria-live="polite"
                  >
                    {copied === 'number' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </li>

            {/* Step 3: Amount */}
            <li className={styles.step}>
              <span className={styles.stepNum} aria-hidden="true">3</span>
              <div className={styles.stepBody}>
                <strong className={styles.stepTitle}>Enter the amount</strong>
                <div className={styles.amounts}>
                  <div className={styles.amountCard}>
                    <span className={styles.amountLabel}>USD</span>
                    <span className={styles.amountValue}>{formatUsd(totalUsd)}</span>
                  </div>
                  <span className={styles.orDivider} aria-hidden="true">or</span>
                  <div className={styles.amountCard}>
                    <span className={styles.amountLabel}>LBP</span>
                    <span className={styles.amountValue}>{lbpAmount}</span>
                  </div>
                  <button
                    className={`btn btn-sm ${styles.copyBtn}`}
                    onClick={() => copyToClipboard(String(totalUsd), 'amount')}
                    aria-label="Copy USD amount"
                    aria-live="polite"
                  >
                    {copied === 'amount' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </li>

            {/* Step 4: Screenshot */}
            <li className={styles.step}>
              <span className={styles.stepNum} aria-hidden="true">4</span>
              <div className={styles.stepBody}>
                <strong className={styles.stepTitle}>Send receipt via WhatsApp</strong>
                <p className={styles.stepDesc}>
                  Screenshot your confirmation &amp; send to{' '}
                  <a
                    href={`https://wa.me/${settings.whatsapp_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.waLink}
                  >
                    {settings.shop_phone}
                  </a>{' '}
                  with your order number.
                </p>
              </div>
            </li>
          </ol>

          {/* Warning */}
          <div className="alert alert-info" role="note">
            <span aria-hidden="true">💡</span>
            <span>
              Your order is reserved for <strong>2 hours</strong> while payment is pending.
              Include your order number <strong>{orderNumber}</strong> in the WhatsApp message.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <a
            href={`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(
              `Hi! I just paid via Whish for order ${orderNumber}. Please find my payment receipt attached.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            aria-label="Open WhatsApp to send payment receipt"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Send Receipt via WhatsApp
          </a>
          <button className="btn btn-outline" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
