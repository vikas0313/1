import { nanoid } from 'nanoid';
import type { Category, MenuItem, MenuItemVariant, RestaurantSettings, Table } from '@ritsu/shared';
import { getDb } from '../db.js';
import { sseService } from './sseService.js';

export class MenuService {
  /**
   * Retrieves public restaurant settings.
   */
  public getSettings(): RestaurantSettings {
    const db = getDb();
    const row = db.prepare('SELECT * FROM restaurant_settings WHERE id = 1').get() as any;
    if (!row) {
      return {
        id: 1,
        name: 'Ritsu Food Corner',
        tagline: 'Indo-Chinese ka asli maza – Ristsu ke saath!',
        gstin: '36ABCDE1234F1Z5',
        address: 'Main Road, Near Food Square, Hyderabad',
        phone: '+91 98765 43210',
        upi_vpa: 'ritsu@upi',
        tax_rate_bps: 500,
        prices_include_tax: false,
      };
    }

    return {
      id: row.id,
      name: row.name,
      tagline: row.tagline,
      gstin: row.gstin,
      address: row.address,
      phone: row.phone,
      upi_vpa: row.upi_vpa,
      tax_rate_bps: row.tax_rate_bps,
      prices_include_tax: Boolean(row.prices_include_tax),
    };
  }

  /**
   * Returns active categories and active menu items with active variants for customers.
   */
  public getPublicMenu(): { categories: Category[]; items: MenuItem[] } {
    const db = getDb();

    const categories = db
      .prepare('SELECT * FROM categories ORDER BY sort_order ASC')
      .all() as any[];

    const items = db
      .prepare('SELECT * FROM menu_items WHERE available = 1 ORDER BY sort_order ASC')
      .all() as any[];

    const variants = db
      .prepare('SELECT * FROM menu_item_variants WHERE available = 1 ORDER BY sort_order ASC')
      .all() as any[];

    const variantsByItem = new Map<string, MenuItemVariant[]>();
    for (const v of variants) {
      if (!variantsByItem.has(v.menu_item_id)) {
        variantsByItem.set(v.menu_item_id, []);
      }
      variantsByItem.get(v.menu_item_id)!.push({
        id: v.id,
        menu_item_id: v.menu_item_id,
        label: v.label,
        price_paise: v.price_paise,
        available: Boolean(v.available),
        needs_verification: Boolean(v.needs_verification),
        sort_order: v.sort_order,
      });
    }

    const menuItems: MenuItem[] = items.map((item) => ({
      id: item.id,
      category_id: item.category_id,
      item_no: item.item_no,
      name: item.name,
      description: item.description || '',
      is_veg: Boolean(item.is_veg),
      available: Boolean(item.available),
      is_popular: Boolean(item.is_popular),
      image_url: item.image_url,
      sort_order: item.sort_order,
      variants: variantsByItem.get(item.id) || [],
    }));

    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        sort_order: c.sort_order,
        diet_type: c.diet_type,
        icon_key: c.icon_key,
      })),
      items: menuItems,
    };
  }

  /**
   * Validates table label for welcome flow.
   */
  public getTableByLabel(label: string): Table | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM tables WHERE label = ? AND active = 1').get(label) as any;
    if (!row) return null;
    return {
      id: row.id,
      label: row.label,
      active: Boolean(row.active),
      sort_order: row.sort_order,
    };
  }

  /**
   * Retrieves all tables for owner.
   */
  public getAllTables(): Table[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM tables ORDER BY sort_order ASC').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      active: Boolean(r.active),
      sort_order: r.sort_order,
    }));
  }

  /**
   * Confirms unverified variant price.
   */
  public confirmVariantPrice(variantId: string): void {
    const db = getDb();
    db.prepare('UPDATE menu_item_variants SET needs_verification = 0 WHERE id = ?').run(variantId);
    sseService.notifyMenuUpdated();
  }

  /**
   * Updates variant price or availability.
   */
  public updateVariant(variantId: string, updates: { price_paise?: number; available?: boolean; label?: string }): void {
    const db = getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.price_paise !== undefined) {
      fields.push('price_paise = ?');
      values.push(updates.price_paise);
    }
    if (updates.available !== undefined) {
      fields.push('available = ?');
      values.push(updates.available ? 1 : 0);
    }
    if (updates.label !== undefined) {
      fields.push('label = ?');
      values.push(updates.label);
    }

    if (fields.length > 0) {
      values.push(variantId);
      db.prepare(`UPDATE menu_item_variants SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      sseService.notifyMenuUpdated();
    }
  }

  /**
   * Updates item availability.
   */
  public updateItemAvailability(itemId: string, available: boolean): void {
    const db = getDb();
    db.prepare('UPDATE menu_items SET available = ? WHERE id = ?').run(available ? 1 : 0, itemId);
    sseService.notifyMenuUpdated();
  }
}

export const menuService = new MenuService();
