import React, { useState, useEffect } from 'react';
import type { Order, OrderStatus } from '@ritsu/shared';
import { SummaryStrip } from './SummaryStrip.js';
import { OrderCard } from './OrderCard.js';
import { alertService } from '../../services/AlertService.js';
import { Skeleton } from '../../components/Skeleton.js';
import { useOwnerOrdersSafe } from '../../context/OwnerOrdersContext.js';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface OrdersPageProps {
  onOrdersCountChange?: (pendingCount: number) => void;
  onSseStatusChange?: (status: 'connected' | 'reconnecting' | 'disconnected') => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onOrdersCountChange,
  onSseStatusChange,
}) => {
  const context = useOwnerOrdersSafe();

  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const orders = context ? context.orders : localOrders;
  const loading = context ? context.loading : localLoading;

  // Propagate counts/status from context to parent props if provided
  useEffect(() => {
    if (context) {
      if (onOrdersCountChange) onOrdersCountChange(context.pendingOrdersCount);
      if (onSseStatusChange) onSseStatusChange(context.sseStatus);
    }
  }, [context?.pendingOrdersCount, context?.sseStatus, onOrdersCountChange, onSseStatusChange]);

  // Fallback fetch if rendered without OwnerOrdersProvider
  const fetchOrders = async () => {
    if (context) {
      return context.fetchOrders();
    }
    try {
      const res = await fetch('/api/owner/orders');
      if (res.ok) {
        const data: Order[] = await res.json();
        setLocalOrders(data);
        const pendingCount = data.filter((o) => o.status === 'pending').length;
        if (onOrdersCountChange) onOrdersCountChange(pendingCount);
      }
    } catch {
      // ignore
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    if (context) return; // Managed by OwnerOrdersProvider

    fetchOrders();

    let eventSource: EventSource | null = null;
    let pollInterval: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/owner/live');

        eventSource.onopen = () => {
          if (onSseStatusChange) onSseStatusChange('connected');
        };

        eventSource.addEventListener('order.created', (event: any) => {
          try {
            const newOrder: Order = JSON.parse(event.data);
            setLocalOrders((prev) => {
              const filtered = prev.filter((o) => o.id !== newOrder.id);
              const updated = [newOrder, ...filtered];
              const pendingCount = updated.filter((o) => o.status === 'pending').length;
              if (onOrdersCountChange) onOrdersCountChange(pendingCount);
              return updated;
            });

            // Trigger spoken alert system: "New order. Table {n}."
            alertService.enqueue({
              id: newOrder.id,
              table_label: newOrder.table_label,
            });

            document.title = `(!) New Order - Table ${newOrder.table_label}`;

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('New Order Received', {
                body: `Table ${newOrder.table_label}: ${newOrder.items.length} items by ${newOrder.customer_name}`,
                icon: '/favicon.ico',
              });
            }
          } catch (e) {
            console.error('SSE order.created parse error', e);
          }
        });

        eventSource.addEventListener('order.updated', (event: any) => {
          try {
            const updatedOrder: Order = JSON.parse(event.data);
            setLocalOrders((prev) => {
              const updated = prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
              const pendingCount = updated.filter((o) => o.status === 'pending').length;
              if (onOrdersCountChange) onOrdersCountChange(pendingCount);
              return updated;
            });
            alertService.markOrderAdvanced(updatedOrder.id);
          } catch (e) {
            console.error('SSE order.updated parse error', e);
          }
        });

        eventSource.onerror = () => {
          if (onSseStatusChange) onSseStatusChange('reconnecting');
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          setTimeout(connectSSE, 4000);
        };
      } catch (err) {
        if (onSseStatusChange) onSseStatusChange('disconnected');
      }
    };

    connectSSE();
    pollInterval = setInterval(fetchOrders, 8000);

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [context]);

  const handleAdvanceStatus = async (orderId: string, nextStatus: OrderStatus) => {
    if (context) {
      return context.advanceStatus(orderId, nextStatus);
    }
    setLocalOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    alertService.markOrderAdvanced(orderId);

    try {
      const res = await fetch(`/api/owner/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) fetchOrders();
    } catch {
      fetchOrders();
    }
  };

  const handleMarkPaid = async (orderId: string, method: 'cash' | 'upi_manual') => {
    if (context) {
      return context.markPaid(orderId, method);
    }
    setLocalOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, payment_status: 'paid', payment_method: method }
          : o
      )
    );

    try {
      const res = await fetch(`/api/owner/orders/${orderId}/mark-paid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method: method }),
      });
      if (!res.ok) fetchOrders();
    } catch {
      fetchOrders();
    }
  };

  const handleMarkRefunded = async (orderId: string) => {
    if (context) {
      return context.markRefunded(orderId);
    }
    setLocalOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, payment_status: 'refunded' } : o
      )
    );

    try {
      const res = await fetch(`/api/owner/orders/${orderId}/mark-refunded`, {
        method: 'PATCH',
      });
      if (!res.ok) fetchOrders();
    } catch {
      fetchOrders();
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (context) {
      return context.cancelOrder(orderId);
    }
    setLocalOrders((prev) => prev.filter((o) => o.id !== orderId));
    alertService.markOrderAdvanced(orderId);

    try {
      const res = await fetch(`/api/owner/orders/${orderId}`, {
        method: 'DELETE',
      });
      if (!res.ok) fetchOrders();
    } catch {
      fetchOrders();
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (tableFilter && order.table_label.toLowerCase() !== tableFilter.toLowerCase()) {
      return false;
    }
    if (paymentFilter === 'paid' && order.payment_status !== 'paid') {
      return false;
    }
    if (paymentFilter === 'unpaid' && order.payment_status !== 'unpaid') {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = order.customer_name.toLowerCase().includes(q);
      const matchNo = String(order.order_no).includes(q);
      const matchTable = order.table_label.toLowerCase().includes(q);
      return matchName || matchNo || matchTable;
    }
    return true;
  });

  const columns: { status: OrderStatus; label: string; count: number }[] = [
    {
      status: 'pending',
      label: 'New Orders',
      count: filteredOrders.filter((o) => o.status === 'pending').length,
    },
    {
      status: 'preparing',
      label: 'In Kitchen',
      count: filteredOrders.filter((o) => o.status === 'preparing').length,
    },
    {
      status: 'ready',
      label: 'Ready to Serve',
      count: filteredOrders.filter((o) => o.status === 'ready').length,
    },
    {
      status: 'complete',
      label: 'Completed',
      count: filteredOrders.filter((o) => o.status === 'complete').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Summary Strip */}
      <SummaryStrip />

      {/* 2. Filter Bar */}
      <div className="warm-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table, customer, #order (/ to focus)..."
              id="owner-orders-search"
              className="touch-target w-full pl-10 pr-4 h-11 text-[13px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-full placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all"
            />
          </div>

          {/* Table Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="touch-target text-[13px] bg-[var(--surface-2)] border border-[var(--border)] rounded-full px-4 h-11 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="">All tables</option>
              {Array.from(new Set(orders.map((o) => o.table_label))).map((tbl) => (
                <option key={tbl} value={tbl}>
                  Table {tbl}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Filter */}
          <div className="flex items-center rounded-full border border-[var(--border)] p-1 bg-[var(--surface-2)]">
            {(['all', 'unpaid', 'paid'] as const).map((pf) => (
              <button
                key={pf}
                onClick={() => setPaymentFilter(pf)}
                className={`touch-target px-3.5 py-1 text-[12px] font-semibold rounded-full transition-all ${
                  paymentFilter === pf
                    ? 'bg-[var(--surface)] text-[var(--text)] font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {pf === 'all' ? 'All' : pf === 'unpaid' ? 'Unpaid' : 'Paid'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchOrders}
          className="touch-target w-11 h-11 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)]/50 transition-colors shadow-2xs"
          title="Refresh orders"
          aria-label="Refresh orders list"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 3. 4-Column Live Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-[24px]" />
              <Skeleton className="h-44 w-full rounded-[24px]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] flex flex-col max-h-[calc(100vh-290px)] shadow-xs overflow-hidden"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-[var(--border)] bg-[var(--surface-2)]/60 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        col.status === 'pending'
                          ? 'bg-[var(--warning)] animate-ping'
                          : col.status === 'preparing'
                          ? 'bg-[var(--accent)]'
                          : col.status === 'ready'
                          ? 'bg-[var(--success)]'
                          : 'bg-zinc-400'
                      }`}
                    />
                    <h3 className="text-[14px] font-bold text-[var(--text)]">
                      {col.label}
                    </h3>
                  </div>
                  <span className="text-[12px] tabular-nums font-bold px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]">
                    {col.count}
                  </span>
                </div>

                {/* Column Body / Cards List */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {colOrders.length === 0 ? (
                    <div className="text-center py-12 text-[13px] text-[var(--text-muted)] italic">
                      No orders in this column
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAdvanceStatus={handleAdvanceStatus}
                        onMarkPaid={handleMarkPaid}
                        onMarkRefunded={handleMarkRefunded}
                        onCancelOrder={handleCancelOrder}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

