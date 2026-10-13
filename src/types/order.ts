export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'complete' | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type PaymentMethod = 'upi_qr' | 'counter_cash' | 'razorpay' | 'offline_other';

export interface CartLine {
  item_id: string;
  variant_id: string;
  item_no: number;
  name: string;
  variant_label: string;
  unit_price_paise: number;
  quantity: number;
  is_veg: boolean;
}

export interface OrderItem {
  id: string;
  order_id?: string;
  menu_item_id: string;
  variant_id: string;
  item_no: number;
  name_snapshot: string;
  variant_label_snapshot: string;
  unit_price_paise: number;
  quantity: number;
  is_veg: boolean;
}

export interface Order {
  id: string;
  table_label: string;
  customer_name: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  subtotal_paise: number;
  cgst_paise: number;
  sgst_paise: number;
  total_paise: number;
  note?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  public_token?: string;
}

export interface BillCalculation {
  subtotal_paise: number;
  tax_paise: number;
  cgst_paise: number;
  sgst_paise: number;
  total_paise: number;
}
