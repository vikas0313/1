import { describe, it, expect } from 'vitest';
import { calculateBill, formatINR } from './pricing';
import { canTransition, getNextStep, canCancel, assertValidTransition } from './state-machine';
import { addToCart, updateQuantity, removeFromCart, getCartLineKey } from './cart';
import { CartLine } from '../types/order';

describe('Domain: Pricing & Indian GST Rules', () => {
  it('passes Test Case 1: 2 x Rs140 + 1 x Rs70 -> subtotal 350.00, tax 17.50 (CGST 8.75, SGST 8.75), total 367.50', () => {
    const items = [
      { unit_price_paise: 14000, quantity: 2 }, // 2 x ₹140
      { unit_price_paise: 7000, quantity: 1 },  // 1 x ₹70
    ];

    const bill = calculateBill(items);

    expect(bill.subtotal_paise).toBe(35000); // ₹350.00
    expect(bill.tax_paise).toBe(1750);      // ₹17.50
    expect(bill.cgst_paise).toBe(875);      // ₹8.75
    expect(bill.sgst_paise).toBe(875);      // ₹8.75
    expect(bill.cgst_paise + bill.sgst_paise).toBe(bill.tax_paise);
    expect(bill.total_paise).toBe(36750);   // ₹367.50
    expect(formatINR(bill.total_paise)).toBe('₹367.50');
  });

  it('passes Test Case 2: 1 x Rs120 + 1 x Rs20 + 1 x Rs10 -> subtotal 150.00, tax 7.50 (CGST 3.75, SGST 3.75), total 157.50', () => {
    const items = [
      { unit_price_paise: 12000, quantity: 1 }, // 1 x ₹120
      { unit_price_paise: 2000, quantity: 1 },  // 1 x ₹20
      { unit_price_paise: 1000, quantity: 1 },  // 1 x ₹10
    ];

    const bill = calculateBill(items);

    expect(bill.subtotal_paise).toBe(15000); // ₹150.00
    expect(bill.tax_paise).toBe(750);       // ₹7.50
    expect(bill.cgst_paise).toBe(375);      // ₹3.75
    expect(bill.sgst_paise).toBe(375);      // ₹3.75
    expect(bill.cgst_paise + bill.sgst_paise).toBe(bill.tax_paise);
    expect(bill.total_paise).toBe(15750);   // ₹157.50
    expect(formatINR(bill.total_paise)).toBe('₹157.50');
  });

  it('handles odd tax paise without losing 1 paisa (cgst floor, sgst remainder)', () => {
    // 1 x ₹133 = 13300 paise. 5% = 665 paise (odd)
    const items = [{ unit_price_paise: 13300, quantity: 1 }];
    const bill = calculateBill(items);

    expect(bill.subtotal_paise).toBe(13300);
    expect(bill.tax_paise).toBe(665);
    expect(bill.cgst_paise).toBe(332);
    expect(bill.sgst_paise).toBe(333);
    expect(bill.cgst_paise + bill.sgst_paise).toBe(665);
    expect(bill.total_paise).toBe(13965);
  });

  it('formats currency correctly with formatINR', () => {
    expect(formatINR(36750)).toBe('₹367.50');
    expect(formatINR(14000, false)).toBe('₹140');
    expect(formatINR(0)).toBe('₹0.00');
  });
});

describe('Domain: Order Status State Machine', () => {
  it('allows strict forward transitions (pending -> preparing -> ready -> complete)', () => {
    expect(canTransition('pending', 'preparing')).toBe(true);
    expect(canTransition('preparing', 'ready')).toBe(true);
    expect(canTransition('ready', 'complete')).toBe(true);

    expect(getNextStep('pending')).toBe('preparing');
    expect(getNextStep('preparing')).toBe('ready');
    expect(getNextStep('ready')).toBe('complete');
    expect(getNextStep('complete')).toBeNull();
  });

  it('disallows skipping steps and backward transitions', () => {
    expect(canTransition('pending', 'ready')).toBe(false);
    expect(canTransition('pending', 'complete')).toBe(false);
    expect(canTransition('preparing', 'pending')).toBe(false);
    expect(canTransition('ready', 'preparing')).toBe(false);
    expect(canTransition('complete', 'ready')).toBe(false);
  });

  it('allows cancellation only from pending or preparing', () => {
    expect(canCancel('pending')).toBe(true);
    expect(canCancel('preparing')).toBe(true);
    expect(canCancel('ready')).toBe(false);
    expect(canCancel('complete')).toBe(false);
    expect(canCancel('cancelled')).toBe(false);

    expect(canTransition('pending', 'cancelled')).toBe(true);
    expect(canTransition('preparing', 'cancelled')).toBe(true);
    expect(canTransition('ready', 'cancelled')).toBe(false);
  });

  it('throws descriptive error on invalid transition assert', () => {
    expect(() => assertValidTransition('ready', 'cancelled')).toThrow(
      'Illegal order status transition from "ready" to "cancelled"'
    );
  });
});

describe('Domain: Cart Identity & Quantity Logic', () => {
  const baseLine: CartLine = {
    item_id: 'item-1',
    variant_id: 'var-single',
    item_no: 1,
    name: 'Chicken Manchurian',
    variant_label: 'Single',
    unit_price_paise: 14000,
    quantity: 1,
    is_veg: false,
  };

  it('keeps separate lines for the same item in two different sizes (Single vs Full)', () => {
    let cart: CartLine[] = [];
    cart = addToCart(cart, baseLine);
    expect(cart).toHaveLength(1);

    const fullLine: CartLine = {
      item_id: 'item-1',
      variant_id: 'var-full',
      item_no: 1,
      name: 'Chicken Manchurian',
      variant_label: 'Full',
      unit_price_paise: 20000,
      quantity: 1,
      is_veg: false,
    };

    cart = addToCart(cart, fullLine);
    expect(cart).toHaveLength(2);
    expect(cart[0].variant_label).toBe('Single');
    expect(cart[1].variant_label).toBe('Full');
    expect(cart[0].unit_price_paise).toBe(14000);
    expect(cart[1].unit_price_paise).toBe(20000);
  });

  it('increments quantity when adding the identical item and variant', () => {
    let cart = [baseLine];
    cart = addToCart(cart, { ...baseLine, quantity: 2 });
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3);
  });

  it('enforces maximum quantity limit (20)', () => {
    let cart = [baseLine];
    cart = addToCart(cart, { ...baseLine, quantity: 25 }, 20);
    expect(cart[0].quantity).toBe(20);

    cart = updateQuantity(cart, 'item-1', 'var-single', 99, 20);
    expect(cart[0].quantity).toBe(20);
  });

  it('removes item when quantity updated to 0 or via removeFromCart', () => {
    let cart = [baseLine];
    cart = updateQuantity(cart, 'item-1', 'var-single', 0);
    expect(cart).toHaveLength(0);

    cart = [baseLine];
    cart = removeFromCart(cart, 'item-1', 'var-single');
    expect(cart).toHaveLength(0);
  });

  it('generates consistent cart line keys', () => {
    expect(getCartLineKey('item-1', 'var-single')).toBe('item-1__var-single');
  });
});
