import type { CartLine } from './types.js';

export const MAX_ITEM_QUANTITY = 20;

/**
 * Checks if two cart items represent the same line item (item_id + variant_id).
 */
export function isSameCartLine(a: { item_id: string; variant_id: string }, b: { item_id: string; variant_id: string }): boolean {
  return a.item_id === b.item_id && a.variant_id === b.variant_id;
}

/**
 * Adds an item to the cart or increments its quantity if it already exists.
 * Quantity is capped at MAX_ITEM_QUANTITY (20).
 */
export function addToCart(
  cart: CartLine[],
  item: Omit<CartLine, 'quantity'> & { quantity?: number },
  quantityToAdd: number = 1
): CartLine[] {
  const addQty = item.quantity ?? quantityToAdd;
  if (addQty <= 0) return cart;

  const existingIndex = cart.findIndex((line) => isSameCartLine(line, item));

  if (existingIndex >= 0) {
    const existing = cart[existingIndex];
    const newQty = Math.min(MAX_ITEM_QUANTITY, existing.quantity + addQty);
    const updated = [...cart];
    updated[existingIndex] = {
      ...existing,
      quantity: newQty,
      note: item.note !== undefined ? item.note : existing.note,
    };
    return updated;
  }

  const initialQty = Math.min(MAX_ITEM_QUANTITY, addQty);
  return [
    ...cart,
    {
      ...item,
      quantity: initialQty,
    },
  ];
}

/**
 * Removes a specific line from the cart.
 */
export function removeFromCart(cart: CartLine[], item_id: string, variant_id: string): CartLine[] {
  return cart.filter((line) => !(line.item_id === item_id && line.variant_id === variant_id));
}

/**
 * Updates the quantity for a specific cart line.
 * If new quantity <= 0, the line is removed.
 * If new quantity > MAX_ITEM_QUANTITY, it is capped.
 */
export function updateQuantity(
  cart: CartLine[],
  item_id: string,
  variant_id: string,
  quantity: number
): CartLine[] {
  if (quantity <= 0) {
    return removeFromCart(cart, item_id, variant_id);
  }

  const cappedQty = Math.min(MAX_ITEM_QUANTITY, quantity);
  return cart.map((line) => {
    if (line.item_id === item_id && line.variant_id === variant_id) {
      return { ...line, quantity: cappedQty };
    }
    return line;
  });
}

/**
 * Merges two cart line lists, combining quantities for matching (item_id, variant_id) lines.
 */
export function mergeCartLines(cartA: CartLine[], cartB: CartLine[]): CartLine[] {
  let result = [...cartA];
  for (const line of cartB) {
    result = addToCart(result, line, line.quantity);
  }
  return result;
}

/**
 * Calculates total item count across all lines in the cart.
 */
export function getCartTotalCount(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

