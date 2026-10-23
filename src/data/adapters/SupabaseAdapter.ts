import { MenuRepository, OrderRepository, OrderSubscriptionListener } from '../../types/repository';
import { MenuItem, Category } from '../../types/menu';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../../types/order';
import { supabase } from '../supabaseClient';
import { assertValidTransition } from '../../domain/state-machine';

const STORAGE_KEY_ORDER_TOKENS = 'ritsu_customer_order_tokens';
const CACHE_KEY_MENU = 'ritsu_cached_menu_items';
const CACHE_KEY_CATEGORIES = 'ritsu_cached_categories';

export class SupabaseAdapter implements MenuRepository, OrderRepository {
  // --------------------------------------------------------------------------
  // Helper: Token management for customer orders
  // --------------------------------------------------------------------------
  private getStoredTokens(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ORDER_TOKENS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToken(token: string): void {
    try {
      const tokens = this.getStoredTokens();
      if (!tokens.includes(token)) {
        tokens.push(token);
        localStorage.setItem(STORAGE_KEY_ORDER_TOKENS, JSON.stringify(tokens));
      }
    } catch (e) {
      console.error('Failed to save order token', e);
    }
  }

  // --------------------------------------------------------------------------
  // MenuRepository Implementation (Public Read, Owner Write)
  // --------------------------------------------------------------------------
  async getCategories(): Promise<Category[]> {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY_CATEGORIES);
      if (cached) {
        // Return cached while refreshing in background
        this.fetchAndCacheCategories();
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }

    return this.fetchAndCacheCategories();
  }

  private async fetchAndCacheCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, sort_order, diet_type')
      .order('sort_order', { ascending: true });

    if (error || !data) {
      console.error('Error fetching categories:', error);
      const fallback = sessionStorage.getItem(CACHE_KEY_CATEGORIES);
      return fallback ? JSON.parse(fallback) : [];
    }

    const categories: Category[] = data.map((c) => ({
      id: c.id,
      name: c.name,
      sort_order: c.sort_order,
      diet_type: c.diet_type,
    }));

    try {
      sessionStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch {
      // ignore
    }

    return categories;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY_MENU);
      if (cached) {
        // Return cached while refreshing in background
        this.fetchAndCacheMenuItems();
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }

    return this.fetchAndCacheMenuItems();
  }

  private async fetchAndCacheMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        id,
        category_id,
        item_no,
        name,
        description,
        is_veg,
        available,
        sort_order,
        image_url,
        menu_item_variants (
          id,
          label,
          price_paise,
          available,
          needs_verification,
          sort_order
        )
      `)
      .order('item_no', { ascending: true });

    if (error || !data) {
      console.error('Error fetching menu items:', error);
      const fallback = sessionStorage.getItem(CACHE_KEY_MENU);
      return fallback ? JSON.parse(fallback) : [];
    }

    const items: MenuItem[] = data.map((item: any) => ({
      id: item.id,
      category_id: item.category_id,
      item_no: item.item_no,
      name: item.name,
      description: item.description,
      is_veg: item.is_veg,
      available: item.available,
      image_url: item.image_url,
      sort_order: item.sort_order,
      variants: (item.menu_item_variants || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((v: any) => ({
          id: v.id,
          label: v.label,
          price_paise: v.price_paise,
          available: v.available,
          needs_verification: v.needs_verification,
        })),
    }));

    try {
      sessionStorage.setItem(CACHE_KEY_MENU, JSON.stringify(items));
    } catch {
      // ignore
    }

    return items;
  }

  async getMenuItemById(id: string): Promise<MenuItem | null> {
    const items = await this.getMenuItems();
    return items.find((i) => i.id === id) || null;
  }

  async updateMenuItem(item: MenuItem): Promise<MenuItem> {
    const { error } = await supabase
      .from('menu_items')
      .update({
        name: item.name,
        is_veg: item.is_veg,
        available: item.available,
        sort_order: item.sort_order,
      })
      .eq('id', item.id);

    if (error) throw new Error(error.message);
    sessionStorage.removeItem(CACHE_KEY_MENU);
    return item;
  }

  async updateVariantPrice(
    itemId: string,
    variantId: string,
    pricePaise: number,
    needsVerification = false
  ): Promise<MenuItem> {
    const { error } = await supabase
      .from('menu_item_variants')
      .update({
        price_paise: pricePaise,
        needs_verification: needsVerification,
      })
      .eq('id', variantId);

    if (error) throw new Error(error.message);
    sessionStorage.removeItem(CACHE_KEY_MENU);
    const updated = await this.getMenuItemById(itemId);
    if (!updated) throw new Error('Item not found');
    return updated;
  }

  async toggleItemAvailability(itemId: string, available: boolean): Promise<MenuItem> {
    const { error } = await supabase
      .from('menu_items')
      .update({ available })
      .eq('id', itemId);

    if (error) throw new Error(error.message);
    sessionStorage.removeItem(CACHE_KEY_MENU);
    const updated = await this.getMenuItemById(itemId);
    if (!updated) throw new Error('Item not found');
    return updated;
  }

  async toggleVariantAvailability(
    itemId: string,
    variantId: string,
    available: boolean
  ): Promise<MenuItem> {
    const { error } = await supabase
      .from('menu_item_variants')
      .update({ available })
      .eq('id', variantId);

    if (error) throw new Error(error.message);
    sessionStorage.removeItem(CACHE_KEY_MENU);
    const updated = await this.getMenuItemById(itemId);
    if (!updated) throw new Error('Item not found');
    return updated;
  }

  async confirmVariantPrice(itemId: string, variantId: string): Promise<MenuItem> {
    const { error } = await supabase
      .from('menu_item_variants')
      .update({ needs_verification: false })
      .eq('id', variantId);

    if (error) throw new Error(error.message);
    sessionStorage.removeItem(CACHE_KEY_MENU);
    const updated = await this.getMenuItemById(itemId);
    if (!updated) throw new Error('Item not found');
    return updated;
  }

  async bulkUpdatePrices(_multiplier: number, _deltaPaise: number): Promise<void> {
    // Owner helper
    sessionStorage.removeItem(CACHE_KEY_MENU);
  }

  async resetMenuToDefault(): Promise<MenuItem[]> {
    sessionStorage.removeItem(CACHE_KEY_MENU);
    return this.getMenuItems();
  }

  // --------------------------------------------------------------------------
  // OrderRepository Implementation
  // --------------------------------------------------------------------------
  async getOrders(): Promise<Order[]> {
    // Owner view: Queries all orders with snapshots
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        table_label,
        customer_name,
        status,
        payment_status,
        payment_method,
        subtotal_paise,
        cgst_paise,
        sgst_paise,
        total_paise,
        note,
        created_at,
        updated_at,
        public_token,
        order_items (
          id,
          order_id,
          menu_item_id,
          variant_id,
          item_no_snapshot,
          name_snapshot,
          variant_label_snapshot,
          unit_price_paise,
          quantity,
          is_veg
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return (data || []).map((o: any) => ({
      id: o.id,
      table_label: o.table_label,
      customer_name: o.customer_name,
      status: o.status,
      payment_status: o.payment_status,
      payment_method: o.payment_method,
      subtotal_paise: o.subtotal_paise,
      cgst_paise: o.cgst_paise,
      sgst_paise: o.sgst_paise,
      total_paise: o.total_paise,
      note: o.note,
      created_at: o.created_at,
      updated_at: o.updated_at,
      public_token: o.public_token,
      items: (o.order_items || []).map((oi: any) => ({
        id: oi.id,
        order_id: oi.order_id,
        menu_item_id: oi.menu_item_id,
        variant_id: oi.variant_id,
        item_no: oi.item_no_snapshot,
        name_snapshot: oi.name_snapshot,
        variant_label_snapshot: oi.variant_label_snapshot,
        unit_price_paise: oi.unit_price_paise,
        quantity: oi.quantity,
        is_veg: oi.is_veg,
      })),
    }));
  }

  async getOrderById(id: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find((o) => o.id === id) || null;
  }

  async getOrdersByTable(tableLabel: string): Promise<Order[]> {
    // For customers: Fetch orders using the stored public tokens on this device
    const tokens = this.getStoredTokens();
    if (tokens.length === 0) return [];

    const fetchedOrders: Order[] = [];
    for (const token of tokens) {
      const { data, error } = await supabase.rpc('get_order_by_token', {
        p_token: token,
      });

      if (!error && data && data.table_label === tableLabel) {
        fetchedOrders.push(data);
      }
    }

    return fetchedOrders;
  }

  async createOrder(
    orderInput: Omit<Order, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Order> {
    const clientRequestId = `cr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const payload = {
      table_label: orderInput.table_label,
      customer_name: orderInput.customer_name,
      note: orderInput.note,
      client_request_id: clientRequestId,
      items: orderInput.items.map((i) => ({
        menu_item_id: i.menu_item_id,
        variant_id: i.variant_id,
        quantity: i.quantity,
      })),
    };

    let publicToken: string | null = null;

    // 1. Try invoking create-order Edge Function first
    try {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: payload,
      });

      if (!error && data?.public_token) {
        publicToken = data.public_token;
      }
    } catch {
      // Edge Function not reachable or not deployed; fallback to direct RPC below
    }

    // 2. Fallback: Invoke create_order_direct RPC in database
    if (!publicToken) {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('create_order_direct', {
        p_table_label: payload.table_label,
        p_customer_name: payload.customer_name,
        p_note: payload.note || null,
        p_client_request_id: payload.client_request_id,
        p_items: payload.items,
      });

      if (rpcErr || !rpcData?.public_token) {
        throw new Error(rpcErr?.message || 'Failed to place order via Supabase backend');
      }

      publicToken = rpcData.public_token;
    }

    const finalToken: string = publicToken!;
    this.saveToken(finalToken);

    // Fetch the newly created order via token
    const { data: createdOrder, error: getErr } = await supabase.rpc(
      'get_order_by_token',
      { p_token: finalToken }
    );

    if (getErr || !createdOrder) {
      throw new Error('Order placed but failed to retrieve status');
    }

    return createdOrder;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    // Client-side guard before DB trigger guard
    const existing = await this.getOrderById(orderId);
    if (existing) {
      assertValidTransition(existing.status, status);
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update order status');
    }

    const updated = await this.getOrderById(orderId);
    return updated!;
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    method?: PaymentMethod
  ): Promise<Order> {
    if (paymentStatus === 'paid') {
      const order = await this.getOrderById(orderId);
      if (!order) throw new Error('Order not found');

      // 1. Insert completed payment record (required by DB trigger)
      const { error: payErr } = await supabase.from('payments').insert({
        order_id: orderId,
        provider: 'manual',
        amount_paise: order.total_paise,
        method: method || 'counter_cash',
        status: 'completed',
      });

      if (payErr) {
        throw new Error(`Failed to record payment: ${payErr.message}`);
      }
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        payment_method: method,
      })
      .eq('id', orderId);

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    const updated = await this.getOrderById(orderId);
    return updated!;
  }

  async clearAllOrders(): Promise<void> {
    // Test helper only
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }

  subscribeToOrders(callback: OrderSubscriptionListener): () => void {
    // Subscribe to Postgres changes on the orders table
    const channel = supabase
      .channel('ritsu_live_orders_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async () => {
          const freshOrders = await this.getOrders();
          callback(freshOrders);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
