import { CartLine } from '../types/order';

export function getCartLineKey(itemId: string, variantId: string): string {
  return `${itemId}__${variantId}`;
}

export function addToCart(
  cart: CartLine[],
  newLine: Omit<CartLine, 'quantity'> & { quantity?: number },
  maxQuantity = 20
): CartLine[] {
  const quantityToAdd = Math.max(1, newLine.quantity || 1);
  const targetKey = getCartLineKey(newLine.item_id, newLine.variant_id);

  const existingIndex = cart.findIndex(
    (line) => getCartLineKey(line.item_id, line.variant_id) === targetKey
  );

  if (existingIndex >= 0) {
    const updated = [...cart];
    const newQty = Math.min(maxQuantity, updated[existingIndex].quantity + quantityToAdd);
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: newQty,
    };
    return updated;
  }

  return [
    ...cart,
    {
      ...newLine,
      quantity: Math.min(maxQuantity, quantityToAdd),
    },
  ];
}

export function updateQuantity(
  cart: CartLine[],
  itemId: string,
  variantId: string,
  newQuantity: number,
  maxQuantity = 20
): CartLine[] {
  const targetKey = getCartLineKey(itemId, variantId);

  if (newQuantity <= 0) {
    return cart.filter((line) => getCartLineKey(line.item_id, line.variant_id) !== targetKey);
  }

  const boundedQty = Math.min(maxQuantity, Math.max(1, newQuantity));
  return cart.map((line) => {
    if (getCartLineKey(line.item_id, line.variant_id) === targetKey) {
      return { ...line, quantity: boundedQty };
    }
    return line;
  });
}

export function removeFromCart(cart: CartLine[], itemId: string, variantId: string): CartLine[] {
  const targetKey = getCartLineKey(itemId, variantId);
  return cart.filter((line) => getCartLineKey(line.item_id, line.variant_id) !== targetKey);
}
