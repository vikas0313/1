import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TableGuard } from '../components/customer/TableGuard';
import { NamePromptModal } from '../components/customer/NamePromptModal';
import { Header } from '../components/common/Header';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { DemoBanner } from '../components/common/DemoBanner';
import { MenuCategoryTabs } from '../components/customer/MenuCategoryTabs';
import { MenuItemCard } from '../components/customer/MenuItemCard';
import { VariantSelectorModal } from '../components/customer/VariantSelectorModal';
import { CartDrawer } from '../components/customer/CartDrawer';
import { UpiPaymentModal } from '../components/customer/UpiPaymentModal';
import { OrderTracker } from '../components/customer/OrderTracker';
import { ReceiptView } from '../components/customer/ReceiptView';
import { AdminOrdersModal } from '../components/customer/AdminOrdersModal';
import { useMenu } from '../hooks/useMenu';
import { useCart } from '../hooks/useCart';
import { useOrders } from '../hooks/useOrders';
import { MenuItem } from '../types/menu';
import { Order } from '../types/order';
import { formatINR } from '../domain/pricing';
import { ShoppingBag, ArrowRight, CheckCircle, Star } from 'lucide-react';

/** Clear all customer session data for a given table and reload the page */
function clearCustomerSession(tableLabel: string) {
  try {
    sessionStorage.removeItem(`ritsu_cust_name_${tableLabel}`);
    sessionStorage.removeItem('ritsu_current_table');
    sessionStorage.removeItem(`ritsu_session_orders_${tableLabel.toUpperCase()}`);
    // Also clear any stored order tokens so no stale orders appear
    localStorage.removeItem('ritsu_customer_order_tokens');
  } catch {
    // ignore storage errors
  }
  // Reload the page to reset to a fresh state
  window.location.reload();
}

export const CustomerPage: React.FC = () => {
  return (
    <TableGuard>
      {(tableLabel) => <CustomerPageContent tableLabel={tableLabel} />}
    </TableGuard>
  );
};

const CustomerPageContent: React.FC<{ tableLabel: string }> = ({ tableLabel }) => {
  const [customerName, setCustomerName] = useState<string>('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('cat-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non_veg'>('all');

  // Modal states
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Thank-you / auto-logout state
  const [isPaidOut, setIsPaidOut] = useState<boolean>(false);

  const sessionOrdersKey = `ritsu_session_orders_${tableLabel.toUpperCase()}`;

  // Session-scoped order IDs placed by this customer during their current dining visit.
  // Historical / previous customer orders are completely excluded and never remembered.
  const [sessionOrderIds, setSessionOrderIds] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem(sessionOrdersKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const recordNewSessionOrder = (orderId: string) => {
    setSessionOrderIds((prev) => {
      if (prev.includes(orderId)) return prev;
      const updated = [...prev, orderId];
      try {
        sessionStorage.setItem(sessionOrdersKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Data hooks
  const { categories, items, loading: menuLoading } = useMenu();
  const {
    lines,
    bill,
    note,
    setNote,
    totalItemCount,
    addItem,
    updateLineQuantity,
    removeLine,
    clearCart,
  } = useCart();
  const { orders: tableOrders, createOrder } = useOrders({ tableLabel });

  // Only orders placed by THIS customer in THIS active dining session.
  // Never show historical / earlier orders from other customers or previous visits!
  const sessionOrders = useMemo(() => {
    if (sessionOrderIds.length === 0) return [];
    return tableOrders.filter((o) => sessionOrderIds.includes(o.id));
  }, [tableOrders, sessionOrderIds]);

  // Auto-logout: when every order placed in this active session becomes paid,
  // show the thank-you screen and reset the table after a short delay.
  useEffect(() => {
    if (isPaidOut) return;
    if (sessionOrderIds.length === 0 || sessionOrders.length === 0) return;

    const allPaid = sessionOrders.every((order) => order.payment_status === 'paid');

    if (allPaid) {
      setIsPaidOut(true);
      // Clear session and reload after 4 seconds so the customer can read the
      // thank-you message before the page resets.
      setTimeout(() => {
        clearCustomerSession(tableLabel);
      }, 4000);
    }
  }, [sessionOrders, sessionOrderIds, tableLabel, isPaidOut]);

  // Thank-you / paid-out screen
  if (isPaidOut) {
    return (
      <div className="min-h-screen bg-app text-app flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full bg-surface border border-app rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-app">Thank You!</h2>
            <p className="text-sm text-app-muted">
              Your bill has been settled. Hope you enjoyed your meal!
            </p>
          </div>

          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>

          <p className="text-xs text-app-muted mt-2">
            Resetting table in a few seconds…
          </p>

          {/* Manual reset button in case automatic redirect is slow */}
          <button
            onClick={() => clearCustomerSession(tableLabel)}
            className="mt-2 py-2.5 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition cursor-pointer active:scale-95"
          >
            Reset Table Now
          </button>
        </div>
      </div>
    );
  }

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesNo = item.item_no.toString() === q;
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesNo && !matchesDesc) return false;
      }

      // Diet filter
      if (dietFilter === 'veg' && !item.is_veg) return false;
      if (dietFilter === 'non_veg' && item.is_veg) return false;

      return true;
    });
  }, [items, searchQuery, dietFilter]);

  // Group items by category for browsing
  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    filteredItems.forEach((item) => {
      const existing = map.get(item.category_id) || [];
      existing.push(item);
      map.set(item.category_id, existing);
    });
    return map;
  }, [filteredItems]);

  const handlePlaceOrder = async () => {
    if (lines.length === 0 || !customerName) return;

    try {
      setIsPlacingOrder(true);
      const newOrder = await createOrder({
        table_label: tableLabel,
        customer_name: customerName,
        status: 'pending',
        payment_status: 'unpaid',
        subtotal_paise: bill.subtotal_paise,
        cgst_paise: bill.cgst_paise,
        sgst_paise: bill.sgst_paise,
        total_paise: bill.total_paise,
        note: note.trim() || undefined,
        items: lines.map((l, index) => ({
          id: `item-${Date.now()}-${index}`,
          menu_item_id: l.item_id,
          variant_id: l.variant_id,
          item_no: l.item_no,
          name_snapshot: l.name,
          variant_label_snapshot: l.variant_label,
          unit_price_paise: l.unit_price_paise,
          quantity: l.quantity,
          is_veg: l.is_veg,
        })),
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#DC2626', '#F59E0B', '#10B981'],
        });
      } catch {}

      recordNewSessionOrder(newOrder.id);
      clearCart();
      setIsCartOpen(false);
      setSelectedTrackingOrderId(newOrder.id);
      setActivePaymentOrder(newOrder);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleScrollToCategory = (catId: string) => {
    setActiveCategoryId(catId);
    const element = document.getElementById(`category-${catId}`);
    if (element) {
      const yOffset = -130;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-app text-app pb-28 transition-colors duration-200">
      <OfflineBanner />
      <DemoBanner />

      <NamePromptModal
        tableLabel={tableLabel}
        onNameConfirmed={(name) => setCustomerName(name)}
      />

      <Header
        tableLabel={tableLabel}
        customerName={customerName}
        cartItemCount={totalItemCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      <main className="max-w-4xl mx-auto">
        {/* Active Orders Live Tracker - only for orders placed in this session */}
        {sessionOrders.length > 0 && (
          <div className="px-4 pt-4">
            <OrderTracker
              orders={sessionOrders}
              activeOrderId={selectedTrackingOrderId}
              onSelectOrder={(id) => setSelectedTrackingOrderId(id)}
              onOpenReceipt={(order) => setActiveReceiptOrder(order)}
            />
          </div>
        )}

        {/* Sticky Filter & Category Header */}
        <MenuCategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleScrollToCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dietFilter={dietFilter}
          onDietFilterChange={setDietFilter}
        />

        {/* Menu Items Catalog */}
        <div className="px-4 py-4 space-y-8">
          {menuLoading ? (
            <div className="py-20 text-center text-neutral-500">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span>Loading menu items...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <p className="font-semibold text-white mb-1">No dishes found</p>
              <p className="text-xs text-neutral-500">
                Try searching for something else or clear your filters.
              </p>
            </div>
          ) : (
            categories.map((category) => {
              const categoryDishes = itemsByCategory.get(category.id);
              if (!categoryDishes || categoryDishes.length === 0) return null;

              return (
                <section
                  key={category.id}
                  id={`category-${category.id}`}
                  className="scroll-mt-36"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-red-600 rounded-full" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        {category.name}
                      </h2>
                    </div>
                    <span className="text-xs text-neutral-500 font-mono">
                      {categoryDishes.length} items
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categoryDishes.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onSelectVariantModal={(i) => setSelectedItemForVariant(i)}
                        onDirectAdd={(i, v) => addItem(i, v, 1)}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>

      {/* Persistent Bottom Bar when Cart has items */}
      {lines.length > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 z-40 max-w-lg mx-auto shadow-2xl">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white font-bold text-sm shadow-xl shadow-red-950/60 flex items-center justify-between cursor-pointer active:scale-98 min-h-[48px]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-semibold leading-tight">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in cart
                </span>
                <span className="text-[10px] text-red-200">View bill breakdown</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-base">{formatINR(bill.total_paise)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <VariantSelectorModal
        item={selectedItemForVariant}
        onClose={() => setSelectedItemForVariant(null)}
        onAddToCart={(i, v, q) => addItem(i, v, q)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        lines={lines}
        bill={bill}
        note={note}
        onNoteChange={setNote}
        onUpdateQty={updateLineQuantity}
        onRemoveLine={removeLine}
        onPlaceOrder={handlePlaceOrder}
        isSubmitting={isPlacingOrder}
      />

      <UpiPaymentModal
        order={activePaymentOrder}
        isOpen={Boolean(activePaymentOrder)}
        onClose={() => setActivePaymentOrder(null)}
        onPayAtCounterSelected={() => {
          setActivePaymentOrder(null);
        }}
      />

      {activeReceiptOrder && (
        <ReceiptView
          order={activeReceiptOrder}
          allTableOrders={sessionOrders}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}

      <AdminOrdersModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
};
