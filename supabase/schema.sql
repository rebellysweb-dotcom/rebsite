-- Rebellys Flower Shop — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. PROFILES (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles read" on public.profiles
  for select using (true);

create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tag text,
  description text,
  image_url text,
  price_usd numeric(10,2),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Public products read" on public.products
  for select using (true);

create policy "Admin products write" on public.products
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3. EVENTS
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  banner_color text not null default '#8b2252',
  button_label text,
  banner_image_url text,
  is_active boolean not null default false,
  auto_activate_from timestamptz,
  auto_deactivate_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Public events read" on public.events
  for select using (true);

create policy "Admin events write" on public.events
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 4. EVENT_PRODUCTS (products specific to an event)
create table public.event_products (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  price_usd numeric(10,2),
  tag text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.event_products enable row level security;

create policy "Public event_products read" on public.event_products
  for select using (true);

create policy "Admin event_products write" on public.event_products
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 5. ORDERS
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  fulfillment text not null default 'delivery' check (fulfillment in ('delivery', 'pickup')),
  delivery_address text,
  delivery_area text,
  delivery_date text,
  delivery_time text,
  occasion text,
  card_message text,
  notes text,
  payment_method text not null default 'cash' check (payment_method in ('whish', 'cash', 'other')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'confirmed', 'paid', 'failed')),
  order_status text not null default 'pending' check (order_status in ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_usd numeric(10,2),
  whatsapp_sent boolean not null default false,
  email_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users read own orders" on public.orders
  for select using (auth.uid() = user_id);

create policy "Anyone can insert orders" on public.orders
  for insert with check (true);

create policy "Admin orders full access" on public.orders
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 6. ORDER_ITEMS
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  name text not null,
  price_usd numeric(10,2),
  quantity integer not null default 1,
  image_url text,
  is_event_product boolean not null default false,
  event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;

create policy "Users read own order items" on public.order_items
  for select using (
    exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  );

create policy "Anyone can insert order items" on public.order_items
  for insert with check (true);

create policy "Admin order_items full access" on public.order_items
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 7. SITE_SETTINGS (single-row config table)
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  lbp_rate text not null default '89500',
  whish_number text not null default '',
  whatsapp_number text not null default '',
  shop_phone text not null default '',
  shop_address text not null default '',
  shop_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Public settings read" on public.site_settings
  for select using (true);

create policy "Admin settings write" on public.site_settings
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Insert default settings row
insert into public.site_settings (lbp_rate, whish_number, whatsapp_number, shop_phone, shop_address, shop_email)
values ('89500', '', '', '+961-1-234567', 'Saydeh Street, Zalka, Lebanon', 'info@rebellys.com');

-- 8. INDEXES
create index idx_products_active on public.products (is_active, sort_order);
create index idx_events_active on public.events (is_active);
create index idx_events_auto on public.events (auto_activate_from, auto_deactivate_at);
create index idx_event_products_event on public.event_products (event_id, sort_order);
create index idx_orders_user on public.orders (user_id);
create index idx_orders_status on public.orders (order_status);
create index idx_orders_created on public.orders (created_at desc);
create index idx_order_items_order on public.order_items (order_id);

-- 9. STORAGE BUCKET for product images
insert into storage.buckets (id, name, public) values ('products', 'products', true)
on conflict (id) do nothing;

create policy "Public read product images" on storage.objects
  for select using (bucket_id = 'products');

create policy "Admin upload product images" on storage.objects
  for insert with check (
    bucket_id = 'products' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin delete product images" on storage.objects
  for delete using (
    bucket_id = 'products' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
