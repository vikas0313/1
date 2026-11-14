import type {
  Category,
  MenuItem,
  Order,
  RestaurantSettings,
  Table,
} from '@ritsu/shared';
import { SEED_CATEGORIES, SEED_MENU_ITEMS, calculateBill } from '@ritsu/shared';

export interface CreateOrderParams {
  table_label: string;
  customer_name: string;
  note?: string;
  client_request_id?: string;
  items: Array<{
    menu_item_id: string;
    variant_id: string;
    quantity: number;
  }>;
}

const DEFAULT_SETTINGS: RestaurantSettings = {
  id: 1,
  name: 'Ritsu Food Corner',
  tagline: 'Indo-Chinese street kitchen. Freshly tossed and served hot to your table.',
  gstin: '36ABCDE1234F1Z5',
  address: 'Shop 4, Food Street, Near Metro Station, Hyderabad',
  phone: '+91 98765 43210',
  upi_vpa: 'ritsu@upi',
  tax_rate_bps: 500,
  prices_include_tax: false,
  updated_at: new Date().toISOString(),
};

export class ApiAdapter {
  private baseUrl = '';

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  public async getRestaurantSettings(): Promise<RestaurantSettings> {
    try {
      const res = await fetch(`${this.baseUrl}/api/restaurant`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Return default settings on network/hosting error
    }
    return DEFAULT_SETTINGS;
  }

  public async getMenu(): Promise<{ categories: Category[]; items: MenuItem[] }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/menu`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback on network/hosting error
    }
    return { categories: SEED_CATEGORIES, items: SEED_MENU_ITEMS };
  }

  public async getTable(label: string): Promise<Table | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tables/${encodeURIComponent(label)}`);
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 404) return null;
    } catch {
      // Fallback
    }

    const clean = (label || '').trim().toUpperCase();
    const valid = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];
    if (valid.includes(clean)) {
      return {
        id: `tbl-${clean.toLowerCase()}`,
        label: clean,
        active: true,
        sort_order: parseInt(clean.replace('T', ''), 10) || 1,
        created_at: new Date().toISOString(),
      };
    }
    return null;
  }

  public async createOrder(params: CreateOrderParams): Promise<Order> {
    const requestId =
      params.client_request_id ||
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const body = {
      ...params,
      client_request_id: requestId,
    };

    try {
      const res = await fetch(`${this.baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        return await res.json();
      }
      if (res.status === 400 || res.status === 409 || res.status === 429) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Order failed (${res.status})`);
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError')) {
        throw err;
      }
    }

    // Client-side fallback order creation
    const orderItems = params.items.map((it, idx) => {
      const menuItem = SEED_MENU_ITEMS.find((m) => m.id === it.menu_item_id);
      const variant = menuItem?.variants.find((v) => v.id === it.variant_id);
      const unitPrice = variant?.price_paise || 10000;
      return {
        id: `oi-${Date.now()}-${idx}`,
        order_id: `ord-${Date.now()}`,
        menu_item_id: it.menu_item_id,
        variant_id: it.variant_id,
        item_no: menuItem?.item_no || idx + 1,
        item_name: menuItem?.name || 'Item',
        variant_label: variant?.label || 'Regular',
        unit_price_paise: unitPrice,
        quantity: it.quantity,
        subtotal_paise: unitPrice * it.quantity,
      };
    });

    const bill = calculateBill(
      orderItems.map((oi) => ({
        unit_price_paise: oi.unit_price_paise,
        quantity: oi.quantity,
      })),
      5
    );

    const localOrder: Order = {
      id: `ord-${Date.now()}`,
      order_no: Math.floor(100 + Math.random() * 900),
      table_label: params.table_label,
      customer_name: params.customer_name,
      status: 'pending',
      subtotal_paise: bill.subtotal_paise,
      tax_paise: bill.tax_paise,
      tax_rate_bps: bill.tax_rate_bps,
      total_paise: bill.total_paise,
      payment_status: 'unpaid',
      public_token: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      client_request_id: requestId,
      note: params.note || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: orderItems,
    };

    try {
      const existing = JSON.parse(localStorage.getItem('ritsu_local_orders') || '[]');
      existing.unshift(localOrder);
      localStorage.setItem('ritsu_local_orders', JSON.stringify(existing.slice(0, 50)));
    } catch {}

    return localOrder;
  }

  public async getOrderByToken(publicToken: string): Promise<Order> {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders/${encodeURIComponent(publicToken)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Fallback: check localStorage
    try {
      const existing: Order[] = JSON.parse(localStorage.getItem('ritsu_local_orders') || '[]');
      const found = existing.find((o) => o.public_token === publicToken);
      if (found) return found;
    } catch {}

    throw new Error('Order not found or link expired');
  }

  /**
   * Subscribes to live order updates via Server-Sent Events with polling fallback.
   */
  public subscribeToOrder(
    publicToken: string,
    callback: (order: Order) => void,
    onStatusChange?: (status: 'connected' | 'reconnecting' | 'polling') => void
  ): () => void {
    let closed = false;
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollInterval || closed) return;
      onStatusChange?.('polling');
      pollInterval = setInterval(async () => {
        try {
          const order = await this.getOrderByToken(publicToken);
          callback(order);
        } catch {
          // ignore transient poll errors
        }
      }, 5000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const connectSSE = () => {
      if (closed) return;
      onStatusChange?.('reconnecting');

      try {
        eventSource = new EventSource(`${this.baseUrl}/api/orders/${encodeURIComponent(publicToken)}/stream`);

        eventSource.onopen = () => {
          stopPolling();
          onStatusChange?.('connected');
        };

        eventSource.addEventListener('order.updated', (event) => {
          try {
            const data = JSON.parse(event.data);
            callback(data);
          } catch (err) {
            console.error('Error parsing order.updated SSE:', err);
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          startPolling();
          // Attempt SSE reconnection after 10s
          setTimeout(() => {
            if (!closed && !eventSource) {
              connectSSE();
            }
          }, 10000);
        };
      } catch {
        startPolling();
      }
    };

    connectSSE();

    return () => {
      closed = true;
      stopPolling();
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }

  /**
   * Subscribes to owner live stream via SSE.
   */
  public subscribeToOwnerStream(
    onEvent: (type: string, data: any) => void,
    onStatusChange?: (status: 'connected' | 'reconnecting') => void
  ): () => void {
    let closed = false;
    let eventSource: EventSource | null = null;

    const connect = () => {
      if (closed) return;
      onStatusChange?.('reconnecting');

      try {
        eventSource = new EventSource(`${this.baseUrl}/api/owner/stream`, {
          withCredentials: true,
        });

        eventSource.onopen = () => {
          onStatusChange?.('connected');
        };

        eventSource.addEventListener('order.created', (event) => {
          onEvent('order.created', JSON.parse(event.data));
        });

        eventSource.addEventListener('order.updated', (event) => {
          onEvent('order.updated', JSON.parse(event.data));
        });

        eventSource.addEventListener('menu.updated', (event) => {
          onEvent('menu.updated', JSON.parse(event.data));
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          onStatusChange?.('reconnecting');
          setTimeout(() => {
            if (!closed) connect();
          }, 5000);
        };
      } catch {
        setTimeout(() => {
          if (!closed) connect();
        }, 5000);
      }
    };

    connect();

    return () => {
      closed = true;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }
}

export const apiAdapter = new ApiAdapter(
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || ''
);

