import { MenuItem, Category } from './menu';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from './order';

export interface MenuRepository {
  getCategories(): Promise<Category[]>;
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemById(id: string): Promise<MenuItem | null>;
  updateMenuItem(item: MenuItem): Promise<MenuItem>;
  updateVariantPrice(
    itemId: string,
    variantId: string,
    pricePaise: number,
    needsVerification?: boolean
  ): Promise<MenuItem>;
  toggleItemAvailability(itemId: string, available: boolean): Promise<MenuItem>;
  toggleVariantAvailability(itemId: string, variantId: string, available: boolean): Promise<MenuItem>;
  confirmVariantPrice(itemId: string, variantId: string): Promise<MenuItem>;
  bulkUpdatePrices(multiplier: number, deltaPaise: number): Promise<void>;
  resetMenuToDefault(): Promise<MenuItem[]>;
}

export type OrderSubscriptionListener = (orders: Order[]) => void;

export interface OrderRepository {
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  getOrdersByTable(tableLabel: string): Promise<Order[]>;
  createOrder(orderInput: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order>;
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order>;
  updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    method?: PaymentMethod
  ): Promise<Order>;
  clearAllOrders(): Promise<void>;
  subscribeToOrders(callback: OrderSubscriptionListener): () => void;
}
