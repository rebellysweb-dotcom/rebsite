'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Order, OrderStatus } from '@/types';
import styles from '../admin.module.css';
import { paymentBadge } from '../badges';
import Icon from '@/app/admin/_ui/Icon';

const STATUS_OPTIONS: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled',
];

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
      <header className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <h1 className={styles.pageTitle}>Orders</h1>
          <p className={styles.pageMeta}>
            {total} order{total !== 1 ? 's' : ''} in total
          </p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup} role="group" aria-label="Filter by status">
          {['all', ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={statusFilter === s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`${styles.filterBtn} ${statusFilter === s ? styles.filterBtnActive : ''}`}
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className={styles.searchForm} role="search">
          <label htmlFor="order-search" className={styles.srOnly}>Search orders</label>
          <input
            id="order-search"
            name="search"
            className={`${styles.input} ${styles.searchInput}`}
            placeholder="Order number or customer name"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}><Icon name="search" size={18} />Search</button>
        </form>
      </div>

      <section className={`${styles.card} ${styles.cardFlush}`}>
        {loading ? (
          <p className={styles.loading} role="status">Loading orders</p>
        ) : orders.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No orders found</p>
            <p className={styles.emptyText}>Try a different status or search term.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.tableWide}`}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className={styles.right}>Total</th>
                  <th>WhatsApp</th>
                  <th>Date</th>
                  <th><span className={styles.srOnly}>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className={styles.orderLink}>{order.order_number}</Link>
                    </td>
                    <td className={styles.cellStrong}>
                      {order.customer_name}
                      <span className={`${styles.cellSub} ${styles.num}`}>{order.customer_phone}</span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeNeutral}`}>{order.fulfillment}</span>
                    </td>
                    <td>
                      <span className={paymentBadge(order.payment_status)}>
                        {order.payment_method} / {order.payment_status}
                      </span>
                    </td>
                    <td>
                      <select
                        aria-label={`Status for ${order.order_number}`}
                        className={`${styles.select} ${styles.selectCompact}`}
                        value={order.order_status}
                        disabled={updatingId === order.id}
                        onChange={(e) => updateOrder(order.id, { order_status: e.target.value as OrderStatus })}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className={styles.money}>${(order.total_usd ?? 0).toFixed(2)}</td>
                    <td>
                      <button
                        type="button"
                        aria-pressed={!!order.whatsapp_sent}
                        title={order.whatsapp_sent ? 'Mark as not sent' : 'Mark as sent'}
                        onClick={() => updateOrder(order.id, { whatsapp_sent: !order.whatsapp_sent })}
                        disabled={updatingId === order.id}
                        className={`${styles.toggle} ${order.whatsapp_sent ? styles.toggleOn : ''}`}
                      >
                        <Icon name={order.whatsapp_sent ? 'eye' : 'eye-off'} size={16} />
                        {order.whatsapp_sent ? 'Sent' : 'Not sent'}
                      </button>
                    </td>
                    <td className={`${styles.num} ${styles.muted} ${styles.small}`}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}>
                        <Icon name="eye" size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <nav className={styles.pagination} aria-label="Pagination">
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <Icon name="arrow-left" size={16} motion="nudge-back" />
              Previous
            </button>
            <span className={styles.num}>Page {page} of {pages}</span>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <Icon name="arrow-right" size={16} motion="nudge" />
            </button>
          </nav>
        )}
      </section>
    </>
  );
}
