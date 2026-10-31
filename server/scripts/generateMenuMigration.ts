import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_CATEGORIES, SEED_MENU_ITEMS } from '@ritsu/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

let sql = `-- 003_seed_menu.sql: Seeds 14 categories and 165 menu items with variants\n\n`;

// Categories
sql += `-- Categories\n`;
for (const cat of SEED_CATEGORIES) {
  sql += `INSERT OR IGNORE INTO categories (id, name, sort_order, diet_type, icon_key) VALUES ('${escapeSQL(
    cat.id
  )}', '${escapeSQL(cat.name)}', ${cat.sort_order}, '${cat.diet_type}', '${escapeSQL(cat.icon_key)}');\n`;
}

sql += `\n-- Menu Items and Variants\n`;
for (const item of SEED_MENU_ITEMS) {
  const desc = escapeSQL(item.description);
  const name = escapeSQL(item.name);
  sql += `INSERT OR IGNORE INTO menu_items (id, category_id, item_no, name, description, is_veg, available, is_popular, image_url, sort_order) VALUES ('${item.id}', '${item.category_id}', ${item.item_no}, '${name}', '${desc}', ${item.is_veg ? 1 : 0}, ${item.available ? 1 : 0}, ${item.is_popular ? 1 : 0}, NULL, ${item.sort_order});\n`;

  for (const v of item.variants) {
    sql += `INSERT OR IGNORE INTO menu_item_variants (id, menu_item_id, label, price_paise, available, needs_verification, sort_order) VALUES ('${v.id}', '${item.id}', '${escapeSQL(
      v.label
    )}', ${v.price_paise}, ${v.available ? 1 : 0}, ${v.needs_verification ? 1 : 0}, ${v.sort_order});\n`;
  }
}

const outPath = path.resolve(__dirname, '../migrations/003_seed_menu.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log(`Generated migration: ${outPath} with ${SEED_MENU_ITEMS.length} items`);
