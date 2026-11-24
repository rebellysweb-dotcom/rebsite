// Application-level replacement for the Supabase RLS policies (D1 has no RLS).
//
// Every function is pure: the caller passes the identity and row facts, and gets a decision back.
// The service layer MUST call the matching check before any D1 read or write.
// Deny by default: a check that is not called is a hole.
//
// Source mapping (supabase/schema.sql + migrations 0004-0008):
//   "Public ... read" on products, events, event_products, site_settings, storage products bucket -> canReadProducts
//   "Admin ... write" / "Admins full access to ..." (events, event_products, products, orders, order_items, site_settings) -> canWriteAdminContent / canWriteProducts
//   "Admins can view all profiles" -> canReadAnyProfile
//   "Users read own orders" / "Users read own order items" -> canReadOwnOrder
//   "Anyone can insert orders" / "Anyone can insert order items" -> canWriteOrder
//   "Users read own profile" / "Public profiles read" (dropped in 0008) -> canReadOwnProfile
//   "Users can update own profile" + lock_profile_role (0005/0007) -> canUpdateOwnProfile
//   Admin order/item reads -> canReadAllOrders

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

/** Own profile read (replaces "Users read own profile"). */
export function canReadOwnProfile(requestUserId: string, profileId: string): RLSResult {
  if (requestUserId !== '' && requestUserId === profileId) return allow();
  return deny('Caller can only read their own profile');
}

/** Admin-only writes to events, event_products and site_settings (replaces "Admin ... write" and "Admins full access to ..."). */
export function canWriteAdminContent(userRole: string): RLSResult {
  return isAdmin(userRole) ? allow() : deny('Only admins can write this content');
}

/** Admin read of every profile (migration 0007 "Admins can view all profiles"). Not in the original spec list; kept so admin tooling does not regress. */
export function canReadAnyProfile(userRole: string): RLSResult {
  return isAdmin(userRole) ? allow() : deny('Only admins can read all profiles');
}

/**
 * Self-update of a profile, with the role lock (0005/0007 WITH CHECK + lock_profile_role trigger).
 * The caller may only update their own row, and the role must be unchanged. Role changes need a separate, audited admin path.
 * Not in the original spec list; kept because it is the role-escalation control.
 */
export function canUpdateOwnProfile(
  requestUserId: string,
  profileId: string,
  currentRole: string,
  requestedRole: string,
): RLSResult {
  if (requestUserId === '' || requestUserId !== profileId) {
    return deny('Caller can only update their own profile');
  }
  if (requestedRole !== currentRole) {
    return deny('Profile role cannot be changed');
  }
  return allow();
}

export const RLS = {
  canReadProducts,
  canWriteProducts,
  canReadAllOrders,
  canReadOwnOrder,
  canWriteOrder,
  canReadOwnProfile,
  canWriteAdminContent,
  canReadAnyProfile,
  canUpdateOwnProfile,
} as const;
