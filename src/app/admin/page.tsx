import { headers } from 'next/headers';
import { dbQuery, dbQueryOne } from '@/lib/db';
import { assertAdminPage } from '@/lib/auth/session';
import Link from 'next/link';
import styles from './admin.module.css';
import { orderBadge, paymentBadge } from './badges';
import Icon from '@/app/admin/_ui/Icon';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Dashboard | Rebelly's Admin",
};

// D1 timestamps are 'YYYY-MM-DD HH:MM:SS' in UTC (datetime('now')).
const parseD1Date = (s: string) => new Date(s.replace(' ', 'T') + 'Z');

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className={`${styles.stat} ${accent ? styles.statAccent : ''}`}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
    </div>
  );
}

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
  // The layout gate runs in parallel with this page, so guard here before any query.
  await assertAdminPage(await headers());

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
      <header className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageMeta}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/products" className={`${styles.btn} ${styles.btnPrimary}`}><Icon name="plus" size={18} />Add product</Link>
          <Link href="/admin/events" className={`${styles.btn} ${styles.btnSecondary}`}><Icon name="calendar" size={18} />Create event</Link>
        </div>
      </header>

      <section className={styles.stats} aria-label="Summary">
        <StatCard label="Pending orders" value={pendingCount} accent />
        <StatCard label="Orders today" value={todayCount} />
        <StatCard label="Total orders" value={totalOrders} />
        <StatCard label="Active products" value={productCount} />
        <StatCard label="Revenue this month" value={`$${monthRevenue.toFixed(0)}`} />
      </section>

      <section className={`${styles.card} ${styles.cardFlush}`}>
        <div className={`${styles.cardHead} ${styles.cardHeadPad}`}>
          <h2 className={styles.cardTitle}>Recent orders</h2>
          <Link href="/admin/orders" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}>View all orders<Icon name="arrow-right" size={16} motion="nudge" /></Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className={styles.right}>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className={styles.orderLink}>{order.order_number}</Link>
                    </td>
                    <td>{order.customer_name}</td>
                    <td>
                      <span className={orderBadge(order.order_status)}>{order.order_status}</span>
                    </td>
                    <td>
                      <span className={paymentBadge(order.payment_status)}>{order.payment_status}</span>
                    </td>
                    <td className={styles.money}>${(order.total_usd ?? 0).toFixed(2)}</td>
                    <td className={`${styles.num} ${styles.muted}`}>
                      {parseD1Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No orders yet</p>
            <p className={styles.emptyText}>Orders will show up here as soon as a customer places one.</p>
          </div>
        )}
      </section>
    </>
  );
}
