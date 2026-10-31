-- 002_seed_restaurant.sql

INSERT OR IGNORE INTO restaurant_settings (
  id,
  name,
  tagline,
  gstin,
  address,
  phone,
  upi_vpa,
  tax_rate_bps,
  prices_include_tax
) VALUES (
  1,
  'Ritsu Food Corner',
  'Indo-Chinese ka asli maza – Ristsu ke saath!',
  '36ABCDE1234F1Z5',
  'Main Road, Near Food Square, Hyderabad',
  '+91 98765 43210',
  'ritsu@upi',
  500,
  0
);

-- Seed initial tables T1 through T8
INSERT OR IGNORE INTO tables (id, label, active, sort_order) VALUES
  ('tbl-1', 'T1', 1, 1),
  ('tbl-2', 'T2', 1, 2),
  ('tbl-3', 'T3', 1, 3),
  ('tbl-4', 'T4', 1, 4),
  ('tbl-5', 'T5', 1, 5),
  ('tbl-6', 'T6', 1, 6),
  ('tbl-7', 'T7', 1, 7),
  ('tbl-8', 'T8', 1, 8);
