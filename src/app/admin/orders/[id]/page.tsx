'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import styles from '../../admin.module.css';
import { orderBadge } from '../../badges';
import Icon from '@/app/admin/_ui/Icon';

const STATUS_OPTIONS: OrderStatus[] = ['pending','confirmed','preparing','ready','delivered','cancelled'];
const PAYMENT_OPTIONS: PaymentStatus[] = ['pending','confirmed','paid','failed'];

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className={styles.defRow}>
      <dt className={styles.defTerm}>{label}</dt>
      <dd className={styles.defValue}>{value}</dd>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('pending');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then(r => r.json() as Promise<{ order?: Order }>)
      .then(d => {
        setOrder(d.order ?? null);
        setOrderStatus(d.order?.order_status ?? 'pending');
        setPaymentStatus(d.order?.payment_status ?? 'pending');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ order_status: orderStatus, payment_status: paymentStatus }),
    });
    const d = (await res.json()) as { order?: Order };
    if (d.order) setOrder(d.order);
    setSaving(false);
  };

  const toggleWA = async () => {
    if (!order) return;
    const res = await fetch(`/api/admin/orders/${id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ whatsapp_sent: !order.whatsapp_sent }),
    });
    const d = (await res.json()) as { order?: Order };
    if (d.order) setOrder(d.order);
  };

  if (loading) return <p className={styles.loading} role="status">Loading order</p>;
  if (!order) {
    return (
      <div className={`${styles.card} ${styles.empty}`}>
        <p className={styles.emptyTitle}>Order not found</p>
        <p className={styles.emptyText}>It may have been removed, or the link is wrong.</p>
        <div className={styles.emptyAction}>
          <Link href="/admin/orders" className={`${styles.btn} ${styles.btnSecondary}`}>Back to orders</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <Link href="/admin/orders" className={styles.backLink}><Icon name="arrow-left" size={16} motion="nudge-back" />Back to orders</Link>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>{order.order_number}</h1>
            <span className={orderBadge(order.order_status)}>{order.order_status}</span>
          </div>
          <p className={`${styles.pageMeta} ${styles.num}`}>{new Date(order.created_at).toLocaleString()}</p>
        </div>
      </header>

      <div className={styles.stack}>
        <div className={styles.twoCol}>
          <section className={styles.card}>
            <h2 className={`${styles.cardTitle} ${styles.cardTitleGap}`}>Customer</h2>
            <dl className={styles.defList}>
              <Row label="Name" value={order.customer_name} />
              <Row label="Phone" value={order.customer_phone} />
              <Row label="Email" value={order.customer_email} />
              <Row label="Occasion" value={order.occasion} />
              <Row label="Card message" value={order.card_message} />
              <Row label="Notes" value={order.notes} />
            </dl>
          </section>
          <section className={styles.card}>
            <h2 className={`${styles.cardTitle} ${styles.cardTitleGap}`}>{order.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}</h2>
            <dl className={styles.defList}>
              <Row label="Type" value={order.fulfillment} />
              <Row label="Address" value={order.delivery_address} />
              <Row label="Area" value={order.delivery_area} />
              <Row label="Date" value={order.delivery_date} />
              <Row label="Time" value={order.delivery_time} />
              <Row label="Payment" value={`${order.payment_method} / ${order.payment_status}`} />
            </dl>
          </section>
        </div>

        <section className={`${styles.card} ${styles.cardFlush}`}>
          <h2 className={`${styles.cardTitle} ${styles.cardHeadPad}`}>Items</h2>
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.tableGap}`}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className={styles.right}>Qty</th>
                  <th className={styles.right}>Unit</th>
                  <th className={styles.right}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(order.items ?? []).map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className={`${styles.num} ${styles.right}`}>{item.quantity}</td>
                    <td className={styles.money}>${(item.price_usd ?? 0).toFixed(2)}</td>
                    <td className={styles.money}>${((item.price_usd ?? 0) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td colSpan={3} className={styles.right}>Total</td>
                  <td className={styles.money}>${(order.total_usd ?? 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={`${styles.cardTitle} ${styles.cardTitleGap}`}>Update status</h2>
          <div className={styles.formInline}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="order-status">Order status</label>
              <select id="order-status" className={styles.select} value={orderStatus} onChange={e => setOrderStatus(e.target.value as OrderStatus)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="payment-status">Payment status</label>
              <select id="payment-status" className={styles.select} value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}>
                {PAYMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={toggleWA} aria-pressed={!!order.whatsapp_sent}>
              {order.whatsapp_sent ? 'WhatsApp sent (undo)' : 'Mark WhatsApp as sent'}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
