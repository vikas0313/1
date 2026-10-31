import { describe, it, expect } from 'vitest';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  mergeCartLines,
  getCartTotalCount,
  MAX_ITEM_QUANTITY,
} from './cartLogic.js';
import type { CartLine } from './types.js';

const mockItem1: Omit<CartLine, 'quantity'> = {
  item_id: 'item-1',
  variant_id: 'var-1-s',
  item_no: 1,
  name: 'Chicken Manchurian',
  variant_label: 'Single',
  unit_price_paise: 14000,
  is_veg: false,
};

const mockItem2: Omit<CartLine, 'quantity'> = {
  item_id: 'item-1',
  variant_id: 'var-1-f',
  item_no: 1,
  name: 'Chicken Manchurian',
  variant_label: 'Full',
  unit_price_paise: 20000,
  is_veg: false,
};

const mockItem3: Omit<CartLine, 'quantity'> = {
  item_id: 'item-80',
  variant_id: 'var-80-s',
  item_no: 80,
  name: 'Veg Fried Rice',
  variant_label: 'Single',
  unit_price_paise: 7000,
  is_veg: true,
};

describe('cartLogic', () => {
  it('adds a new item to an empty cart', () => {
    const cart = addToCart([], mockItem1, 2);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
    expect(cart[0].variant_id).toBe('var-1-s');
  });

  it('increments quantity when adding same item and variant', () => {
    let cart = addToCart([], mockItem1, 1);
    cart = addToCart(cart, mockItem1, 2);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3);
  });

  it('treats different variants of the same item as separate cart lines', () => {
    let cart = addToCart([], mockItem1, 1);
    cart = addToCart(cart, mockItem2, 1);
    expect(cart).toHaveLength(2);
    expect(cart[0].variant_label).toBe('Single');
    expect(cart[1].variant_label).toBe('Full');
  });

  it('caps quantity at MAX_ITEM_QUANTITY', () => {
    let cart = addToCart([], mockItem1, 15);
    cart = addToCart(cart, mockItem1, 10);
    expect(cart[0].quantity).toBe(MAX_ITEM_QUANTITY);

    cart = updateQuantity(cart, 'item-1', 'var-1-s', 50);
    expect(cart[0].quantity).toBe(MAX_ITEM_QUANTITY);
  });

  it('removes item when quantity is updated to 0 or negative', () => {
    let cart = addToCart([], mockItem1, 2);
    cart = updateQuantity(cart, 'item-1', 'var-1-s', 0);
    expect(cart).toHaveLength(0);

    cart = addToCart([], mockItem1, 2);
    cart = updateQuantity(cart, 'item-1', 'var-1-s', -1);
    expect(cart).toHaveLength(0);
  });

  it('removes a specific line from cart', () => {
    let cart = addToCart([], mockItem1, 1);
    cart = addToCart(cart, mockItem3, 1);
    expect(cart).toHaveLength(2);

    cart = removeFromCart(cart, 'item-1', 'var-1-s');
    expect(cart).toHaveLength(1);
    expect(cart[0].item_id).toBe('item-80');
  });

  it('merges two carts correctly', () => {
    const cartA: CartLine[] = [
      { ...mockItem1, quantity: 2 },
      { ...mockItem3, quantity: 1 },
    ];
    const cartB: CartLine[] = [
      { ...mockItem1, quantity: 3 },
      { ...mockItem2, quantity: 1 },
    ];

    const merged = mergeCartLines(cartA, cartB);
    expect(merged).toHaveLength(3);
    const item1Single = merged.find(
      (l) => l.item_id === 'item-1' && l.variant_id === 'var-1-s'
    );
    expect(item1Single?.quantity).toBe(5);
  });

  it('calculates total count correctly', () => {
    const cart: CartLine[] = [
      { ...mockItem1, quantity: 2 },
      { ...mockItem2, quantity: 3 },
      { ...mockItem3, quantity: 1 },
    ];
    expect(getCartTotalCount(cart)).toBe(6);
  });
});
