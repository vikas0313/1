import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter } from './LocalStorageAdapter';

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageAdapter();
  });

  it('initializes with 165 menu items and 14 categories', async () => {
    const categories = await adapter.getCategories();
    expect(categories).toHaveLength(14);

    const items = await adapter.getMenuItems();
    expect(items).toHaveLength(165);
  });

  it('creates an order with pending status and unpaid payment status', async () => {
    const order = await adapter.createOrder({
      table_label: 'T1',
      customer_name: 'Rahul',
      status: 'pending',
      payment_status: 'unpaid',
      subtotal_paise: 35000,
      cgst_paise: 875,
      sgst_paise: 875,
      total_paise: 36750,
      items: [
        {
          id: 'item-line-1',
          menu_item_id: 'item-1',
          variant_id: 'var-1-s',
          item_no: 1,
          name_snapshot: 'Chicken Manchurian',
          variant_label_snapshot: 'Single',
          unit_price_paise: 14000,
          quantity: 2,
          is_veg: false,
        },
      ],
    });

    expect(order.id).toMatch(/^ORD-/);
    expect(order.table_label).toBe('T1');
    expect(order.customer_name).toBe('Rahul');
    expect(order.status).toBe('pending');
    expect(order.payment_status).toBe('unpaid');
    expect(order.total_paise).toBe(36750);

    const stored = await adapter.getOrders();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(order.id);
  });

  it('transitions order status following the state machine rules', async () => {
    const order = await adapter.createOrder({
      table_label: 'T2',
      customer_name: 'Priya',
      status: 'pending',
      payment_status: 'unpaid',
      subtotal_paise: 15000,
      cgst_paise: 375,
      sgst_paise: 375,
      total_paise: 15750,
      items: [],
    });

    // Valid forward transition
    const prepOrder = await adapter.updateOrderStatus(order.id, 'preparing');
    expect(prepOrder.status).toBe('preparing');

    const readyOrder = await adapter.updateOrderStatus(order.id, 'ready');
    expect(readyOrder.status).toBe('ready');

    const compOrder = await adapter.updateOrderStatus(order.id, 'complete');
    expect(compOrder.status).toBe('complete');

    // Invalid backwards or skipping transition
    await expect(adapter.updateOrderStatus(order.id, 'preparing')).rejects.toThrow(
      'Illegal order status transition'
    );
  });

  it('updates payment status and records payment method independently', async () => {
    const order = await adapter.createOrder({
      table_label: 'T3',
      customer_name: 'Amit',
      status: 'pending',
      payment_status: 'unpaid',
      subtotal_paise: 10000,
      cgst_paise: 250,
      sgst_paise: 250,
      total_paise: 10500,
      items: [],
    });

    const paidOrder = await adapter.updatePaymentStatus(order.id, 'paid', 'counter_cash');
    expect(paidOrder.payment_status).toBe('paid');
    expect(paidOrder.payment_method).toBe('counter_cash');
    // Order status remains pending
    expect(paidOrder.status).toBe('pending');
  });

  it('notifies subscribers synchronously when an order is created or changed', async () => {
    let capturedOrdersCount = 0;
    const unsubscribe = adapter.subscribeToOrders((orders) => {
      capturedOrdersCount = orders.length;
    });

    expect(capturedOrdersCount).toBe(0);

    await adapter.createOrder({
      table_label: 'T4',
      customer_name: 'Sneha',
      status: 'pending',
      payment_status: 'unpaid',
      subtotal_paise: 5000,
      cgst_paise: 125,
      sgst_paise: 125,
      total_paise: 5250,
      items: [],
    });

    expect(capturedOrdersCount).toBe(1);
    unsubscribe();
  });
});
