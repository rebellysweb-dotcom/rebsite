-- Rebellys D1 seed data
-- Apply AFTER schema.d1.sql: wrangler d1 execute <DB_NAME> --file=cloudflare/seed.d1.sql
-- Replace REPLACE_WITH_BCRYPT_HASH before applying.
-- Run: node -e "require('bcrypt').hash('YOUR_PASSWORD', 12).then(console.log)"

-- Admin account. The fixed id lets the profiles row below reference it.
-- INSERT OR IGNORE: re-running does not overwrite an existing admin.
INSERT OR IGNORE INTO users (id, email, password_hash, role)
VALUES ('00000000-0000-4000-8000-00000000a001', 'admin@rebellys.com', 'REPLACE_WITH_BCRYPT_HASH', 'admin');

-- The app checks profiles.role, so the admin needs a matching profile row.
INSERT OR IGNORE INTO profiles (id, email, role)
VALUES ('00000000-0000-4000-8000-00000000a001', 'admin@rebellys.com', 'admin');

-- Default single-row site settings (from supabase/schema.sql). Runs only when the table is empty.
INSERT INTO site_settings (lbp_rate, whish_number, whatsapp_number, shop_phone, shop_address, shop_email)
SELECT '89500', '', '', '+961-1-234567', 'Saydeh Street, Zalka, Lebanon', 'info@rebellys.com'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

-- November 2026 catalog: 13 Christmas Specials + 3 New Born (same data as src/lib/catalog.ts).
-- Upsert by id, so re-running refreshes names, prices and photos without duplicating rows.
-- The five add-on rows are inactive (is_active = 0): hidden from the shop, but the order API
-- prices cart add-ons from this table.
INSERT INTO products (id, name, slug, tag, description, image_url, image_urls, price_usd, is_active, sort_order)
VALUES
  ('xmas-1', 'Santa''s Charm', 'santas-charm', 'Christmas Special', 'Glass bell jar on a black base housing a Santa figurine and a frosted crimson tree, topped with a red bow.', '/images/products/santas-charm.jpg', '["/images/products/santas-charm.jpg"]', 30, 1, 1),
  ('xmas-2', 'Merry and Bright', 'merry-and-bright', 'Christmas Special', 'White ceramic "Merry" mug, red poinsettia, pinecone and accessories.', '/images/products/merry-and-bright.jpg', '["/images/products/merry-and-bright.jpg"]', 35, 1, 2),
  ('xmas-3', 'Holiday Magic Mug', 'holiday-magic-mug', 'Christmas Special', 'Mini poinsettia plant placed in a "Merry and Bright" red mug, including accessories.', '/images/products/holiday-magic-mug.jpg', '["/images/products/holiday-magic-mug.jpg"]', 22, 1, 3),
  ('xmas-4', 'Holiday Berry', 'holiday-berry', 'Christmas Special', 'Red and white roses, red berries, cotton flowers and accessories in a white round box.', '/images/products/holiday-berry.jpg', '["/images/products/holiday-berry.jpg"]', 45, 1, 4),
  ('xmas-5', 'Christmas Cuddles', 'christmas-cuddles', 'Christmas Special', 'Potted Gold Crest tree in burgundy wrapping with pink ornaments, paired with a plush brown teddy bear.', '/images/products/christmas-cuddles.jpg', '["/images/products/christmas-cuddles.jpg"]', 30, 1, 5),
  ('xmas-6', 'Ralph Teddy Bear', 'ralph-teddy-bear', 'Christmas Special', 'Brown teddy bear with an Ecosse ribbon.', '/images/products/ralph-teddy-bear-1.jpg', '["/images/products/ralph-teddy-bear-1.jpg", "/images/products/ralph-teddy-bear-2.jpg", "/images/products/ralph-teddy-bear-3.jpg"]', 15, 1, 6),
  ('xmas-7', 'Mingle and Jingle', 'mingle-and-jingle', 'Christmas Special', 'Five red poinsettia plants in a black leather box with accessories.', '/images/products/mingle-and-jingle.jpg', '["/images/products/mingle-and-jingle.jpg"]', 135, 1, 7),
  ('xmas-8', 'Santa''s Little Evergreen', 'santas-little-evergreen', 'Christmas Special', 'Elwoody plant placed in a Santa''s bag.', '/images/products/santas-little-evergreen.jpg', '["/images/products/santas-little-evergreen.jpg"]', 16, 1, 8),
  ('xmas-9', 'Rudolph''s Red Wine', 'rudolphs-red-wine', 'Christmas Special', 'Ksara Réserve du Couvent 75cl with Christmas accessories in a black box.', '/images/products/rudolphs-red-wine.jpg', '["/images/products/rudolphs-red-wine.jpg"]', 55, 1, 9),
  ('xmas-10', 'Christmas Whispers', 'christmas-whispers', 'Christmas Special', 'Two poinsettia plants in a basket.', '/images/products/christmas-whispers.jpg', '["/images/products/christmas-whispers.jpg"]', 70, 1, 10),
  ('xmas-11', 'Winter Wonderland', 'winter-wonderland', 'Christmas Special', 'Four orchid plants placed in a white ceramic pot with Christmas accessories.', '/images/products/winter-wonderland.jpg', '["/images/products/winter-wonderland.jpg"]', 155, 1, 11),
  ('xmas-12', 'Christmas Basket', 'christmas-basket', 'Christmas Special', 'Christmas basket featuring Ksara Réserve du Couvent red wine and Côte d''Or 240g chocolates, beautifully arranged with festive Christmas ornaments, pinecones and lush seasonal greenery in a natural-colored basket.', '/images/products/christmas-basket.jpg', '["/images/products/christmas-basket.jpg"]', 99, 1, 12),
  ('xmas-13', 'White Poinsettia', 'white-poinsettia', 'Christmas Special', 'White poinsettia plant in a basket with accessories.', '/images/products/white-poinsettia.jpg', '["/images/products/white-poinsettia.jpg"]', 30, 1, 13),
  ('nb-1', 'Little Princess', 'little-princess', 'New Born', 'White orchid plant and a teddy bear placed in a pink plastic pot with accessories.', '/images/products/baby-girl-orchid.jpg', '["/images/products/baby-girl-orchid.jpg"]', 75, 1, 14),
  ('nb-2', 'Little Prince', 'little-prince', 'New Born', 'White orchid plant and a teddy bear placed in a blue plastic pot with accessories.', '/images/products/baby-boy-orchid.jpg', '["/images/products/baby-boy-orchid.jpg"]', 75, 1, 15),
  ('nb-3', 'Tiny Treasure', 'tiny-treasure', 'New Born', 'Flower arrangement with a brown teddy bear and a helium "It''s a girl" balloon.', '/images/products/tiny-treasure.jpg', '["/images/products/tiny-treasure.jpg"]', 75, 1, 16),
  ('addon-card', 'Card', 'addon-card', 'Add-on', NULL, NULL, '[]', 0, 0, 101),
  ('addon-balloon-sm', 'Small Balloon Stick', 'addon-balloon-sm', 'Add-on', NULL, NULL, '[]', 3, 0, 102),
  ('addon-balloon-lg', 'Big Balloon Stick', 'addon-balloon-lg', 'Add-on', NULL, NULL, '[]', 5, 0, 103),
  ('addon-balloon-helium', 'Helium Balloon 18"', 'addon-balloon-helium', 'Add-on', NULL, NULL, '[]', 12, 0, 104),
  ('addon-teddy', 'Teddy Bear', 'addon-teddy', 'Add-on', NULL, '/images/products/ralph-teddy-bear-1.jpg', '[]', 15, 0, 105)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name, slug = excluded.slug, tag = excluded.tag, description = excluded.description,
  image_url = excluded.image_url, image_urls = excluded.image_urls, price_usd = excluded.price_usd,
  is_active = excluded.is_active, sort_order = excluded.sort_order, updated_at = datetime('now');
