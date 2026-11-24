import styles from './admin.module.css';
import type { OrderStatus, PaymentStatus } from '@/types';

// One status-to-token mapping for every admin page.
export const ORDER_BADGE: Record<OrderStatus, string> = {
  pending: styles.badgePending,
  confirmed: styles.badgeConfirmed,
  preparing: styles.badgePreparing,
  ready: styles.badgeReady,
  delivered: styles.badgeDelivered,
  cancelled: styles.badgeCancelled,
};

export const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  pending: styles.badgePending,
  confirmed: styles.badgeConfirmed,
  paid: styles.badgePaid,
  failed: styles.badgeFailed,
};

export function orderBadge(status: string): string {
  return `${styles.badge} ${ORDER_BADGE[status as OrderStatus] ?? styles.badgeNeutral}`;
}

export function paymentBadge(status: string): string {
  return `${styles.badge} ${PAYMENT_BADGE[status as PaymentStatus] ?? styles.badgeNeutral}`;
}
