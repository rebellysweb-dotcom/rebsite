-- Rebellys Flower Shop - Cloudflare D1 (SQLite) initial schema.
-- Applied by: wrangler d1 migrations apply rebellys-db [--local|--remote]  (migrations_dir in wrangler.toml)
-- Authorization is NOT in the database (D1 has no RLS): every check lives in cloudflare/rls-policies.ts.
-- Timestamps: app tables use TEXT from datetime('now') (UTC, 'YYYY-MM-DD HH:MM:SS');
-- Better Auth tables store ISO-8601 TEXT written by Better Auth itself.
-- D1 enforces foreign keys (PRAGMA foreign_keys is ON), so the ON DELETE actions below are live.

-- ---------------------------------------------------------------------------
-- Better Auth (generated with @better-auth/cli against src/lib/auth/index.ts,
-- adapted: "role" gets a DEFAULT and CHECK, dates are ISO TEXT).
-- ---------------------------------------------------------------------------
CREATE TABLE "user" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'customer' CHECK ("role" IN ('customer', 'admin'))
);

CREATE TABLE "session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "expiresAt" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE TABLE "account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TEXT,
  "refreshTokenExpiresAt" TEXT,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE "verification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

-- Better Auth built-in limiter (rateLimit.storage = 'database').
CREATE TABLE "rateLimit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "count" INTEGER NOT NULL,
  "lastRequest" INTEGER NOT NULL
);

-- App limiter (src/lib/rate-limit.ts): fixed window per key, epoch seconds.
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tag TEXT,
  -- Shop filter key ('christmas', 'new-born', ...). NULL = UI falls back to tag. Not written by admin routes yet.
  category TEXT,
  description TEXT,
  image_url TEXT,
  image_urls TEXT NOT NULL DEFAULT '[]',             -- JSON array of URLs
  price_usd REAL CHECK (price_usd IS NULL OR price_usd >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  banner_color TEXT NOT NULL DEFAULT '#8b2252',
  button_label TEXT,
  banner_image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  auto_activate_from TEXT,                           -- 'YYYY-MM-DD HH:MM:SS' UTC
  auto_deactivate_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE event_products (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  image_urls TEXT NOT NULL DEFAULT '[]',
  price_usd REAL CHECK (price_usd IS NULL OR price_usd >= 0),
  tag TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  -- Guest orders: NULL. Better Auth user id otherwise; deleting the user keeps the order.
  user_id TEXT REFERENCES "user" ("id") ON DELETE SET NULL,
  -- Optional client-supplied Idempotency-Key header; UNIQUE (NULLs are distinct) makes retries return the same order.
  idempotency_key TEXT UNIQUE,
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
  -- 'confirmed' is offered by the admin UI; 'refunded' by the admin API: superset so neither is rejected by the DB.
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'paid', 'failed', 'refunded')),
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_usd REAL NOT NULL DEFAULT 0 CHECK (total_usd >= 0),
  whatsapp_sent INTEGER NOT NULL DEFAULT 0 CHECK (whatsapp_sent IN (0, 1)),
  email_sent INTEGER NOT NULL DEFAULT 0 CHECK (email_sent IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  name TEXT NOT NULL,                                -- snapshot at order time
  price_usd REAL CHECK (price_usd IS NULL OR price_usd >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  image_url TEXT,
  is_event_product INTEGER NOT NULL DEFAULT 0 CHECK (is_event_product IN (0, 1)),
  event_id TEXT REFERENCES events (id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Settings (single logical row; the app reads/updates "the first row")
-- ---------------------------------------------------------------------------
CREATE TABLE site_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  lbp_rate TEXT NOT NULL DEFAULT '89500',
  whish_number TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  shop_phone TEXT NOT NULL DEFAULT '',
  shop_address TEXT NOT NULL DEFAULT '',
  shop_email TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
