// Application-level replacement for the Supabase RLS policies (D1 has no RLS).
//
// Every function is pure: the caller passes the identity and row facts, and gets a decision back.
// The service layer MUST call the matching check before any D1 read or write.
// Deny by default: a check that is not called is a hole.
//
// Table coverage (cloudflare/migrations/0001_init.sql). Admin routes call guardAdmin() -> canWriteAdminContent
// before ANY read or write, so every admin-touched table is gated by the admin role from the verified session:
//   products, events, event_products, order_items, site_settings -> public read (canReadProducts), admin write
//   orders, order_items                                          -> guest/customer INSERT only (canWriteOrder); reads are admin-only
//                                                                  (canReadAllOrders) or the creator's own (canReadOwnOrder)
//   "user", session, account, verification, "rateLimit"          -> Better Auth only; the app never queries them directly
//   rate_limits                                                  -> src/lib/rate-limit.ts only; no route exposes it
// There is NO public/customer order-read route today. A future "my orders" route MUST call canReadOwnOrder.
// The legacy profiles table and its role-lock trigger are gone: the role lives on "user".role, which Better Auth
// declares input:false (not settable via sign-up/update-user), and sign-up is disabled.

export type RLSResult = { allowed: boolean; reason?: string };

const allow = (): RLSResult => ({ allowed: true });
const deny = (reason: string): RLSResult => ({ allowed: false, reason });

const isAdmin = (userRole: string): boolean => userRole === 'admin';

/** Public catalogue: products, events, event_products, site_settings and product images are readable by everyone. */
export function canReadProducts(): RLSResult {
  return allow();
}

/** Admin-only writes to products and product images (replaces "Admin products write" and storage upload/delete policies). */
export function canWriteProducts(userRole: string): RLSResult {
  return isAdmin(userRole) ? allow() : deny('Only admins can write products');
}

/** Admin-only reads across all orders. */
export function canReadAllOrders(userRole: string): RLSResult {
  return isAdmin(userRole) ? allow() : deny('Only admins can read all orders');
}

/**
 * Owner-scoped order and order_items reads.
 * Guest orders have user_id = NULL (ON DELETE SET NULL). In SQL, NULL never equals the caller id,
 * so a null owner must deny, never match. Guard it explicitly.
 */
export function canReadOwnOrder(
  userRole: string,
  orderId: string,
  userId: string,
  orderUserId: string | null,
): RLSResult {
  if (isAdmin(userRole)) return allow();
  if (orderUserId !== null && userId !== '' && userId === orderUserId) return allow();
  return deny(`Caller does not own order ${orderId}`);
}

/**
 * Order creation (orders and order_items inserts). Guest checkout is allowed by design.
 * Note: migration 0006 removed the anon insert policies and moved inserts to the service role.
 * In D1 this check is the only gate, so the insert route must validate the body with Zod and cap the item count.
 */
export function canWriteOrder(isAuthenticated: boolean): RLSResult {
  void isAuthenticated; // guests may place orders; the flag is accepted for call-site clarity only
  return allow();
}

/** Admin-only writes to events, event_products and site_settings (replaces "Admin ... write" and "Admins full access to ..."). */
export function canWriteAdminContent(userRole: string): RLSResult {
  return isAdmin(userRole) ? allow() : deny('Only admins can write this content');
}

export const RLS = {
  canReadProducts,
  canWriteProducts,
  canReadAllOrders,
  canReadOwnOrder,
  canWriteOrder,
  canWriteAdminContent,
} as const;
