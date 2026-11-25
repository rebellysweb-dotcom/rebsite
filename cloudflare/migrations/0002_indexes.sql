-- Indexes, one per real query in src/. UNIQUE columns (slugs, order_number, idempotency_key,
-- session.token, rateLimit.key, rate_limits.key) already have implicit indexes and are not repeated.
-- Deliberately NOT indexed (tiny tables, or no query filters on them): products.category (filtered
-- client-side over ~21 rows), events.is_active, orders.user_id (no per-user order query yet; add it
-- when a "my orders" page ships).

-- Storefront/checkout/home: WHERE is_active = 1 ORDER BY sort_order; admin list: ORDER BY sort_order.
CREATE INDEX idx_products_active_sort ON products (is_active, sort_order);

-- Event page + admin: WHERE event_id = ? [AND is_active = 1] ORDER BY sort_order; also serves the FK cascade delete.
CREATE INDEX idx_event_products_event_sort ON event_products (event_id, sort_order);

-- Admin orders list and dashboard "today": ORDER BY created_at DESC, created_at >= date('now').
CREATE INDEX idx_orders_created ON orders (created_at DESC);

-- Admin status filter + dashboard pending count: WHERE order_status = ? ORDER BY created_at DESC.
CREATE INDEX idx_orders_status_created ON orders (order_status, created_at DESC);

-- Admin order detail/list items (WHERE order_id IN (...)) and the FK cascade delete.
CREATE INDEX idx_order_items_order ON order_items (order_id);

-- Better Auth lookups by user (session listing/revocation, account linking, cascade deletes).
CREATE INDEX idx_session_user ON "session" ("userId");
CREATE INDEX idx_account_user ON "account" ("userId");
CREATE INDEX idx_verification_identifier ON "verification" ("identifier");

-- rate-limit.ts opportunistic cleanup: DELETE FROM rate_limits WHERE window_start < ?
CREATE INDEX idx_rate_limits_window ON rate_limits (window_start);
