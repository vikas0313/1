import { MenuRepository, OrderRepository, OrderSubscriptionListener } from '../../types/repository';
import { MenuItem, Category } from '../../types/menu';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../../types/order';
import { SEED_CATEGORIES, SEED_MENU_ITEMS } from '../seed/menuSeed';
import { assertValidTransition } from '../../domain/state-machine';

const STORAGE_KEY_CATEGORIES = 'ritsu_categories_v1';
const STORAGE_KEY_MENU = 'ritsu_menu_v1';
const STORAGE_KEY_ORDERS = 'ritsu_orders_v1';
const BROADCAST_CHANNEL_NAME = 'ritsu_orders_bus';

export class LocalStorageAdapter implements MenuRepository, OrderRepository {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<OrderSubscriptionListener> = new Set();
  private eventSource: EventSource | null = null;

  constructor() {
    this.initStorage();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'ORDERS_UPDATED') {
          this.notifySubscribers();
        }
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY_ORDERS) {
          this.notifySubscribers();
        }
      });

      // Connect to local dev server SSE stream for instant multi-device live sync
      if ('EventSource' in window) {
        try {
          this.eventSource = new EventSource('/api/events');
          this.eventSource.onmessage = (event) => {
            try {
              const serverOrders: Order[] = JSON.parse(event.data);
              if (Array.isArray(serverOrders)) {
                localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(serverOrders));
                this.notifySubscribers(serverOrders);
              }
            } catch {}
          };
        } catch {
          // Fallback to local BroadcastChannel
        }
      }

      // Initial fetch from local server file store if available
      if ('fetch' in window) {
        fetch('/api/orders')
          .then((res) => (res.ok ? res.json() : null))
          .then((serverOrders) => {
            if (Array.isArray(serverOrders) && serverOrders.length > 0) {
              localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(serverOrders));
              this.notifySubscribers(serverOrders);
            }
          })
          .catch(() => {});
      }
    }
  }

  private initStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!localStorage.getItem(STORAGE_KEY_CATEGORIES)) {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(SEED_CATEGORIES));
      }
      if (!localStorage.getItem(STORAGE_KEY_MENU)) {
        localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(SEED_MENU_ITEMS));
      }
      if (!localStorage.getItem(STORAGE_KEY_ORDERS)) {
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify([]));
      }
    } catch (e) {
      console.error('Failed to initialize local storage', e);
    }
  }

  private broadcastUpdate(): void {
    try {
      if (this.channel) {
        this.channel.postMessage({ type: 'ORDERS_UPDATED', timestamp: Date.now() });
      }
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }
    this.notifySubscribers();
  }

  private notifySubscribers(providedOrders?: Order[]): void {
    const orders = providedOrders || this.readOrdersSync();
    this.listeners.forEach((listener) => {
      try {
        listener(orders);
      } catch (err) {
        console.error('Subscriber notification error', err);
      }
    });
  }

  private readOrdersSync(): Order[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (!raw) return [];
      const parsed: Order[] = JSON.parse(raw);
      // Always sort newest first
      return parsed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  }

  private saveOrdersSync(orders: Order[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    this.broadcastUpdate();
  }

  // ==================== MenuRepository ====================

  async getCategories(): Promise<Category[]> {
    if (typeof window === 'undefined') return SEED_CATEGORIES;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      return raw ? JSON.parse(raw) : SEED_CATEGORIES;
    } catch {
      return SEED_CATEGORIES;
    }
  }

  async getMenuItems(): Promise<MenuItem[]> {
    if (typeof window === 'undefined') return SEED_MENU_ITEMS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MENU);
      return raw ? JSON.parse(raw) : SEED_MENU_ITEMS;
    } catch {
      return SEED_MENU_ITEMS;
    }
  }

  async getMenuItemById(id: string): Promise<MenuItem | null> {
    const items = await this.getMenuItems();
    return items.find((i) => i.id === id) || null;
  }

  async updateMenuItem(item: MenuItem): Promise<MenuItem> {
    const items = await this.getMenuItems();
    const index = items.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
      localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(items));
      return item;
    }
    throw new Error(`Menu item not found with id ${item.id}`);
  }

  async updateVariantPrice(
    itemId: string,
    variantId: string,
    pricePaise: number,
    needsVerification = false
  ): Promise<MenuItem> {
    const items = await this.getMenuItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    const variant = item.variants.find((v) => v.id === variantId);
    if (!variant) throw new Error(`Variant ${variantId} not found`);

    variant.price_paise = pricePaise;
    variant.needs_verification = needsVerification;

    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(items));
    return item;
  }

  async toggleItemAvailability(itemId: string, available: boolean): Promise<MenuItem> {
    const items = await this.getMenuItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    item.available = available;
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(items));
    return item;
  }

  async toggleVariantAvailability(
    itemId: string,
    variantId: string,
    available: boolean
  ): Promise<MenuItem> {
    const items = await this.getMenuItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    const variant = item.variants.find((v) => v.id === variantId);
    if (!variant) throw new Error(`Variant ${variantId} not found`);

    variant.available = available;
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(items));
    return item;
  }

  async confirmVariantPrice(itemId: string, variantId: string): Promise<MenuItem> {
    return this.updateVariantPrice(itemId, variantId, (await this.getMenuItemById(itemId))?.variants.find(v => v.id === variantId)?.price_paise || 0, false);
  }

  async bulkUpdatePrices(multiplier: number, deltaPaise: number): Promise<void> {
    const items = await this.getMenuItems();
    items.forEach((item) => {
      item.variants.forEach((v) => {
        const newPrice = Math.max(100, Math.round(v.price_paise * multiplier + deltaPaise));
        v.price_paise = newPrice;
      });
    });
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(items));
  }

  async resetMenuToDefault(): Promise<MenuItem[]> {
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(SEED_MENU_ITEMS));
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(SEED_CATEGORIES));
    return SEED_MENU_ITEMS;
  }

  // ==================== OrderRepository ====================

  async getOrders(): Promise<Order[]> {
    return this.readOrdersSync();
  }

  async getOrderById(id: string): Promise<Order | null> {
    const orders = this.readOrdersSync();
    return orders.find((o) => o.id === id) || null;
  }

  async getOrdersByTable(tableLabel: string): Promise<Order[]> {
    const orders = this.readOrdersSync();
    return orders.filter((o) => o.table_label.toUpperCase() === tableLabel.toUpperCase());
  }

  async createOrder(orderInput: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    const orders = this.readOrdersSync();
    const now = new Date().toISOString();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const newOrder: Order = {
      ...orderInput,
      id: orderId,
      status: 'pending',
      payment_status: 'unpaid',
      created_at: now,
      updated_at: now,
      public_token: `tok_${Math.random().toString(36).substring(2)}${Date.now()}`,
    };

    const updatedOrders = [newOrder, ...orders];
    this.saveOrdersSync(updatedOrders);

    // Sync to local server file store so all other connected devices (phone / owner portal) update
    if (typeof window !== 'undefined' && 'fetch' in window) {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      }).catch(() => {});
    }

    return newOrder;
  }

  async updateOrderStatus(orderId: string, nextStatus: OrderStatus): Promise<Order> {
    const orders = this.readOrdersSync();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error(`Order ${orderId} not found`);

    const order = orders[index];
    // Enforce domain state machine transition rule
    assertValidTransition(order.status, nextStatus);

    const updatedOrder: Order = {
      ...order,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    orders[index] = updatedOrder;
    this.saveOrdersSync(orders);

    // Sync to local server
    if (typeof window !== 'undefined' && 'fetch' in window) {
      fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      }).catch(() => {});
    }

    return updatedOrder;
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    method?: PaymentMethod
  ): Promise<Order> {
    const orders = this.readOrdersSync();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error(`Order ${orderId} not found`);

    const order = orders[index];
    const updatedOrder: Order = {
      ...order,
      payment_status: paymentStatus,
      payment_method: method || order.payment_method,
      updated_at: new Date().toISOString(),
    };

    orders[index] = updatedOrder;
    this.saveOrdersSync(orders);

    // Sync to local server
    if (typeof window !== 'undefined' && 'fetch' in window) {
      fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: paymentStatus, payment_method: method }),
      }).catch(() => {});
    }

    return updatedOrder;
  }

  async clearAllOrders(): Promise<void> {
    this.saveOrdersSync([]);
    if (typeof window !== 'undefined' && 'fetch' in window) {
      fetch('/api/orders', { method: 'DELETE' }).catch(() => {});
    }
  }

  subscribeToOrders(callback: OrderSubscriptionListener): () => void {
    this.listeners.add(callback);
    // Immediately invoke listener with initial snapshot
    callback(this.readOrdersSync());

    return () => {
      this.listeners.delete(callback);
    };
  }
}
