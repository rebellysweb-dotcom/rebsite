export interface Product {
  id: string;
  name: string;
  slug: string;
  tag: string | null;
  description: string | null;
  image_url: string | null;
  image_urls: string[];
  price_usd: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_color: string;
  button_label: string | null;
  banner_image_url: string | null;
  is_active: boolean;
  auto_activate_from: string | null;
  auto_deactivate_at: string | null;
  created_at: string;
  event_products?: EventProduct[];
}

export interface EventProduct {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  image_urls: string[];
  price_usd: number | null;
  tag: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: 'customer' | 'admin';
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  address_line: string;
  area: string | null;
  notes: string | null;
  is_default: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  name: string;
  price_usd: number | null;
  quantity: number;
  image_url: string | null;
  is_event_product: boolean;
  event_id?: string;
  slug: string;
  lineId: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price_usd: number | null;
  quantity: number;
  image_url: string | null;
  is_event_product: boolean;
  event_id?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'confirmed' | 'paid' | 'failed';
export type PaymentMethod = 'whish' | 'cash' | 'other';
export type Fulfillment = 'delivery' | 'pickup';

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  fulfillment: Fulfillment;
  delivery_address: string | null;
  delivery_area: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  occasion: string | null;
  card_message: string | null;
  notes: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  total_usd: number | null;
  items: OrderItem[];
  whatsapp_sent: boolean;
  email_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  lbp_rate: string;
  whish_number: string;
  whatsapp_number: string;
  shop_phone: string;
  shop_address: string;
  shop_email: string;
}
