'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

const STATUS_OPTIONS: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled',
];

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  preparing: 'status-preparing',
  ready: 'status-ready',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrder = async (id: string, updates: Partial<Pick<Order, 'order_status' | 'payment_status' | 'whatsapp_sent'>>) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.order) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data.order } : o)));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="admin-topbar">
        <h1 className="admin-page-title">Orders</h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {total} total order{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', ...STATUS_OPTIONS].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize', minHeight: 34, padding: '6px 14px' }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <input
              className="form-input"
              placeholder="Search order # or name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ width: 220, minHeight: 36, padding: '6px 12px' }}
            />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner spinner-rose" style={{ margin: '0 auto' }} />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌸</div>
            <p>No orders found.</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Total</th>
                <th>WhatsApp</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--rose-700)' }}>
                    {order.order_number}
                  </td>
                  <td>{order.customer_name}</td>
                  <td style={{ fontSize: '0.82rem' }}>{order.customer_phone}</td>
                  <td>
                    <span className={`badge ${order.fulfillment === 'delivery' ? 'badge-rose' : 'badge-muted'}`}>
                      {order.fulfillment}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${order.payment_status === 'paid' ? 'badge-green' : 'badge-muted'}`}>
                      {order.payment_method} · {order.payment_status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      value={order.order_status}
                      disabled={updatingId === order.id}
                      onChange={(e) => updateOrder(order.id, { order_status: e.target.value as OrderStatus })}
                      style={{ padding: '4px 28px 4px 8px', fontSize: '0.8rem', minHeight: 'unset' }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ fontWeight: 600 }}>${(order.total_usd ?? 0).toFixed(2)}</td>
                  <td>
                    <button
                      title={order.whatsapp_sent ? 'Mark as not sent' : 'Mark as sent'}
                      onClick={() => updateOrder(order.id, { whatsapp_sent: !order.whatsapp_sent })}
                      disabled={updatingId === order.id}
                      style={{
                        fontSize: '1.2rem',
                        opacity: order.whatsapp_sent ? 1 : 0.3,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      💬
                    </button>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className="btn btn-outline btn-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.5rem 0 0.5rem' }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {page} of {pages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
