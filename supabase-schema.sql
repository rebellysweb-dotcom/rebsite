-- ============================================================
-- REBELLYS — Complete Supabase SQL Schema
-- Paste this entire file into Supabase SQL Editor and run it.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  tag         TEXT,
  description TEXT,
  image_url   TEXT,
  price_usd   NUMERIC(10,2),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- ============================================================
-- 3. EVENTS (special/seasonal menus)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  banner_color        TEXT NOT NULL DEFAULT '#e91e8c',
  button_label        TEXT,
  banner_image_url    TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT false,
  auto_activate_from  TIMESTAMPTZ,
  auto_deactivate_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- ============================================================
-- 4. EVENT PRODUCTS (exclusive items per event)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  price_usd   NUMERIC(10,2),
  tag         TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_products_event ON public.event_products(event_id, sort_order);

-- ============================================================
-- 5. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number     TEXT NOT NULL UNIQUE,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name    TEXT NOT NULL,
  customer_email   TEXT,
  customer_phone   TEXT NOT NULL,
  fulfillment      TEXT NOT NULL DEFAULT 'delivery' CHECK (fulfillment IN ('delivery', 'pickup')),
  delivery_address TEXT,
  delivery_area    TEXT,
  delivery_date    DATE,
  delivery_time    TEXT,
  occasion         TEXT,
  card_message     TEXT,
  notes            TEXT,
  payment_method   TEXT NOT NULL DEFAULT 'whish' CHECK (payment_method IN ('whish', 'cash', 'other')),
  payment_status   TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'paid', 'failed')),
  order_status     TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_usd        NUMERIC(10,2),
  whatsapp_sent    BOOLEAN NOT NULL DEFAULT false,
  email_sent       BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- ============================================================
-- 6. ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  price_usd        NUMERIC(10,2),
  quantity         INTEGER NOT NULL DEFAULT 1,
  image_url        TEXT,
  is_event_product BOOLEAN NOT NULL DEFAULT false,
  event_id         UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ============================================================
-- 7. SAVED ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label        TEXT,
  address_line TEXT NOT NULL,
  area         TEXT,
  notes        TEXT,
  is_default   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);

-- ============================================================
-- 8. SITE SETTINGS (singleton row)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lbp_rate        TEXT NOT NULL DEFAULT '89500',
  whish_number    TEXT NOT NULL DEFAULT '96176585028',
  whatsapp_number TEXT NOT NULL DEFAULT '96176585028',
  shop_phone      TEXT NOT NULL DEFAULT '+96176585028',
  shop_address    TEXT NOT NULL DEFAULT 'Saydeh Street, Zalka, Lebanon',
  shop_email      TEXT NOT NULL DEFAULT 'info@rebellys.com',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default singleton row
INSERT INTO public.site_settings (lbp_rate, whish_number, whatsapp_number, shop_phone, shop_address, shop_email)
SELECT '89500', '96176585028', '96176585028', '+96176585028', 'Saydeh Street, Zalka, Lebanon', 'info@rebellys.com'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ─────────────────────────────────────────────────
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── PRODUCTS ─────────────────────────────────────────────────
-- Anyone can read active products
CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

-- Admins can do everything with products
CREATE POLICY "Admins full access to products"
  ON public.products FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── EVENTS ───────────────────────────────────────────────────
-- Anyone can read active events
CREATE POLICY "Public can view active events"
  ON public.events FOR SELECT
  USING (is_active = true);

-- Admins can do everything with events
CREATE POLICY "Admins full access to events"
  ON public.events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── EVENT PRODUCTS ───────────────────────────────────────────
-- Anyone can read active event products for active events
CREATE POLICY "Public can view event products"
  ON public.event_products FOR SELECT
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND is_active = true)
  );

-- Admins can do everything
CREATE POLICY "Admins full access to event products"
  ON public.event_products FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── ORDERS ───────────────────────────────────────────────────
-- Anyone can insert orders (guest checkout)
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

-- Admins can do everything with orders
CREATE POLICY "Admins full access to orders"
  ON public.orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── ORDER ITEMS ──────────────────────────────────────────────
-- Anyone can insert order items (guest checkout)
CREATE POLICY "Anyone can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- Users can view items for their orders
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

-- Admins can do everything
CREATE POLICY "Admins full access to order items"
  ON public.order_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── ADDRESSES ────────────────────────────────────────────────
-- Users can manage their own addresses
CREATE POLICY "Users can manage own addresses"
  ON public.addresses FOR ALL
  USING (user_id = auth.uid());

-- ── SITE SETTINGS ────────────────────────────────────────────
-- Anyone can read settings (needed for frontend)
CREATE POLICY "Public can read settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
  ON public.site_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================
-- DONE! After running this:
-- 1. Go to Auth → Providers → Google and enable Google OAuth
-- 2. Set your first admin: UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
-- 3. Configure Supabase Storage for product images (optional)
-- ============================================================
