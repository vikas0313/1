import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Category, MenuItem, MenuItemVariant, CartLine, Order } from '@ritsu/shared';
import { addToCart, updateQuantity, getCartTotalCount, calculateBill } from '@ritsu/shared';
import { apiAdapter } from '../../data/ApiAdapter.js';
import { TabBar } from '../../components/TabBar.js';
import { MenuRow } from '../../components/MenuRow.js';
import { MenuRowSkeleton } from '../../components/Skeleton.js';
import { ThemeToggle } from '../../components/ThemeToggle.js';
import { OfflineBanner } from '../../components/OfflineBanner.js';
import { CartSheet } from './CartSheet.js';
import { Toast } from '../../components/Toast.js';

export interface MenuPageProps {
  tableLabel: string;
  customerName: string;
  onOrderPlaced: (order: Order) => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({
  tableLabel,
  customerName,
  onOrderPlaced,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non_veg'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart state persisted to localStorage
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      const saved = localStorage.getItem('ritsu_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Client request ID for idempotent submission
  const clientRequestIdRef = useRef<string>(
    `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
  );

  useEffect(() => {
    localStorage.setItem('ritsu_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    setIsLoading(true);
    apiAdapter
      .getMenu()
      .then((data) => {
        setCategories(data.categories);
        setItems(data.items);
        if (data.categories.length > 0) {
          setActiveCategoryId(data.categories[0].id);
        }
      })
      .catch((err) => {
        setToastMessage(`Failed to load menu: ${err.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Filtered items based on diet and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (activeCategoryId && item.category_id !== activeCategoryId && !searchQuery.trim()) {
        return false;
      }
      // Diet filter
      if (dietFilter === 'veg' && !item.is_veg) return false;
      if (dietFilter === 'non_veg' && item.is_veg) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchNo = item.item_no.toString() === q;
        const matchDesc = item.description.toLowerCase().includes(q);
        return matchName || matchNo || matchDesc;
      }

      return true;
    });
  }, [items, activeCategoryId, dietFilter, searchQuery]);

  const handleAddToCart = (variant: MenuItemVariant, qty: number) => {
    const parentItem = items.find((i) => i.id === variant.menu_item_id);
    if (!parentItem) return;

    setCart((prevCart) =>
      addToCart(
        prevCart,
        {
          item_id: parentItem.id,
          variant_id: variant.id,
          item_no: parentItem.item_no,
          name: parentItem.name,
          variant_label: variant.label,
          unit_price_paise: variant.price_paise,
          is_veg: parentItem.is_veg,
        },
        qty
      )
    );
  };

  const handleUpdateQuantity = (itemId: string, variantId: string, qty: number) => {
    setCart((prevCart) => updateQuantity(prevCart, itemId, variantId, qty));
  };

  const getVariantQuantity = (variantId: string) => {
    const line = cart.find((l) => l.variant_id === variantId);
    return line ? line.quantity : 0;
  };

  const handlePlaceOrder = async (note: string) => {
    if (cart.length === 0 || isSubmitting) return;

    if (!navigator.onLine) {
      setToastMessage('Cannot place order while offline. Please connect to internet.');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await apiAdapter.createOrder({
        table_label: tableLabel,
        customer_name: customerName,
        note,
        client_request_id: clientRequestIdRef.current,
        items: cart.map((line) => ({
          menu_item_id: line.item_id,
          variant_id: line.variant_id,
          quantity: line.quantity,
        })),
      });

      // Clear cart on success
      setCart([]);
      localStorage.removeItem('ritsu_cart');
      setIsCartOpen(false);

      // Save order token to local list for history
      try {
        const tokens = JSON.parse(localStorage.getItem('ritsu_orders') || '[]');
        tokens.unshift(order.public_token);
        localStorage.setItem('ritsu_orders', JSON.stringify(tokens.slice(0, 10)));
      } catch {}

      onOrderPlaced(order);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to place order. You can safely retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCount = getCartTotalCount(cart);
  const bill = calculateBill(
    cart.map((l) => ({ unit_price_paise: l.unit_price_paise, quantity: l.quantity })),
    5
  );

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] pb-24">
      <OfflineBanner />

      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border-hairline)] px-4 py-3 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <span className="font-serif text-[18px] font-bold text-[var(--text-primary)] tracking-tight">
              Ritsu Food Corner
            </span>
            <div className="text-[12px] text-[var(--gold-ink)] font-medium">
              Table {tableLabel} · {customerName}
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Category Tabs */}
      <TabBar
        tabs={categories.map((c) => ({ id: c.id, label: c.name }))}
        activeTabId={activeCategoryId}
        onSelectTab={(id) => {
          setActiveCategoryId(id);
          setSearchQuery('');
        }}
      />

      {/* Controls: Search and Diet Filters */}
      <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between border-b border-[var(--border-hairline)]">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search all 165 dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-[13px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-primary)] focus:border-[var(--border-gold)] focus:outline-none"
          />
          <span className="absolute left-2.5 top-2 text-[var(--text-tertiary)] text-xs">🔍</span>
        </div>

        {/* Diet Filter Pills */}
        <div className="flex items-center gap-1 self-start sm:self-auto shrink-0 select-none">
          <button
            type="button"
            onClick={() => setDietFilter('all')}
            className={`px-2.5 py-1 text-[12px] uppercase tracking-wider rounded-[2px] border font-medium transition-colors ${
              dietFilter === 'all'
                ? 'bg-[var(--gold-ink)] text-[var(--gold-ink-contrast)] border-transparent'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:border-[var(--border-gold)]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setDietFilter('veg')}
            className={`px-2.5 py-1 text-[12px] uppercase tracking-wider rounded-[2px] border font-medium transition-colors ${
              dietFilter === 'veg'
                ? 'bg-[var(--veg-dot)] text-white border-transparent'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:border-[var(--veg-dot)]'
            }`}
          >
            🟢 Veg
          </button>
          <button
            type="button"
            onClick={() => setDietFilter('non_veg')}
            className={`px-2.5 py-1 text-[12px] uppercase tracking-wider rounded-[2px] border font-medium transition-colors ${
              dietFilter === 'non_veg'
                ? 'bg-[var(--non-veg-dot)] text-white border-transparent'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:border-[var(--non-veg-dot)]'
            }`}
          >
            🔴 Non-Veg
          </button>
        </div>
      </div>

      {/* Dishes List */}
      <main className="max-w-3xl mx-auto px-4 py-2">
        {isLoading ? (
          <div>
            <MenuRowSkeleton />
            <MenuRowSkeleton />
            <MenuRowSkeleton />
            <MenuRowSkeleton />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-secondary)] text-[14px]">
            No dishes found matching your selection.
          </div>
        ) : (
          <div>
            {filteredItems.map((item) => (
              <MenuRow
                key={item.id}
                item={item}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={(vId, qty) => handleUpdateQuantity(item.id, vId, qty)}
                getVariantQuantity={getVariantQuantity}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar (Shown when items in cart) */}
      {totalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full h-13 bg-[var(--gold-ink)] text-[var(--gold-ink-contrast)] px-5 rounded-[3px] shadow-xl flex items-center justify-between font-medium tracking-wide active:scale-[0.99] transition-transform select-none"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--gold-ink-contrast)] text-[var(--gold-ink)] font-bold text-xs flex items-center justify-center">
                {totalCount}
              </span>
              <span className="text-[14px] uppercase font-semibold">
                {totalCount === 1 ? '1 item' : `${totalCount} items`}
              </span>
            </div>

            <div className="flex items-center gap-2 font-serif text-[17px]">
              <span>₹{(bill.total_paise / 100).toFixed(2)}</span>
              <span className="text-sm">→</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Sheet Modal */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onPlaceOrder={handlePlaceOrder}
        isSubmitting={isSubmitting}
        tableLabel={tableLabel}
        customerName={customerName}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};
