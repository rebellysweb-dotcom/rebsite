-- Rebellys Flower Shop — Cloudflare D1 (SQLite) schema
-- Converted from supabase/schema.sql + migrations 0004 to 0008 (migration effects are merged into the CREATE TABLE statements).
-- Apply: wrangler d1 execute <DB_NAME> --file=cloudflare/schema.d1.sql
-- Authorization is NOT in the database. Every check lives in cloudflare/rls-policies.ts.
-- Timestamps are TEXT from datetime('now') (UTC, 'YYYY-MM-DD HH:MM:SS').

-- 1. USERS (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. PROFILES (extends users; was profiles -> auth.users)
-- The Supabase handle_new_user() trigger is dropped: the registration code must insert the profiles row itself.
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Role lock (was: lock_profile_role trigger calling prevent_role_change()).
-- Applies to everyone, including admins, as the Postgres trigger did.
CREATE TRIGGER IF NOT EXISTS lock_profile_role
BEFORE UPDATE OF role ON profiles
FOR EACH ROW
WHEN NEW.role <> OLD.role
BEGIN
  SELECT RAISE(ABORT, 'Profile role cannot be changed via direct UPDATE.');
END;

-- 3. PRODUCTS (includes image_urls from migration 0004)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tag TEXT,
  description TEXT,
  image_url TEXT,
  image_urls TEXT NOT NULL DEFAULT '[]',
  price_usd REAL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. EVENTS
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  banner_color TEXT NOT NULL DEFAULT '#8b2252',
  button_label TEXT,
  banner_image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  auto_activate_from TEXT,
  auto_deactivate_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. EVENT_PRODUCTS (includes image_urls from migration 0004)
CREATE TABLE IF NOT EXISTS event_products (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  image_urls TEXT NOT NULL DEFAULT '[]',
  price_usd REAL,
  tag TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  order_number TEXT NOT NULL UNIQUE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  fulfillment TEXT NOT NULL DEFAULT 'delivery' CHECK (fulfillment IN ('delivery', 'pickup')),
  delivery_address TEXT,
  delivery_area TEXT,
  delivery_date TEXT,
  delivery_time TEXT,
  occasion TEXT,
  card_message TEXT,
  notes TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('whish', 'cash', 'card', 'transfer', 'other')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'paid', 'failed')),
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_usd REAL,
  whatsapp_sent INTEGER NOT NULL DEFAULT 0 CHECK (whatsapp_sent IN (0, 1)),
  email_sent INTEGER NOT NULL DEFAULT 0 CHECK (email_sent IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. ORDER_ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_usd REAL,
  quantity INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  is_event_product INTEGER NOT NULL DEFAULT 0 CHECK (is_event_product IN (0, 1)),
  event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. SITE_SETTINGS (single-row config table)
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  lbp_rate TEXT NOT NULL DEFAULT '89500',
  whish_number TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  shop_phone TEXT NOT NULL DEFAULT '',
  shop_address TEXT NOT NULL DEFAULT '',
  shop_email TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. INDEXES
CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_events_active ON events (is_active);
CREATE INDEX IF NOT EXISTS idx_events_auto ON events (auto_activate_from, auto_deactivate_at);
CREATE INDEX IF NOT EXISTS idx_event_products_event ON event_products (event_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

-- Removed on purpose (no D1 equivalent):
--   CREATE EXTENSION, all ENABLE ROW LEVEL SECURITY, all CREATE POLICY / DROP POLICY (see rls-policies.ts),
--   auth.uid(), handle_new_user() + on_auth_user_created, rls_auto_enable(), is_admin(),
--   GRANT/REVOKE EXECUTE, storage.buckets / storage.objects (product images move to R2).
