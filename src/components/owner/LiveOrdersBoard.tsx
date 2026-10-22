import React, { useState, useMemo, useCallback } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { useAudioAlert } from '../../hooks/useAudioAlert';
import { OrderCard } from './OrderCard';
import { ReceiptView } from '../customer/ReceiptView';
import { Order, OrderStatus, PaymentStatus } from '../../types/order';
import { RESTAURANT_CONFIG } from '../../config/restaurant.config';
import {
  Volume2,
  VolumeX,
  Search,
  Flame,
  Clock,
} from 'lucide-react';

export const LiveOrdersBoard: React.FC = () => {
  const { isMuted, toggleMute, playChime } = useAudioAlert();

  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Stable callback – must not change identity on every render, otherwise
  // useOrders will tear down and rebuild its realtime subscription each render,
  // which is the root cause of orders not syncing in the Owner portal.
  const handleNewOrder = useCallback(
    (newOrder: Order) => {
      playChime();
      setNewOrderIds((prev) => new Set(prev).add(newOrder.id));
      // Remove visual highlight after 8 seconds
      setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(newOrder.id);
          return next;
        });
      }, 8000);
    },
    [playChime]
  );

  const {
    allOrders,
    loading,
    advanceOrderStatus,
    cancelOrder,
    markPaid,
  } = useOrders({
    onNewOrder: handleNewOrder,
  });

  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && order.payment_status !== paymentFilter) return false;
      if (tableFilter !== 'all' && order.table_label.toUpperCase() !== tableFilter.toUpperCase())
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = order.customer_name.toLowerCase().includes(q);
        const matchesId = order.id.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }

      return true;
    });
  }, [allOrders, statusFilter, paymentFilter, tableFilter, searchQuery]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-lg">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-base font-bold text-white">Live Kitchen Orders Board</h2>
            <span className="text-xs bg-red-600/20 text-red-400 font-bold px-2 py-0.5 rounded-full font-mono">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Auto-updates live across all tables in under 2 seconds.
          </p>
        </div>

        {/* Audio Chime Mute Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition min-h-[38px] ${
              isMuted
                ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isMuted ? 'Sound Muted' : 'Chime Active'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 border-b border-neutral-800 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name / order #..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 min-h-[40px]"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
            className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-red-500 min-h-[40px]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="complete">Complete</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Payment Filter */}
        <div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as 'all' | PaymentStatus)}
            className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-red-500 min-h-[40px]"
          >
            <option value="all">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Table Filter */}
        <div>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-red-500 min-h-[40px]"
          >
            <option value="all">All Tables (T1–T8)</option>
            {RESTAURANT_CONFIG.tables.map((t) => (
              <option key={t.id} value={t.label}>
                Table {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="mt-5">
        {loading ? (
          <div className="py-20 text-center text-neutral-500">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span>Connecting to live orders stream...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-neutral-400 bg-neutral-950/60 rounded-3xl border border-neutral-800/80 p-8">
            <Clock className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white mb-1">No Orders Found</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              No orders currently match your filter criteria. Use "Generate Demo Order" below to simulate live dining activity!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const isNewlyArrived = newOrderIds.has(order.id);
              return (
                <div
                  key={order.id}
                  className={`transition-all duration-300 ${
                    isNewlyArrived ? 'ring-2 ring-red-500 scale-[1.01]' : ''
                  }`}
                >
                  <OrderCard
                    order={order}
                    onAdvanceStatus={advanceOrderStatus}
                    onCancelOrder={cancelOrder}
                    onMarkPaid={markPaid}
                    onViewReceipt={(o) => setActiveReceiptOrder(o)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {activeReceiptOrder && (
        <ReceiptView
          order={activeReceiptOrder}
          allTableOrders={allOrders.filter((o) => o.table_label === activeReceiptOrder.table_label)}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}
    </div>
  );
};
