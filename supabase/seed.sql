-- ============================================================================
-- seed.sql
-- Seed script for Ritsu Food Corner
-- Generated automatically from menuSeed.ts and restaurant.config.ts
-- Total items: 165 across 14 categories. All prices in integer paise.
-- ============================================================================

-- 1. Restaurant Settings
INSERT INTO restaurant_settings (
  name, tagline, gstin, address, phone, upi_vpa, tax_rate_bps, prices_include_tax
) VALUES (
  'Ritsu Food Corner',
  'Indo-Chinese ka asli maza – Ritsu ke saath!',
  '36AAAAA0000A1Z5',
  '{"line1":"Main Road, Opp. City Center","line2":"Food Street","city":"Hyderabad","state":"Telangana","pincode":"500032"}'::jsonb,
  '+91 98765 43210',
  'ritsufoodcorner@okaxis',
  500,
  false
) ON CONFLICT DO NOTHING;

-- 2. Tables T1-T8
INSERT INTO tables (label, active, sort_order) VALUES
  ('T1', true, 1),
  ('T2', true, 2),
  ('T3', true, 3),
  ('T4', true, 4),
  ('T5', true, 5),
  ('T6', true, 6),
  ('T7', true, 7),
  ('T8', true, 8)
ON CONFLICT (label) DO UPDATE SET active = EXCLUDED.active;

-- 3. Categories
-- We use deterministic UUIDs or temporary mapping via CTE / table
CREATE TEMP TABLE temp_categories (
  seed_id text PRIMARY KEY,
  name text,
  sort_order int,
  diet_type text
);

INSERT INTO temp_categories (seed_id, name, sort_order, diet_type) VALUES
  ('cat-1', 'STARTERS', 1, 'non_veg'),
  ('cat-2', 'VEG STARTERS', 2, 'veg'),
  ('cat-3', 'NOODLES – VEG', 3, 'veg'),
  ('cat-4', 'NOODLES – NON-VEG', 4, 'non_veg'),
  ('cat-5', 'VEG IN RICE', 5, 'veg'),
  ('cat-6', 'RICE IN NON-VEG', 6, 'non_veg'),
  ('cat-7', 'VEG CURRIES', 7, 'veg'),
  ('cat-8', 'NON-VEG CURRIES', 8, 'non_veg'),
  ('cat-9', 'MOMO''S IN VEG', 9, 'veg'),
  ('cat-10', 'MOMO''S IN NON-VEG – CHICKEN', 10, 'non_veg'),
  ('cat-11', 'MOMO''S IN PANEER', 11, 'veg'),
  ('cat-12', 'BIRYANI''S IN VEG', 12, 'veg'),
  ('cat-13', 'BIRYANI''S IN NON-VEG', 13, 'non_veg'),
  ('cat-14', 'SOFT DRINK', 14, 'veg');

INSERT INTO categories (id, name, sort_order, diet_type)
SELECT 
  gen_random_uuid(),
  tc.name,
  tc.sort_order,
  tc.diet_type
FROM temp_categories tc
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = tc.name);

-- 4. Menu Items and Variants
CREATE TEMP TABLE temp_items (
  cat_name text,
  item_no int,
  name text,
  is_veg boolean,
  sort_order int,
  variants jsonb
);

INSERT INTO temp_items (cat_name, item_no, name, is_veg, sort_order, variants) VALUES
  ('STARTERS', 1, 'Chicken Manchurian', false, 1, '[{"id":"var-1-s","label":"Single","price_paise":14000,"available":true,"needs_verification":false},{"id":"var-1-f","label":"Full","price_paise":20000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 2, 'Chicken 65', false, 2, '[{"id":"var-2-s","label":"Single","price_paise":17000,"available":true,"needs_verification":false},{"id":"var-2-f","label":"Full","price_paise":22000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 3, 'Chilli Chicken', false, 3, '[{"id":"var-3-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-3-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 4, 'Schezwan Chicken', false, 4, '[{"id":"var-4-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-4-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 5, 'Garlic Chicken', false, 5, '[{"id":"var-5-s","label":"Single","price_paise":17000,"available":true,"needs_verification":false},{"id":"var-5-f","label":"Full","price_paise":22000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 6, 'Ginger Chicken', false, 6, '[{"id":"var-6-s","label":"Single","price_paise":17000,"available":true,"needs_verification":false},{"id":"var-6-f","label":"Full","price_paise":22000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 7, 'Dragon Chicken', false, 7, '[{"id":"var-7-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-7-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 8, 'Mongolian Chicken', false, 8, '[{"id":"var-8-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-8-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 9, 'Chicken Majestic', false, 9, '[{"id":"var-9-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-9-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 10, 'Crispy Chicken', false, 10, '[{"id":"var-10-s","label":"Single","price_paise":20000,"available":true,"needs_verification":false},{"id":"var-10-f","label":"Full","price_paise":26000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 11, 'Pepper Chicken', false, 11, '[{"id":"var-11-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-11-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 12, 'Kung Pao Chicken', false, 12, '[{"id":"var-12-s","label":"Single","price_paise":20000,"available":true,"needs_verification":false},{"id":"var-12-f","label":"Full","price_paise":26000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 13, 'Hong Kong Chicken', false, 13, '[{"id":"var-13-s","label":"Single","price_paise":20000,"available":true,"needs_verification":false},{"id":"var-13-f","label":"Full","price_paise":26000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 14, 'Prawns Manchurian', false, 14, '[{"id":"var-14-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-14-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 15, 'Prawns 65', false, 15, '[{"id":"var-15-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-15-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 16, 'Chilli Prawns', false, 16, '[{"id":"var-16-s","label":"Single","price_paise":20000,"available":true,"needs_verification":false},{"id":"var-16-f","label":"Full","price_paise":26000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 17, 'Garlic Prawns', false, 17, '[{"id":"var-17-s","label":"Single","price_paise":20000,"available":true,"needs_verification":false},{"id":"var-17-f","label":"Full","price_paise":26000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 18, 'Ginger Prawns', false, 18, '[{"id":"var-18-s","label":"Single","price_paise":20000,"available":true,"needs_verification":false},{"id":"var-18-f","label":"Full","price_paise":26000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 19, 'Schezwan Prawns', false, 19, '[{"id":"var-19-s","label":"Single","price_paise":22000,"available":true,"needs_verification":false},{"id":"var-19-f","label":"Full","price_paise":28000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 20, 'Apollo Fish', false, 20, '[{"id":"var-20-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-20-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 21, 'Fish 65', false, 21, '[{"id":"var-21-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-21-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 22, 'Chilli Fish', false, 22, '[{"id":"var-22-s","label":"Single","price_paise":20000,"available":true,"needs_verification":false},{"id":"var-22-f","label":"Full","price_paise":26000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 23, 'Garlic Fish', false, 23, '[{"id":"var-23-s","label":"Single","price_paise":20000,"available":true,"needs_verification":false},{"id":"var-23-f","label":"Full","price_paise":26000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 24, 'Ginger Fish', false, 24, '[{"id":"var-24-s","label":"Single","price_paise":20000,"available":true,"needs_verification":false},{"id":"var-24-f","label":"Full","price_paise":26000,"available":true,"needs_verification":true}]'::jsonb),
  ('STARTERS', 25, 'Schezwan Fish', false, 25, '[{"id":"var-25-s","label":"Single","price_paise":22000,"available":true,"needs_verification":false},{"id":"var-25-f","label":"Full","price_paise":28000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 26, 'Veg Manchurian', true, 26, '[{"id":"var-26-s","label":"Single","price_paise":8000,"available":true,"needs_verification":false},{"id":"var-26-f","label":"Full","price_paise":12000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 27, 'Veg 65', true, 27, '[{"id":"var-27-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-27-f","label":"Full","price_paise":13000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 28, 'Chilli Veg Manchurian', true, 28, '[{"id":"var-28-s","label":"Single","price_paise":10000,"available":true,"needs_verification":false},{"id":"var-28-f","label":"Full","price_paise":16000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 29, 'Schezwan Veg Manchurian', true, 29, '[{"id":"var-29-s","label":"Single","price_paise":10000,"available":true,"needs_verification":false},{"id":"var-29-f","label":"Full","price_paise":16000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 30, 'Gobi Manchurian', true, 30, '[{"id":"var-30-s","label":"Single","price_paise":10000,"available":true,"needs_verification":false},{"id":"var-30-f","label":"Full","price_paise":16000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 31, 'Gobi 65', true, 31, '[{"id":"var-31-s","label":"Single","price_paise":10000,"available":true,"needs_verification":false},{"id":"var-31-f","label":"Full","price_paise":16000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 32, 'Chilli Gobi', true, 32, '[{"id":"var-32-s","label":"Single","price_paise":12000,"available":true,"needs_verification":false},{"id":"var-32-f","label":"Full","price_paise":18000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 33, 'Schezwan Gobi', true, 33, '[{"id":"var-33-s","label":"Single","price_paise":12000,"available":true,"needs_verification":false},{"id":"var-33-f","label":"Full","price_paise":18000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 34, 'Chilli Potatoes', true, 34, '[{"id":"var-34-s","label":"Single","price_paise":12000,"available":true,"needs_verification":false},{"id":"var-34-f","label":"Full","price_paise":18000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 35, 'Baby Corn Manchurian', true, 35, '[{"id":"var-35-s","label":"Single","price_paise":14000,"available":true,"needs_verification":false},{"id":"var-35-f","label":"Full","price_paise":20000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 36, 'Baby Corn 65', true, 36, '[{"id":"var-36-s","label":"Single","price_paise":17000,"available":true,"needs_verification":false},{"id":"var-36-f","label":"Full","price_paise":22000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 37, 'Chilli Baby Corn', true, 37, '[{"id":"var-37-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-37-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 38, 'Schezwan Baby Corn', true, 38, '[{"id":"var-38-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-38-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 39, 'Mushroom Manchurian', true, 39, '[{"id":"var-39-s","label":"Single","price_paise":14000,"available":true,"needs_verification":false},{"id":"var-39-f","label":"Full","price_paise":20000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 40, 'Mushroom 65', true, 40, '[{"id":"var-40-s","label":"Single","price_paise":17000,"available":true,"needs_verification":false},{"id":"var-40-f","label":"Full","price_paise":22000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 41, 'Chilli Mushroom', true, 41, '[{"id":"var-41-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-41-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 42, 'Schezwan Mushroom', true, 42, '[{"id":"var-42-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-42-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 43, 'Paneer Manchurian', true, 43, '[{"id":"var-43-s","label":"Single","price_paise":14000,"available":true,"needs_verification":false},{"id":"var-43-f","label":"Full","price_paise":20000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 44, 'Paneer 65', true, 44, '[{"id":"var-44-s","label":"Single","price_paise":17000,"available":true,"needs_verification":false},{"id":"var-44-f","label":"Full","price_paise":22000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 45, 'Chilli Paneer', true, 45, '[{"id":"var-45-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-45-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 46, 'Schezwan Paneer', true, 46, '[{"id":"var-46-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-46-f","label":"Full","price_paise":24000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 47, 'Ginger Paneer', true, 47, '[{"id":"var-47-s","label":"Single","price_paise":17000,"available":true,"needs_verification":false},{"id":"var-47-f","label":"Full","price_paise":22000,"available":true,"needs_verification":true}]'::jsonb),
  ('VEG STARTERS', 48, 'Garlic Paneer', true, 48, '[{"id":"var-48-s","label":"Single","price_paise":17000,"available":true,"needs_verification":false},{"id":"var-48-f","label":"Full","price_paise":22000,"available":true,"needs_verification":true}]'::jsonb),
  ('NOODLES – VEG', 49, 'Veg Noodles', true, 49, '[{"id":"var-49-s","label":"Single","price_paise":7000,"available":true,"needs_verification":false},{"id":"var-49-f","label":"Full","price_paise":12000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – VEG', 50, 'Veg Hakka Noodles', true, 50, '[{"id":"var-50-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-50-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – VEG', 51, 'Veg Manchurian Noodles', true, 51, '[{"id":"var-51-s","label":"Single","price_paise":8000,"available":true,"needs_verification":false},{"id":"var-51-f","label":"Full","price_paise":13000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – VEG', 52, 'Veg Singapore Noodles', true, 52, '[{"id":"var-52-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-52-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – VEG', 53, 'Veg Schezwan Noodles', true, 53, '[{"id":"var-53-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-53-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – VEG', 54, 'Chilli Garlic Noodles', true, 54, '[{"id":"var-54-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-54-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – VEG', 55, 'Paneer Noodles', true, 55, '[{"id":"var-55-s","label":"Single","price_paise":10000,"available":true,"needs_verification":false},{"id":"var-55-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – VEG', 56, 'Paneer Manchurian Noodles', true, 56, '[{"id":"var-56-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-56-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – VEG', 57, 'Paneer Hakka Noodles', true, 57, '[{"id":"var-57-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-57-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – VEG', 58, 'Paneer Singapore Noodles', true, 58, '[{"id":"var-58-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-58-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – VEG', 59, 'Paneer Schezwan Noodles', true, 59, '[{"id":"var-59-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-59-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – VEG', 60, 'Chilli Garlic Paneer Noodles', true, 60, '[{"id":"var-60-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-60-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 61, 'Egg Noodles', false, 61, '[{"id":"var-61-s","label":"Single","price_paise":8000,"available":true,"needs_verification":false},{"id":"var-61-f","label":"Full","price_paise":13000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 62, 'Double Egg Noodles', false, 62, '[{"id":"var-62-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-62-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 63, 'Chilli Garlic Egg Noodles', false, 63, '[{"id":"var-63-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-63-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 64, 'Egg Hakka Noodles', false, 64, '[{"id":"var-64-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-64-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 65, 'Singapore Egg Noodles', false, 65, '[{"id":"var-65-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-65-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 66, 'Schezwan Egg Noodles', false, 66, '[{"id":"var-66-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-66-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 67, 'Chicken Noodles', false, 67, '[{"id":"var-67-s","label":"Single","price_paise":10000,"available":true,"needs_verification":false},{"id":"var-67-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 68, 'Double Egg Chicken Noodles', false, 68, '[{"id":"var-68-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-68-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 69, 'Chilli Garlic Chicken Noodles', false, 69, '[{"id":"var-69-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-69-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 70, 'Chicken Hakka Noodles', false, 70, '[{"id":"var-70-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-70-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 71, 'Singapore Chicken Noodles', false, 71, '[{"id":"var-71-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-71-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 72, 'Chicken Schezwan Noodles', false, 72, '[{"id":"var-72-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-72-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 73, 'Prawns Noodles', false, 73, '[{"id":"var-73-s","label":"Single","price_paise":14000,"available":true,"needs_verification":false},{"id":"var-73-f","label":"Full","price_paise":20000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 74, 'Double Egg Prawns Noodles', false, 74, '[{"id":"var-74-s","label":"Single","price_paise":15000,"available":true,"needs_verification":false},{"id":"var-74-f","label":"Full","price_paise":21000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 75, 'Chilli Garlic Prawns Noodles', false, 75, '[{"id":"var-75-s","label":"Single","price_paise":16000,"available":true,"needs_verification":false},{"id":"var-75-f","label":"Full","price_paise":22000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 76, 'Prawns Hakka Noodles', false, 76, '[{"id":"var-76-s","label":"Single","price_paise":16000,"available":true,"needs_verification":false},{"id":"var-76-f","label":"Full","price_paise":22000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 77, 'Singapore Prawns Noodles', false, 77, '[{"id":"var-77-s","label":"Single","price_paise":16000,"available":true,"needs_verification":false},{"id":"var-77-f","label":"Full","price_paise":22000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 78, 'Prawns Schezwan Noodles', false, 78, '[{"id":"var-78-s","label":"Single","price_paise":16000,"available":true,"needs_verification":false},{"id":"var-78-f","label":"Full","price_paise":22000,"available":true,"needs_verification":false}]'::jsonb),
  ('NOODLES – NON-VEG', 79, 'Mix Noodles (Egg + Chicken + Prawns)', false, 79, '[{"id":"var-79-s","label":"Single","price_paise":18000,"available":true,"needs_verification":false},{"id":"var-79-f","label":"Full","price_paise":24000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 80, 'Veg Fried Rice', true, 80, '[{"id":"var-80-s","label":"Single","price_paise":7000,"available":true,"needs_verification":false},{"id":"var-80-f","label":"Full","price_paise":12000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 81, 'Jeera Rice', true, 81, '[{"id":"var-81-s","label":"Single","price_paise":8000,"available":true,"needs_verification":false},{"id":"var-81-f","label":"Full","price_paise":13000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 82, 'Veg Hakka Rice', true, 82, '[{"id":"var-82-s","label":"Single","price_paise":8000,"available":true,"needs_verification":false},{"id":"var-82-f","label":"Full","price_paise":13000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 83, 'Veg Manchurian Rice', true, 83, '[{"id":"var-83-s","label":"Single","price_paise":8000,"available":true,"needs_verification":false},{"id":"var-83-f","label":"Full","price_paise":13000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 84, 'Veg Singapore Rice', true, 84, '[{"id":"var-84-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-84-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 85, 'Veg Schezwan Rice', true, 85, '[{"id":"var-85-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-85-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 86, 'Chilli Garlic Rice', true, 86, '[{"id":"var-86-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-86-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 87, 'Paneer Rice', true, 87, '[{"id":"var-87-s","label":"Single","price_paise":10000,"available":true,"needs_verification":false},{"id":"var-87-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 88, 'Paneer Manchurian Rice', true, 88, '[{"id":"var-88-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-88-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 89, 'Paneer Hakka Rice', true, 89, '[{"id":"var-89-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-89-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 90, 'Paneer Singapore Rice', true, 90, '[{"id":"var-90-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-90-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 91, 'Paneer Schezwan Rice', true, 91, '[{"id":"var-91-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-91-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 92, 'Paneer Garlic Rice', true, 92, '[{"id":"var-92-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-92-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG IN RICE', 93, 'Kaju Rice', true, 93, '[{"id":"var-93-s","label":"Single","price_paise":12000,"available":true,"needs_verification":false},{"id":"var-93-f","label":"Full","price_paise":16000,"available":true,"needs_verification":true}]'::jsonb),
  ('RICE IN NON-VEG', 94, 'Egg Fried Rice', false, 94, '[{"id":"var-94-s","label":"Single","price_paise":8000,"available":true,"needs_verification":false},{"id":"var-94-f","label":"Full","price_paise":13000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 95, 'Double Egg Fried Rice', false, 95, '[{"id":"var-95-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-95-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 96, 'Chilli Garlic Egg Rice', false, 96, '[{"id":"var-96-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-96-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 97, 'Egg Hakka Rice', false, 97, '[{"id":"var-97-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-97-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 98, 'Singapore Egg Rice', false, 98, '[{"id":"var-98-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-98-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 99, 'Schezwan Egg Rice', false, 99, '[{"id":"var-99-s","label":"Single","price_paise":9000,"available":true,"needs_verification":false},{"id":"var-99-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 100, 'Chicken Fried Rice', false, 100, '[{"id":"var-100-s","label":"Single","price_paise":10000,"available":true,"needs_verification":false},{"id":"var-100-f","label":"Full","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 101, 'Double Egg Chicken Fried Rice', false, 101, '[{"id":"var-101-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-101-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 102, 'Chilli Garlic Chicken Rice', false, 102, '[{"id":"var-102-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-102-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 103, 'Chicken Hakka Rice', false, 103, '[{"id":"var-103-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-103-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 104, 'Singapore Chicken Rice', false, 104, '[{"id":"var-104-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-104-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 105, 'Chicken Schezwan Rice', false, 105, '[{"id":"var-105-s","label":"Single","price_paise":11000,"available":true,"needs_verification":false},{"id":"var-105-f","label":"Full","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 106, 'Prawns Fried Rice', false, 106, '[{"id":"var-106-s","label":"Single","price_paise":14000,"available":true,"needs_verification":false},{"id":"var-106-f","label":"Full","price_paise":20000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 107, 'Double Egg Prawns Rice', false, 107, '[{"id":"var-107-s","label":"Single","price_paise":15000,"available":true,"needs_verification":false},{"id":"var-107-f","label":"Full","price_paise":21000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 108, 'Chilli Garlic Prawns Rice', false, 108, '[{"id":"var-108-s","label":"Single","price_paise":15000,"available":true,"needs_verification":false},{"id":"var-108-f","label":"Full","price_paise":21000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 109, 'Prawns Hakka Rice', false, 109, '[{"id":"var-109-s","label":"Single","price_paise":15000,"available":true,"needs_verification":false},{"id":"var-109-f","label":"Full","price_paise":21000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 110, 'Singapore Prawns Rice', false, 110, '[{"id":"var-110-s","label":"Single","price_paise":15000,"available":true,"needs_verification":false},{"id":"var-110-f","label":"Full","price_paise":21000,"available":true,"needs_verification":false}]'::jsonb),
  ('RICE IN NON-VEG', 111, 'Prawns Schezwan Rice', false, 111, '[{"id":"var-111-s","label":"Single","price_paise":15000,"available":true,"needs_verification":false},{"id":"var-111-f","label":"Full","price_paise":21000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG CURRIES', 112, 'Mix Veg Curry', true, 112, '[{"id":"var-112-s","label":"Regular","price_paise":10000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG CURRIES', 113, 'Kadai Veg', true, 113, '[{"id":"var-113-s","label":"Regular","price_paise":12000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG CURRIES', 114, 'Kaju Curry', true, 114, '[{"id":"var-114-s","label":"Regular","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG CURRIES', 115, 'Paneer Curry', true, 115, '[{"id":"var-115-s","label":"Regular","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG CURRIES', 116, 'Paneer Butter Masala', true, 116, '[{"id":"var-116-s","label":"Regular","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG CURRIES', 117, 'Kadai Paneer', true, 117, '[{"id":"var-117-s","label":"Regular","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG CURRIES', 118, 'Methi Paneer', true, 118, '[{"id":"var-118-s","label":"Regular","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('VEG CURRIES', 119, 'Methi Paneer Chaman', true, 119, '[{"id":"var-119-s","label":"Regular","price_paise":17000,"available":true,"needs_verification":false}]'::jsonb),
  ('NON-VEG CURRIES', 120, 'Chicken Curry', false, 120, '[{"id":"var-120-s","label":"Regular","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('NON-VEG CURRIES', 121, 'Butter Chicken Masala', false, 121, '[{"id":"var-121-s","label":"Regular","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('NON-VEG CURRIES', 122, 'Kadai Chicken', false, 122, '[{"id":"var-122-s","label":"Regular","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('NON-VEG CURRIES', 123, 'Masala Methi Chicken', false, 123, '[{"id":"var-123-s","label":"Regular","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('NON-VEG CURRIES', 124, 'Afghani Chicken', false, 124, '[{"id":"var-124-s","label":"Regular","price_paise":17000,"available":true,"needs_verification":false}]'::jsonb),
  ('NON-VEG CURRIES', 125, 'Egg Curry', false, 125, '[{"id":"var-125-s","label":"Regular","price_paise":10000,"available":true,"needs_verification":false}]'::jsonb),
  ('NON-VEG CURRIES', 126, 'Egg Butter Masala', false, 126, '[{"id":"var-126-s","label":"Regular","price_paise":12000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN VEG', 127, 'Veg Momo''s Steam', true, 127, '[{"id":"var-127-s","label":"Regular","price_paise":7000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN VEG', 128, 'Veg Momo''s Fry', true, 128, '[{"id":"var-128-s","label":"Regular","price_paise":8000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN VEG', 129, 'Veg Kurkure Momo''s', true, 129, '[{"id":"var-129-s","label":"Regular","price_paise":10000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN VEG', 130, 'Veg Cheese Momo''s', true, 130, '[{"id":"var-130-s","label":"Regular","price_paise":11000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN VEG', 131, 'Veg Manchurian Momo''s', true, 131, '[{"id":"var-131-s","label":"Regular","price_paise":13000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN VEG', 132, 'Veg Chilli Momo''s', true, 132, '[{"id":"var-132-s","label":"Regular","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN VEG', 133, 'Veg Schezwan Momo''s', true, 133, '[{"id":"var-133-s","label":"Regular","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN VEG', 134, 'Veg Cheese Manchurian Momo''s', true, 134, '[{"id":"var-134-s","label":"Regular","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN VEG', 135, 'Veg Cheese Chilli Momo''s', true, 135, '[{"id":"var-135-s","label":"Regular","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN VEG', 136, 'Veg Cheese Schezwan Momo''s', true, 136, '[{"id":"var-136-s","label":"Regular","price_paise":17000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN NON-VEG – CHICKEN', 137, 'Chicken Steam Momo''s', false, 137, '[{"id":"var-137-s","label":"Regular","price_paise":8000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN NON-VEG – CHICKEN', 138, 'Chicken Fry Momo''s', false, 138, '[{"id":"var-138-s","label":"Regular","price_paise":9000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN NON-VEG – CHICKEN', 139, 'Chicken Kurkure Momo''s', false, 139, '[{"id":"var-139-s","label":"Regular","price_paise":12000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN NON-VEG – CHICKEN', 140, 'Chicken Cheese Momo''s', false, 140, '[{"id":"var-140-s","label":"Regular","price_paise":13000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN NON-VEG – CHICKEN', 141, 'Chicken Manchurian Momo''s', false, 141, '[{"id":"var-141-s","label":"Regular","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN NON-VEG – CHICKEN', 142, 'Chicken Chilli Momo''s', false, 142, '[{"id":"var-142-s","label":"Regular","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN NON-VEG – CHICKEN', 143, 'Chicken Schezwan Momo''s', false, 143, '[{"id":"var-143-s","label":"Regular","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN NON-VEG – CHICKEN', 144, 'Chicken Cheese Manchurian Momo''s', false, 144, '[{"id":"var-144-s","label":"Regular","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN NON-VEG – CHICKEN', 145, 'Chicken Cheese Chilli Momo''s', false, 145, '[{"id":"var-145-s","label":"Regular","price_paise":17000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN NON-VEG – CHICKEN', 146, 'Chicken Cheese Schezwan Momo''s', false, 146, '[{"id":"var-146-s","label":"Regular","price_paise":18000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN PANEER', 147, 'Paneer Steam Momo''s', true, 147, '[{"id":"var-147-s","label":"Regular","price_paise":8000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN PANEER', 148, 'Paneer Fry Momo''s', true, 148, '[{"id":"var-148-s","label":"Regular","price_paise":9000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN PANEER', 149, 'Paneer Kurkure Momo''s', true, 149, '[{"id":"var-149-s","label":"Regular","price_paise":12000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN PANEER', 150, 'Paneer Cheese Momo''s', true, 150, '[{"id":"var-150-s","label":"Regular","price_paise":13000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN PANEER', 151, 'Paneer Manchurian Momo''s', true, 151, '[{"id":"var-151-s","label":"Regular","price_paise":14000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN PANEER', 152, 'Paneer Chilli Momo''s', true, 152, '[{"id":"var-152-s","label":"Regular","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN PANEER', 153, 'Paneer Schezwan Momo''s', true, 153, '[{"id":"var-153-s","label":"Regular","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN PANEER', 154, 'Paneer Cheese Manchurian Momo''s', true, 154, '[{"id":"var-154-s","label":"Regular","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN PANEER', 155, 'Paneer Cheese Chilli Momo''s', true, 155, '[{"id":"var-155-s","label":"Regular","price_paise":17000,"available":true,"needs_verification":false}]'::jsonb),
  ('MOMO''S IN PANEER', 156, 'Paneer Cheese Schezwan Momo''s', true, 156, '[{"id":"var-156-s","label":"Regular","price_paise":18000,"available":true,"needs_verification":false}]'::jsonb),
  ('BIRYANI''S IN VEG', 157, 'Veg Biryani', true, 157, '[{"id":"var-157-s","label":"Regular","price_paise":10000,"available":true,"needs_verification":false}]'::jsonb),
  ('BIRYANI''S IN VEG', 158, 'Paneer Biryani', true, 158, '[{"id":"var-158-s","label":"Regular","price_paise":13000,"available":true,"needs_verification":false}]'::jsonb),
  ('BIRYANI''S IN NON-VEG', 159, 'Hyderabadi Dum Biryani', false, 159, '[{"id":"var-159-s","label":"Regular","price_paise":13000,"available":true,"needs_verification":false}]'::jsonb),
  ('BIRYANI''S IN NON-VEG', 160, 'Lollipop Biryani', false, 160, '[{"id":"var-160-s","label":"Regular","price_paise":15000,"available":true,"needs_verification":false}]'::jsonb),
  ('BIRYANI''S IN NON-VEG', 161, 'Special Biryani', false, 161, '[{"id":"var-161-s","label":"Regular","price_paise":10000,"available":true,"needs_verification":false},{"id":"var-161-f","label":"Large","price_paise":16000,"available":true,"needs_verification":false}]'::jsonb),
  ('BIRYANI''S IN NON-VEG', 162, 'Prawns Biryani', false, 162, '[{"id":"var-162-s","label":"Regular","price_paise":10000,"available":true,"needs_verification":false},{"id":"var-162-f","label":"Large","price_paise":18000,"available":true,"needs_verification":false}]'::jsonb),
  ('BIRYANI''S IN NON-VEG', 163, 'Fish Biryani', false, 163, '[{"id":"var-163-s","label":"Regular","price_paise":10000,"available":true,"needs_verification":false},{"id":"var-163-f","label":"Large","price_paise":18000,"available":true,"needs_verification":false}]'::jsonb),
  ('SOFT DRINK', 164, 'Soft Drink', true, 164, '[{"id":"var-164-s","label":"Small","price_paise":1000,"available":true,"needs_verification":false},{"id":"var-164-f","label":"Large","price_paise":2000,"available":true,"needs_verification":false}]'::jsonb),
  ('SOFT DRINK', 165, 'Add-Ons', true, 165, '[{"id":"var-165-s","label":"Regular","price_paise":1000,"available":true,"needs_verification":false}]'::jsonb);


-- Insert Menu Items
DO $$
DECLARE
  r RECORD;
  v RECORD;
  v_cat_id uuid;
  v_item_id uuid;
BEGIN
  FOR r IN SELECT * FROM temp_items ORDER BY item_no LOOP
    SELECT id INTO v_cat_id FROM categories WHERE name = r.cat_name LIMIT 1;
    
    INSERT INTO menu_items (category_id, item_no, name, is_veg, sort_order)
    VALUES (v_cat_id, r.item_no, r.name, r.is_veg, r.sort_order)
    ON CONFLICT (item_no) DO UPDATE SET
      name = EXCLUDED.name,
      is_veg = EXCLUDED.is_veg,
      category_id = EXCLUDED.category_id
    RETURNING id INTO v_item_id;

    -- Clean old variants on conflict
    DELETE FROM menu_item_variants WHERE menu_item_id = v_item_id;

    -- Insert variants
    FOR v IN SELECT * FROM jsonb_to_recordset(r.variants) AS x(
      label text,
      price_paise int,
      available boolean,
      needs_verification boolean,
      sort_order int
    ) LOOP
      INSERT INTO menu_item_variants (
        menu_item_id, label, price_paise, available, needs_verification, sort_order
      ) VALUES (
        v_item_id,
        v.label,
        v.price_paise,
        COALESCE(v.available, true),
        COALESCE(v.needs_verification, false),
        COALESCE(v.sort_order, 0)
      );
    END LOOP;
  END LOOP;
END $$;

DROP TABLE temp_categories;
DROP TABLE temp_items;
