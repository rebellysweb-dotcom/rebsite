'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './SuccessPage.module.css';

interface OrderSnapshot {
  orderNumber?: string;
  items?: { name: string; quantity: number }[];
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
          <p>No order found.</p>
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
      <h1 className={styles.title}>Order Successful!</h1>

      {snapshot.customerName && (
        <p className={styles.subtitle}>
          Thank you, {snapshot.customerName}! Your order has been placed.
        </p>
      )}
      {!snapshot.customerName && (
        <p className={styles.subtitle}>
          Thank you for your order. We&apos;ll be in touch shortly.
        </p>
      )}

      {/* Order number */}
      <div className={styles.orderNumRow}>
        <span>{snapshot.orderNumber}</span>
        <button className={styles.copyBtn} onClick={handleCopy} title="Copy order number">
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
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Scheduling info */}
      {hasScheduling && (
        <div className={styles.nextSteps} style={{ textAlign: 'left', marginTop: '16px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>Delivery Schedule</h3>
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
          <span>Check your email for your order confirmation</span>
        </div>
        <div className={styles.whishStep}>
          <span>2.</span>
          <span>Our team will contact you to confirm the final price &amp; delivery details</span>
        </div>
        {isWhish && (
          <div className={styles.whishStep}>
            <span>3.</span>
            <span>Pay via Whish to <strong>+961 76 585 028</strong> — include order # <strong>{snapshot.orderNumber}</strong></span>
          </div>
        )}
        {!isWhish && (
          <div className={styles.whishStep}>
            <span>3.</span>
            <span>Pay cash upon {snapshot.fulfillment === 'pickup' ? 'pickup' : 'delivery'}</span>
          </div>
        )}
      </div>

      {/* WhatsApp link */}
      <div style={{ marginTop: '28px' }}>
        <a
          href="https://wa.me/96176585028"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappLink}
        >
          <span>&#128172;</span>
          <span>Questions? Chat with us</span>
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
