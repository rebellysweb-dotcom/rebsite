-- Add image_urls array to products and event_products for multi-image gallery support.
-- The existing image_url column is kept as the primary/cover image for cart/order display.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.event_products
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';
