'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SHOP, whatsappHref } from '@/lib/shop';
import styles from './SuccessPage.module.css';
import Icon from '@/components/icons/Icon';

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
          <h1 className={styles.title}>No order found</h1>
          <p>Start a new order from the collection.</p>
          <Link href="/collections" className={`btn btn-primary ${styles.noOrderBtn}`}>
            Browse collections
            <Icon name="arrow-right" size={18} motion="nudge" />
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
      <p className={styles.eyebrow}>
        <span className={styles.seal}><Icon name="check" size={18} /></span>
        Order received
      </p>
      <h1 className={styles.title}>Thank you{snapshot.customerName ? `, ${snapshot.customerName}` : ''}.</h1>
      <p className={styles.subtitle}>
        Your order is with us. We will be in touch shortly to confirm it.
      </p>

      <div className={styles.orderNumRow}>
        <div>
          <span className={styles.orderLabel}>Order number</span>
          <span className={styles.orderNum}>{snapshot.orderNumber}</span>
        </div>
        <button type="button" className={styles.copyBtn} onClick={handleCopy}>
          <Icon name={copied ? 'check' : 'orders'} size={18} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {hasItems && (
        <section className={styles.block} aria-labelledby="items-title">
          <h2 id="items-title" className={styles.blockTitle}>Items ordered</h2>
          <ol className={styles.itemsList}>
            {snapshot.items!.map((item, i) => (
              <li key={i}>
                {item.name} <span className={styles.qty}>&times; {item.quantity}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {hasScheduling && (
        <section className={styles.block} aria-labelledby="schedule-title">
          <h2 id="schedule-title" className={styles.blockTitle}>Delivery schedule</h2>
          {snapshot.deliveryDate && (
            <p className={styles.meta}>Date: <strong>{snapshot.deliveryDate}</strong></p>
          )}
          {snapshot.deliveryTime && (
            <p className={styles.meta}>Time: <strong>{snapshot.deliveryTime}</strong></p>
          )}
        </section>
      )}

      <section className={styles.block} aria-labelledby="next-title">
        <h2 id="next-title" className={styles.blockTitle}>What happens next</h2>
        <ol className={styles.steps}>
          <li>Check your email for your order confirmation.</li>
          <li>Our team will contact you to confirm the final price and delivery details.</li>
          {isWhish ? (
            <li>
              Pay with Whish to <strong>{SHOP.phoneDisplay}</strong> and include order{' '}
              <strong>{snapshot.orderNumber}</strong>.
            </li>
          ) : (
            <li>Pay cash on {snapshot.fulfillment === 'pickup' ? 'pickup' : 'delivery'}.</li>
          )}
        </ol>
      </section>

      <p className={styles.help}>
        Questions?{' '}
        <a href={whatsappHref(`Hi Rebelly's, my order number is ${snapshot.orderNumber}`)} target="_blank" rel="noopener noreferrer" className={styles.whatsappLink}>
          <Icon name="whatsapp" size={18} />
          Message us on WhatsApp
        </a>
      </p>

      <div className={styles.actions}>
        <Link href="/collections" className="btn btn-primary">
          Continue shopping
          <Icon name="arrow-right" size={18} motion="nudge" />
        </Link>
        <Link href="/" className="btn btn-outline">
          <Icon name="arrow-left" size={18} motion="nudge-back" />
          Back to home
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
            <div className={styles.loading}>
              <div className={`spinner spinner-rose ${styles.spin}`} role="status" aria-label="Loading your order" />
            </div>
          }>
            <SuccessContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
