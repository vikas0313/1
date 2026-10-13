import { SEED_CATEGORIES, SEED_MENU_ITEMS } from '../src/data/seed/menuSeed';
import { RESTAURANT_CONFIG } from '../src/config/restaurant.config';
import * as fs from 'fs';
import * as path from 'path';

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

let sql = `-- ============================================================================
-- seed.sql
-- Seed script for Ritsu Food Corner
-- Generated automatically from menuSeed.ts and restaurant.config.ts
-- Total items: 165 across 14 categories. All prices in integer paise.
-- ============================================================================

-- 1. Restaurant Settings
INSERT INTO restaurant_settings (
  name, tagline, gstin, address, phone, upi_vpa, tax_rate_bps, prices_include_tax
) VALUES (
  '${escapeSql(RESTAURANT_CONFIG.restaurantName)}',
  '${escapeSql(RESTAURANT_CONFIG.tagline)}',
  '${escapeSql(RESTAURANT_CONFIG.gstin)}',
  '${escapeSql(JSON.stringify(RESTAURANT_CONFIG.address))}'::jsonb,
  '${escapeSql(RESTAURANT_CONFIG.phone)}',
  '${escapeSql(RESTAURANT_CONFIG.demoUpiVpa)}',
  ${RESTAURANT_CONFIG.taxRatePercent * 100},
  ${RESTAURANT_CONFIG.pricesIncludeTax}
) ON CONFLICT DO NOTHING;

-- 2. Tables T1-T8
INSERT INTO tables (label, active, sort_order) VALUES
${RESTAURANT_CONFIG.tables
  .map(
    (t, idx) =>
      `  ('${escapeSql(t.label)}', ${t.active}, ${idx + 1})`
  )
  .join(',\n')}
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
${SEED_CATEGORIES.map(
  (c) =>
    `  ('${escapeSql(c.id)}', '${escapeSql(c.name)}', ${c.sort_order}, '${escapeSql(c.diet_type)}')`
).join(',\n')};

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
`;

const itemsSqlRows = SEED_MENU_ITEMS.map((item) => {
  const cat = SEED_CATEGORIES.find((c) => c.id === item.category_id);
  const catName = cat ? cat.name : 'STARTERS';
  const variantsJson = JSON.stringify(item.variants);
  return `  ('${escapeSql(catName)}', ${item.item_no}, '${escapeSql(item.name)}', ${item.is_veg}, ${item.sort_order}, '${escapeSql(variantsJson)}'::jsonb)`;
});

sql += itemsSqlRows.join(',\n') + ';\n\n';

sql += `
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
`;

const outputPath = path.resolve('d:/projects/resturant QR/supabase/seed.sql');
fs.writeFileSync(outputPath, sql, 'utf-8');
console.log('Successfully generated seed.sql with', SEED_MENU_ITEMS.length, 'items');
