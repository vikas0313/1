import React, { useState, useMemo } from 'react';
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
import { useMenu } from '../hooks/useMenu';
import { useCart } from '../hooks/useCart';
import { useOrders } from '../hooks/useOrders';
import { MenuItem } from '../types/menu';
import { Order } from '../types/order';
import { formatINR } from '../domain/pricing';
import { ShoppingBag, ArrowRight } from 'lucide-react';

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
      />

      <main className="max-w-4xl mx-auto">
        {/* Active Orders Live Tracker */}
        {tableOrders.length > 0 && (
          <div className="px-4 pt-4">
            <OrderTracker
              orders={tableOrders}
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
          allTableOrders={tableOrders}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}
    </div>
  );
};
