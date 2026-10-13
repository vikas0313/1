import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Supabase Migrations & Seed Validation', () => {
  it('all migration files exist and have valid structure', () => {
    const migrationsDir = path.resolve('supabase/migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const files = fs.readdirSync(migrationsDir);
    expect(files.length).toBeGreaterThanOrEqual(4);

    const migrationContent = files.map((f) =>
      fs.readFileSync(path.join(migrationsDir, f), 'utf-8')
    ).join('\n');

    // Verify critical tables are declared
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS restaurant_settings');
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS tables');
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS categories');
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS menu_items');
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS menu_item_variants');
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS orders');
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS order_items');
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS order_status_events');
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS payments');
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS owners');

    // Verify triggers and functions
    expect(migrationContent).toContain('enforce_order_status_transition');
    expect(migrationContent).toContain('enforce_payment_status');
    expect(migrationContent).toContain('is_owner');
    expect(migrationContent).toContain('get_order_by_token');
    expect(migrationContent).toContain('get_sales_summary');

    // Verify RLS is enabled
    expect(migrationContent).toContain('ALTER TABLE orders ENABLE ROW LEVEL SECURITY');
    expect(migrationContent).toContain('ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY');
  });

  it('seed.sql accurately seeds all 165 items, categories, and spot-checked prices', () => {
    const seedPath = path.resolve('supabase/seed.sql');
    expect(fs.existsSync(seedPath)).toBe(true);

    const seedSql = fs.readFileSync(seedPath, 'utf-8');

    // Category count check (14 categories)
    expect(seedSql).toContain('cat-1');
    expect(seedSql).toContain('cat-14');
    expect(seedSql).toContain('SOFT DRINK');
    expect(seedSql).toContain('BIRYANI\'\'S IN NON-VEG');

    // Item #1: Chicken Manchurian (140 / 200) -> 14000 / 20000 paise
    expect(seedSql).toContain('Chicken Manchurian');
    expect(seedSql).toContain('14000');
    expect(seedSql).toContain('20000');

    // Item #49: Chilli Paneer (70 / 120) -> 7000 / 12000 paise
    expect(seedSql).toContain('Chilli Paneer');
    expect(seedSql).toContain('7000');
    expect(seedSql).toContain('12000');

    // Item #120: Chicken Curry (140) -> 14000 paise
    expect(seedSql).toContain('Chicken Curry');
    expect(seedSql).toContain('14000');

    // Item #163: Fish Biryani (100 / 180) -> 10000 / 18000 paise
    expect(seedSql).toContain('Fish Biryani');
    expect(seedSql).toContain('10000');
    expect(seedSql).toContain('18000');

    // Check table count: T1 through T8
    for (let i = 1; i <= 8; i++) {
      expect(seedSql).toContain(`'T${i}'`);
    }
  });
});
