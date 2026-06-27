'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

const STATUS_OPTIONS: OrderStatus[] = ['pending','confirmed','preparing','ready','delivered','cancelled'];
const PAYMENT_OPTIONS: PaymentStatus[] = ['pending','confirmed','paid','failed'];
const STATUS_BADGE: Record<OrderStatus, string> = {
  pending:'status-pending',confirmed:'status-confirmed',preparing:'status-preparing',
  ready:'status-ready',delivered:'status-delivered',cancelled:'status-cancelled',
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display:'flex', gap:'1rem', padding:'9px 0', borderBottom:'1px solid rgba(45,10,30,.06)' }}>
      <span style={{ minWidth:130, fontSize:'0.78rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
      <span style={{ fontSize:'0.9rem' }}>{value}</span>
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
      .then(r => r.json())
      .then(d => {
        setOrder(d.order);
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
    const d = await res.json();
    if (d.order) setOrder(d.order);
    setSaving(false);
  };

  const toggleWA = async () => {
    if (!order) return;
    const res = await fetch(`/api/admin/orders/${id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ whatsapp_sent: !order.whatsapp_sent }),
    });
    const d = await res.json();
    if (d.order) setOrder(d.order);
  };

  if (loading) return <div style={{textAlign:'center',padding:'4rem'}}><div className="spinner spinner-rose" style={{margin:'0 auto'}} /></div>;
  if (!order) return <div style={{textAlign:'center',padding:'4rem'}}><p>Order not found.</p><Link href="/admin/orders" className="btn btn-outline" style={{marginTop:'1rem',display:'inline-flex'}}>← Back</Link></div>;

  return (
    <>
      <div className="admin-topbar">
        <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
          <Link href="/admin/orders" style={{color:'var(--text-muted)',fontSize:'1.3rem'}}>←</Link>
          <h1 className="admin-page-title">{order.order_number}</h1>
          <span className={`badge ${STATUS_BADGE[order.order_status]}`}>{order.order_status}</span>
        </div>
        <span style={{fontSize:'0.82rem',color:'var(--text-muted)'}}>{new Date(order.created_at).toLocaleString()}</span>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',marginBottom:'1.5rem'}}>
        <div className="admin-card">
          <h2 style={{fontFamily:'var(--ff-display)',fontSize:'1rem',marginBottom:'1rem',fontWeight:700}}>👤 Customer</h2>
          <Row label="Name" value={order.customer_name} />
          <Row label="Phone" value={order.customer_phone} />
          <Row label="Email" value={order.customer_email} />
          <Row label="Occasion" value={order.occasion} />
          <Row label="Card Message" value={order.card_message} />
          <Row label="Notes" value={order.notes} />
        </div>
        <div className="admin-card">
          <h2 style={{fontFamily:'var(--ff-display)',fontSize:'1rem',marginBottom:'1rem',fontWeight:700}}>🚚 {order.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}</h2>
          <Row label="Type" value={order.fulfillment} />
          <Row label="Address" value={order.delivery_address} />
          <Row label="Area" value={order.delivery_area} />
          <Row label="Date" value={order.delivery_date} />
          <Row label="Time" value={order.delivery_time} />
          <Row label="Payment" value={`${order.payment_method} — ${order.payment_status}`} />
        </div>
      </div>

      <div className="admin-card" style={{marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:'var(--ff-display)',fontSize:'1rem',marginBottom:'1rem',fontWeight:700}}>🌸 Items</h2>
        <table className="tbl">
          <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Subtotal</th></tr></thead>
          <tbody>
            {(order.items ?? []).map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>${(item.price_usd ?? 0).toFixed(2)}</td>
                <td style={{fontWeight:600}}>${((item.price_usd ?? 0) * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} style={{textAlign:'right',fontWeight:700}}>Total</td>
              <td style={{fontWeight:700,color:'var(--rose-700)'}}>${(order.total_usd ?? 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h2 style={{fontFamily:'var(--ff-display)',fontSize:'1rem',marginBottom:'1rem',fontWeight:700}}>✏️ Update Status</h2>
        <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',alignItems:'flex-end'}}>
          <div className="form-group">
            <label className="form-label">Order Status</label>
            <select className="form-select" value={orderStatus} onChange={e => setOrderStatus(e.target.value as OrderStatus)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Status</label>
            <select className="form-select" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}>
              {PAYMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" /> : 'Save'}
          </button>
          <button className={`btn ${order.whatsapp_sent ? 'btn-outline' : 'btn-dark'}`} onClick={toggleWA}>
            💬 {order.whatsapp_sent ? 'WA Sent ✓' : 'Mark WA Sent'}
          </button>
        </div>
      </div>
    </>
  );
}
