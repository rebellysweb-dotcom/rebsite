'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './SuccessPage.module.css';
import { SHOP, telHref, whatsappHref } from '@/lib/shop';
import { formatUsd } from '@/lib/utils';
import { DELIVERY_NOTE } from '@/lib/storefront';

interface OrderSnapshot {
  orderNumber?: string;
  items?: { name: string; quantity: number; priceUsd?: number | null }[];
  subtotalUsd?: number;
  customerPhone?: string;
  hasEmail?: boolean;
  cardMessage?: string;
  paymentMethod?: string;
  customerName?: string;
  fulfillment?: string;
  deliveryDate?: string;
  deliveryTime?: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const [snapshot, setSnapshot] = useState<OrderSnapshot | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let data: OrderSnapshot = {};
    try {
      const raw = sessionStorage.getItem('rebellys_order_snapshot');
      if (raw) {
        data = JSON.parse(raw);
        sessionStorage.removeItem('rebellys_order_snapshot');
      }
    } catch {
      // ignore parse errors
    }
    // URL param fallback for orderNumber
    if (!data.orderNumber) {
      const paramOrder = searchParams.get('order');
      if (paramOrder) data.orderNumber = paramOrder;
    }
    setSnapshot(Object.keys(data).length > 0 ? data : null);
    setLoaded(true);
  }, [searchParams]);

  const handleCopy = () => {
    if (snapshot?.orderNumber) {
      navigator.clipboard.writeText(snapshot.orderNumber).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (!loaded) return null;

  if (!snapshot?.orderNumber) {
    return (
      <div className={styles.card}>
        <div className={styles.noOrder}>
          <p>We could not find an order on this screen.</p>
          <p style={{ fontSize: '0.95rem' }}>If you just placed one, we have it. Call or WhatsApp us on <a href={telHref} style={{ color: 'var(--rose-700)', fontWeight: 600 }}>{SHOP.phoneDisplay}</a>.</p>
          <Link href="/collections" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
            Browse Collections
          </Link>
        </div>
      </div>
    );
  }

  const hasItems = Array.isArray(snapshot.items) && snapshot.items.length > 0;
  const hasScheduling = snapshot.deliveryDate || snapshot.deliveryTime;
  const isWhish = snapshot.paymentMethod === 'whish';

  return (
    <div className={styles.card}>
      {/* Animated checkmark */}
      <div className={styles.checkWrap}>
        <span className={styles.checkmark}>&#10003;</span>
      </div>

      {/* Title */}
      <h1 className={styles.title}>Order received</h1>

      {snapshot.customerName && (
        <p className={styles.subtitle}>
          Thank you, {snapshot.customerName}. We have your order and will confirm it with you shortly.
        </p>
      )}
      {!snapshot.customerName && (
        <p className={styles.subtitle}>
          Thank you for your order. We will confirm it with you shortly.
        </p>
      )}

      {/* Order number */}
      <div className={styles.orderNumRow}>
        <span>{snapshot.orderNumber}</span>
        <button className={styles.copyBtn} onClick={handleCopy} style={{ minHeight: '44px', minWidth: '44px' }} aria-label="Copy order number">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Items list */}
      {hasItems && (
        <div className={styles.nextSteps} style={{ textAlign: 'left', marginTop: '28px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Items Ordered</h3>
          <ol className={styles.itemsList}>
            {snapshot.items!.map((item, i) => (
              <li key={i}>
                {item.name} &times; {item.quantity}
                {item.priceUsd != null && (item.priceUsd === 0 ? ' · Free' : ` · ${formatUsd(item.priceUsd * item.quantity)}`)}
              </li>
            ))}
          </ol>
          {typeof snapshot.subtotalUsd === 'number' && snapshot.subtotalUsd > 0 && (
            <p style={{ fontSize: '0.9rem', marginTop: '12px', fontWeight: 600 }}>
              Items subtotal: {formatUsd(snapshot.subtotalUsd)}
              <span style={{ display: 'block', fontWeight: 400, color: 'var(--text-muted)' }}>
                {snapshot.fulfillment === 'pickup' ? 'Pickup, no delivery fee.' : DELIVERY_NOTE} We confirm the final total by phone.
              </span>
            </p>
          )}
          {snapshot.cardMessage && (
            <p style={{ fontSize: '0.9rem', marginTop: '12px', color: 'var(--text-muted)' }}>
              Card message: <em>{snapshot.cardMessage}</em>
            </p>
          )}
        </div>
      )}

      {/* Scheduling info */}
      {hasScheduling && (
        <div className={styles.nextSteps} style={{ textAlign: 'left', marginTop: '16px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>{snapshot.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'} wish</h3>
          {snapshot.deliveryDate && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Date: <strong>{snapshot.deliveryDate}</strong>
            </p>
          )}
          {snapshot.deliveryTime && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Time: <strong>{snapshot.deliveryTime}</strong>
            </p>
          )}
        </div>
      )}

      {/* Payment info */}
      <div className={styles.whishBox}>
        <p className={styles.whishTitle}>What happens next?</p>
        <div className={styles.whishStep}>
          <span>1.</span>
          <span>We call or WhatsApp {snapshot.customerPhone ? <strong>{snapshot.customerPhone}</strong> : 'you'} to confirm the final total, {snapshot.fulfillment === 'pickup' ? 'and when it will be ready' : 'the delivery fee and the time'}.</span>
        </div>
        {isWhish ? (
          <div className={styles.whishStep}>
            <span>2.</span>
            {/* TODO(owner): confirm the Whish number and when to pay. Until then this shows the shop number, as before. */}
            <span>After we confirm, pay with Whish to <strong>{SHOP.phoneDisplay}</strong>. Write order # <strong>{snapshot.orderNumber}</strong> in the note.</span>
          </div>
        ) : (
          <div className={styles.whishStep}>
            <span>2.</span>
            <span>Pay cash when you {snapshot.fulfillment === 'pickup' ? 'collect it' : 'receive it'}.</span>
          </div>
        )}
        <div className={styles.whishStep}>
          <span>3.</span>
          <span>{snapshot.fulfillment === 'pickup' ? `Collect it at ${SHOP.address}.` : 'We deliver it to you.'}</span>
        </div>
        {snapshot.hasEmail && (
          <div className={styles.whishStep}>
            <span>&#9993;</span>
            <span>A copy of your order is on its way to your email.</span>
          </div>
        )}
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Tip: take a screenshot of this page. Your order number is {snapshot.orderNumber}.
        </p>
      </div>

      {/* WhatsApp + call, with the order number pre-filled */}
      <div style={{ marginTop: '28px', display: 'flex', gap: '12px 24px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a
          href={whatsappHref(`Hello Rebelly's, about my order ${snapshot.orderNumber}: `)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappLink}
          style={{ minHeight: '44px' }}
        >
          <span aria-hidden="true">&#128172;</span>
          <span>Message us on WhatsApp</span>
        </a>
        <a href={telHref} className={styles.whatsappLink} style={{ minHeight: '44px', color: 'var(--rose-700)' }}>
          <span aria-hidden="true">&#128222;</span>
          <span>Call {SHOP.phoneDisplay}</span>
        </a>
      </div>

      {/* CTA buttons */}
      <div className={styles.actions}>
        <Link href="/collections" className="btn btn-primary">
          Continue Shopping
        </Link>
        <Link href="/" className="btn btn-outline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="page-shell">
      <main className={styles.main}>
        <div className="container">
          <Suspense fallback={
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div className="spinner spinner-rose" style={{ margin: '0 auto' }} />
            </div>
          }>
            <SuccessContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
