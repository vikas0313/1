export type DietType = 'veg' | 'non_veg' | 'mixed';

export interface MenuItemVariant {
  id: string;
  label: string; // e.g. "Single", "Full", "Regular", "Large", "Small"
  price_paise: number; // integer paise (₹1 = 100 paise)
  available: boolean;
  needs_verification?: boolean; // Inferred prices flagged for owner verification
}

export interface MenuItem {
  id: string;
  category_id: string;
  item_no: number; // 1 to 165
  name: string;
  description?: string;
  is_veg: boolean;
  available: boolean;
  image_url?: string;
  sort_order: number;
  variants: MenuItemVariant[];
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  diet_type: DietType;
}
