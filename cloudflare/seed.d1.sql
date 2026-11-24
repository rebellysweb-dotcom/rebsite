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
