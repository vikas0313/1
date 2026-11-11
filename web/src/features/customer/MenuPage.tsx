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
import { TopBar } from '../../components/TopBar.js';
import { CategoryTile } from '../../components/CategoryTile.js';
import { Search } from 'lucide-react';

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
      } catch { }

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
      <TopBar
        title="Ritsu Food Corner"
        subtitle={`Table ${tableLabel} · ${customerName}`}
        tableLabel={tableLabel}
      />

      <div className="max-w-7xl mx-auto px-4 pt-3 pb-6">
        {/* Search Bar & Diet Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
          {/* Search: fully rounded bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-3.5" />
            <input
              type="search"
              placeholder="Search 165 dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="touch-target w-full h-11 pl-11 pr-4 text-[14px] bg-[var(--surface)] border border-[var(--border)] rounded-full text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Diet Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 select-none">
            <button
              type="button"
              onClick={() => setDietFilter('all')}
              className={`touch-target px-4 h-10 text-[13px] rounded-full border font-medium transition-all ${
                dietFilter === 'all'
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] border-[var(--accent)] font-semibold shadow-2xs'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setDietFilter('veg')}
              className={`touch-target inline-flex items-center gap-1.5 px-4 h-10 text-[13px] rounded-full border font-medium transition-all ${
                dietFilter === 'veg'
                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs'
                  : 'bg-[var(--surface)] text-[var(--veg)] border-[var(--border)] hover:border-emerald-500/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[var(--veg)] shrink-0" />
              <span>Veg</span>
            </button>
            <button
              type="button"
              onClick={() => setDietFilter('non_veg')}
              className={`touch-target inline-flex items-center gap-1.5 px-4 h-10 text-[13px] rounded-full border font-medium transition-all ${
                dietFilter === 'non_veg'
                  ? 'bg-red-600 text-white border-red-600 font-semibold shadow-2xs'
                  : 'bg-[var(--surface)] text-[var(--nonveg)] border-[var(--border)] hover:border-red-500/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[var(--nonveg)] shrink-0" />
              <span>Non-Veg</span>
            </button>
          </div>
        </div>

        {/* Category Tiles (Scrollable row) */}
        {!searchQuery.trim() && (
          <div className="mb-6">
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5">
              {categories.map((c) => (
                <CategoryTile
                  key={c.id}
                  category={c}
                  isActive={c.id === activeCategoryId}
                  onClick={() => {
                    setActiveCategoryId(c.id);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Category Heading */}
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--text)]">
            {searchQuery.trim()
              ? `Search results (${filteredItems.length})`
              : categories.find((c) => c.id === activeCategoryId)?.name || 'Menu'}
          </h2>
          <span className="text-[13px] text-[var(--text-muted)] font-medium">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Responsive Dishes Grid */}
        <main>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <MenuRowSkeleton />
              <MenuRowSkeleton />
              <MenuRowSkeleton />
              <MenuRowSkeleton />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-muted)] text-[15px] warm-card p-8">
              No dishes found matching your selection.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
      </div>

      {/* Floating Bottom Cart Bar (Shown on mobile & tablet when cart has items) */}
      {totalCount > 0 && (
        <div className="fixed bottom-22 md:bottom-6 left-4 right-4 max-w-md mx-auto z-40">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full h-14 bg-[var(--nav)] text-[var(--on-nav)] dark:bg-[var(--accent)] dark:text-[var(--on-accent)] px-5 rounded-full shadow-xl flex items-center justify-between font-semibold active:scale-[0.98] transition-all select-none border border-[var(--border)]/20"
          >
            <div className="flex items-center gap-2.5">
              <span className="min-w-6 h-6 px-1.5 rounded-full bg-[var(--accent)] text-[var(--on-accent)] dark:bg-[var(--on-accent)] dark:text-[var(--accent)] font-bold text-[12px] flex items-center justify-center">
                {totalCount}
              </span>
              <span className="text-[14px]">
                {totalCount === 1 ? '1 item added' : `${totalCount} items added`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[16px] tabular-nums">
              <span>View Cart · ₹{(bill.total_paise / 100).toFixed(2)}</span>
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

