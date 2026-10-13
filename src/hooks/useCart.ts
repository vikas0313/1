import { useState, useEffect, useMemo, useCallback } from 'react';
import { CartLine, BillCalculation } from '../types/order';
import { MenuItem, MenuItemVariant } from '../types/menu';
import { addToCart, updateQuantity, removeFromCart } from '../domain/cart';
import { calculateBill } from '../domain/pricing';
import { RESTAURANT_CONFIG } from '../config/restaurant.config';

const CART_STORAGE_KEY = 'ritsu_customer_cart_v1';
const CART_NOTE_STORAGE_KEY = 'ritsu_customer_cart_note_v1';

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = sessionStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [note, setNoteState] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(CART_NOTE_STORAGE_KEY) || '';
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    } catch (e) {
      console.warn('Failed to save cart to sessionStorage', e);
    }
  }, [lines]);

  const setNote = useCallback((text: string) => {
    setNoteState(text);
    try {
      sessionStorage.setItem(CART_NOTE_STORAGE_KEY, text);
    } catch (e) {
      console.warn('Failed to save note to sessionStorage', e);
    }
  }, []);

  const bill: BillCalculation = useMemo(() => {
    return calculateBill(lines, RESTAURANT_CONFIG.taxRatePercent);
  }, [lines]);

  const totalItemCount = useMemo(() => {
    return lines.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [lines]);

  const addItem = useCallback(
    (item: MenuItem, variant: MenuItemVariant, quantity = 1) => {
      const newLine = {
        item_id: item.id,
        variant_id: variant.id,
        item_no: item.item_no,
        name: item.name,
        variant_label: variant.label,
        unit_price_paise: variant.price_paise,
        quantity,
        is_veg: item.is_veg,
      };

      setLines((prev) => addToCart(prev, newLine, RESTAURANT_CONFIG.maxCartLineQuantity));
    },
    []
  );

  const updateLineQuantity = useCallback((itemId: string, variantId: string, quantity: number) => {
    setLines((prev) =>
      updateQuantity(prev, itemId, variantId, quantity, RESTAURANT_CONFIG.maxCartLineQuantity)
    );
  }, []);

  const removeLine = useCallback((itemId: string, variantId: string) => {
    setLines((prev) => removeFromCart(prev, itemId, variantId));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
    setNote('');
    sessionStorage.removeItem(CART_STORAGE_KEY);
    sessionStorage.removeItem(CART_NOTE_STORAGE_KEY);
  }, [setNote]);

  return {
    lines,
    bill,
    note,
    setNote,
    totalItemCount,
    addItem,
    updateLineQuantity,
    removeLine,
    clearCart,
  };
}
