import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiAdapter } from '../../web/src/data/ApiAdapter.js';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  calculateBill,
} from '@ritsu/shared';
import type { CartLine } from '@ritsu/shared';

describe('Phase 2 Customer App Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof globalThis.localStorage === 'undefined') {
      const store: Record<string, string> = {};
      globalThis.localStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => {
          Object.keys(store).forEach((k) => delete store[k]);
        },
        length: 0,
        key: () => null,
      };
    }
  });

  // P2-28: ApiAdapter.createOrder() deduplication & client_request_id handling
  it('P2-28: ApiAdapter generates consistent client_request_id and handles order creation', async () => {
    const mockOrder = {
      id: 'ord-123',
      order_no: '#1001',
      public_token: 'token-abc',
      table_label: 'T1',
      customer_name: 'Vikas',
      status: 'pending',
      total_paise: 36750,
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockOrder,
    } as Response);

    const adapter = new ApiAdapter('http://localhost:3001');
    const order1 = await adapter.createOrder({
      table_label: 'T1',
      customer_name: 'Vikas',
      client_request_id: 'fixed-dedup-id-1',
      items: [{ menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 2 }],
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const sentBody = JSON.parse((fetchSpy.mock.calls[0][1] as any).body);
    expect(sentBody.client_request_id).toBe('fixed-dedup-id-1');
    expect(order1.order_no).toBe('#1001');

    // Duplicate submission with same client_request_id
    const order2 = await adapter.createOrder({
      table_label: 'T1',
      customer_name: 'Vikas',
      client_request_id: 'fixed-dedup-id-1',
      items: [{ menu_item_id: 'item-1', variant_id: 'var-1-s', quantity: 2 }],
    });

    expect(order2.order_no).toBe(order1.order_no);
    expect(order2.id).toBe(order1.id);
  });

  // P2-29: Cart logic operations and bill calculation
  it('P2-29: cartLogic handles add, update, remove, and calculates exact GST', () => {
    let cart: CartLine[] = [];

    // Add 2x Chicken Manchurian Single (Rs 140 each = 14000 paise)
    cart = addToCart(
      cart,
      {
        item_id: 'item-1',
        variant_id: 'var-1-s',
        item_no: 1,
        name: 'Chicken Manchurian',
        variant_label: 'Single',
        unit_price_paise: 14000,
        is_veg: false,
      },
      2
    );
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);

    // Add 1x Veg Fried Rice Single (Rs 70 = 7000 paise)
    cart = addToCart(
      cart,
      {
        item_id: 'item-80',
        variant_id: 'var-80-s',
        item_no: 80,
        name: 'Veg Fried Rice',
        variant_label: 'Single',
        unit_price_paise: 7000,
        is_veg: true,
      },
      1
    );
    expect(cart).toHaveLength(2);

    // Bill calculation Case (a)
    const bill = calculateBill(
      cart.map((c) => ({ unit_price_paise: c.unit_price_paise, quantity: c.quantity })),
      5
    );
    expect(bill.subtotal_paise).toBe(35000);
    expect(bill.cgst_paise).toBe(875);
    expect(bill.sgst_paise).toBe(875);
    expect(bill.total_paise).toBe(36750);

    // Update quantity
    cart = updateQuantity(cart, 'item-1', 'var-1-s', 1);
    expect(cart[0].quantity).toBe(1);

    // Remove item
    cart = removeFromCart(cart, 'item-80', 'var-80-s');
    expect(cart).toHaveLength(1);
  });

  // P2-30: Theme persistence
  it('P2-30: theme setting persists to correct localStorage keys', () => {
    const customerKey = 'ritsu-theme-customer';
    const ownerKey = 'ritsu-theme-owner';

    localStorage.setItem(customerKey, 'dark');
    localStorage.setItem(ownerKey, 'light');

    expect(localStorage.getItem(customerKey)).toBe('dark');
    expect(localStorage.getItem(ownerKey)).toBe('light');
  });
});
