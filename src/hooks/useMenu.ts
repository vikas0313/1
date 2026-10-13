import { useState, useEffect, useCallback } from 'react';
import { Category, MenuItem } from '../types/menu';
import { getMenuRepository } from '../data/repositoryFactory';

export function useMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const menuRepo = getMenuRepository();

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cats, menuItems] = await Promise.all([
        menuRepo.getCategories(),
        menuRepo.getMenuItems(),
      ]);
      setCategories(cats.sort((a, b) => a.sort_order - b.sort_order));
      setItems(menuItems.sort((a, b) => a.sort_order - b.sort_order));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [menuRepo]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const toggleItemAvailability = async (itemId: string, available: boolean) => {
    const updated = await menuRepo.toggleItemAvailability(itemId, available);
    setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
  };

  const toggleVariantAvailability = async (
    itemId: string,
    variantId: string,
    available: boolean
  ) => {
    const updated = await menuRepo.toggleVariantAvailability(itemId, variantId, available);
    setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
  };

  const updateVariantPrice = async (
    itemId: string,
    variantId: string,
    pricePaise: number,
    needsVerification = false
  ) => {
    const updated = await menuRepo.updateVariantPrice(itemId, variantId, pricePaise, needsVerification);
    setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
  };

  const confirmVariantPrice = async (itemId: string, variantId: string) => {
    const updated = await menuRepo.confirmVariantPrice(itemId, variantId);
    setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
  };

  const bulkUpdatePrices = async (multiplier: number, deltaPaise: number) => {
    await menuRepo.bulkUpdatePrices(multiplier, deltaPaise);
    await loadMenu();
  };

  const resetMenuToDefault = async () => {
    const resetItems = await menuRepo.resetMenuToDefault();
    setItems(resetItems);
  };

  return {
    categories,
    items,
    loading,
    error,
    refresh: loadMenu,
    toggleItemAvailability,
    toggleVariantAvailability,
    updateVariantPrice,
    confirmVariantPrice,
    bulkUpdatePrices,
    resetMenuToDefault,
  };
}
