import { dbQuery, dbQueryOne } from '@/lib/db';
import Link from 'next/link';
import type { OrderStatus } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export const metadata = {
  title: 'Dashboard | Rebellys Admin',
};

// D1 timestamps are 'YYYY-MM-DD HH:MM:SS' in UTC (datetime('now')).
const parseD1Date = (s: string) => new Date(s.replace(' ', 'T') + 'Z');

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div
      className="admin-card"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: '1.8rem' }}>{icon}</span>
        <span style={{ fontSize: '2rem', fontFamily: 'var(--ff-display)', fontWeight: 700, color }}>
          {value}
        </span>
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </p>
    </div>
  );
}

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  preparing: 'status-preparing',
  ready: 'status-ready',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

type RecentOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  order_status: string;
  payment_status: string;
  total_usd: number | null;
  created_at: string;
};

export default async function AdminDashboardPage() {
  const [
    pendingRow,
    totalRow,
    productRow,
    todayRow,
    revenueRow,
    recentOrders,
  ] = await Promise.all([
    dbQueryOne<{ count: number }>("SELECT COUNT(*) as count FROM orders WHERE order_status = 'pending'"),
    dbQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders'),
    dbQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE is_active = 1'),
    dbQueryOne<{ count: number }>("SELECT COUNT(*) as count FROM orders WHERE created_at >= date('now')"),
    dbQueryOne<{ total: number }>(
      "SELECT COALESCE(SUM(total_usd), 0) AS total FROM orders WHERE created_at >= date('now', 'start of month') AND order_status != 'cancelled'"
    ),
    dbQuery<RecentOrder>('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5'),
  ]);

  const pendingCount = pendingRow?.count ?? 0;
  const totalOrders = totalRow?.count ?? 0;
  const productCount = productRow?.count ?? 0;
  const todayCount = todayRow?.count ?? 0;
  const monthRevenue = revenueRow?.total ?? 0;

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Dashboard</h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard label="Pending Orders" value={pendingCount} icon="⏳" color="var(--rose-500)" />
        <StatCard label="Total Orders" value={totalOrders} icon="🧾" color="#0369a1" />
        <StatCard label="Active Products" value={productCount} icon="🌷" color="#b45309" />
        <StatCard label="Orders Today" value={todayCount} icon="📦" color="#6d28d9" />
        <StatCard label="Revenue This Month" value={`$${monthRevenue.toFixed(0)}`} icon="💰" color="#059669" />
      </div>

      {/* Recent Orders */}
      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: '1.15rem', fontWeight: 700 }}>Recent Orders</h2>
          <Link href="/admin/orders" className="btn btn-outline btn-sm">View All</Link>
        </div>

        {recentOrders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--rose-700)' }}>
                      <Link href={`/admin/orders/${order.id}`}>{order.order_number}</Link>
                    </td>
                    <td>{order.customer_name}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[order.order_status as OrderStatus] ?? 'badge-muted'}`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${order.payment_status === 'paid' ? 'badge-green' : 'badge-muted'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>${(order.total_usd ?? 0).toFixed(2)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {parseD1Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌸</div>
            <p>No orders yet. They&apos;ll appear here once customers start ordering.</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <Link href="/admin/products" className="btn btn-primary">+ Add Product</Link>
        <Link href="/admin/events" className="btn btn-outline">+ Create Event</Link>
        <Link href="/admin/orders" className="btn btn-outline">View All Orders</Link>
      </div>
    </>
  );
}
