// Shared canonical types used by both web and server.

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'complete' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'upi_manual' | 'cash' | 'razorpay';
export type DietType = 'veg' | 'non_veg' | 'mixed';

// --- Menu ---

export interface MenuItemVariant {
  id: string;
  menu_item_id: string;
  label: string; // "Single" | "Full" | "Regular" | "Large" | "Small"
  price_paise: number;
  available: boolean;
  needs_verification: boolean;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  item_no: number;
  name: string;
  description: string;
  is_veg: boolean;
  available: boolean;
  is_popular: boolean;
  image_url: string | null;
  sort_order: number;
  variants: MenuItemVariant[];
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  diet_type: DietType;
  icon_key: string;
}

// --- Cart (web only, but type lives in shared) ---

export interface CartLine {
  item_id: string;
  variant_id: string;
  item_no: number;
  name: string;
  variant_label: string;
  unit_price_paise: number;
  quantity: number;
  is_veg: boolean;
  note?: string;
}

// --- Orders ---

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  variant_id: string;
  item_no_snapshot: number;
  name_snapshot: string;
  variant_label_snapshot: string;
  unit_price_paise: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_no: string;
  table_label: string;
  customer_name: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  subtotal_paise: number;
  cgst_paise: number;
  sgst_paise: number;
  total_paise: number;
  note: string;
  public_token: string;
  client_request_id: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// --- Restaurant settings ---

export interface RestaurantSettings {
  id: number;
  name: string;
  tagline: string;
  gstin: string;
  address: string;
  phone: string;
  upi_vpa: string;
  tax_rate_bps: number; // 500 = 5%
  prices_include_tax: boolean;
}

export interface Table {
  id: string;
  label: string;
  active: boolean;
  sort_order: number;
}

// --- Billing ---

export interface BillCalculation {
  subtotal_paise: number;
  tax_paise: number;
  cgst_paise: number;
  sgst_paise: number;
  total_paise: number;
}
