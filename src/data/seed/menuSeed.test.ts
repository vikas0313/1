import { describe, it, expect } from 'vitest';
import { SEED_CATEGORIES, SEED_MENU_ITEMS } from './menuSeed';

describe('Menu Seed Data Validation', () => {
  it('contains exactly 14 categories in defined order', () => {
    expect(SEED_CATEGORIES).toHaveLength(14);
    expect(SEED_CATEGORIES[0].name).toBe('STARTERS');
    expect(SEED_CATEGORIES[13].name).toBe('SOFT DRINK');
  });

  it('contains exactly 165 menu items with unique item numbers 1 to 165', () => {
    expect(SEED_MENU_ITEMS).toHaveLength(165);
    const numbers = SEED_MENU_ITEMS.map((i) => i.item_no);
    const uniqueNumbers = new Set(numbers);
    expect(uniqueNumbers.size).toBe(165);
    expect(Math.min(...numbers)).toBe(1);
    expect(Math.max(...numbers)).toBe(165);
  });

  it('spot-checks #1 Chicken Manchurian (140/200*) with needs_verification', () => {
    const item = SEED_MENU_ITEMS.find((i) => i.item_no === 1);
    expect(item).toBeDefined();
    expect(item?.name).toBe('Chicken Manchurian');
    expect(item?.is_veg).toBe(false);
    expect(item?.variants).toHaveLength(2);
    expect(item?.variants[0].label).toBe('Single');
    expect(item?.variants[0].price_paise).toBe(14000); // ₹140
    expect(item?.variants[1].label).toBe('Full');
    expect(item?.variants[1].price_paise).toBe(20000); // ₹200
    expect(item?.variants[1].needs_verification).toBe(true);
  });

  it('spot-checks #49 Veg Noodles (70/120)', () => {
    const item = SEED_MENU_ITEMS.find((i) => i.item_no === 49);
    expect(item).toBeDefined();
    expect(item?.name).toBe('Veg Noodles');
    expect(item?.is_veg).toBe(true);
    expect(item?.variants).toHaveLength(2);
    expect(item?.variants[0].price_paise).toBe(7000); // ₹70
    expect(item?.variants[1].price_paise).toBe(12000); // ₹120
    expect(item?.variants[1].needs_verification).toBe(false);
  });

  it('spot-checks #120 Chicken Curry (140, single price only)', () => {
    const item = SEED_MENU_ITEMS.find((i) => i.item_no === 120);
    expect(item).toBeDefined();
    expect(item?.name).toBe('Chicken Curry');
    expect(item?.is_veg).toBe(false);
    expect(item?.variants).toHaveLength(1);
    expect(item?.variants[0].price_paise).toBe(14000); // ₹140
  });

  it('spot-checks #163 Fish Biryani (100 / 180, Regular / Large)', () => {
    const item = SEED_MENU_ITEMS.find((i) => i.item_no === 163);
    expect(item).toBeDefined();
    expect(item?.name).toBe('Fish Biryani');
    expect(item?.is_veg).toBe(false);
    expect(item?.variants).toHaveLength(2);
    expect(item?.variants[0].label).toBe('Regular');
    expect(item?.variants[0].price_paise).toBe(10000); // ₹100
    expect(item?.variants[1].label).toBe('Large');
    expect(item?.variants[1].price_paise).toBe(18000); // ₹180
  });

  it('spot-checks #164 Soft Drink (10 / 20, Small / Large)', () => {
    const item = SEED_MENU_ITEMS.find((i) => i.item_no === 164);
    expect(item).toBeDefined();
    expect(item?.variants).toHaveLength(2);
    expect(item?.variants[0].label).toBe('Small');
    expect(item?.variants[0].price_paise).toBe(1000);
    expect(item?.variants[1].label).toBe('Large');
    expect(item?.variants[1].price_paise).toBe(2000);
  });

  it('flags exactly 49 inferred Full variant prices with needs_verification', () => {
    // 25 non-veg starters + 23 veg starters + 1 kaju rice = 49 items
    const verifiedVariants = SEED_MENU_ITEMS.flatMap((i) => i.variants).filter(
      (v) => v.needs_verification === true
    );
    expect(verifiedVariants).toHaveLength(49);
  });
});
