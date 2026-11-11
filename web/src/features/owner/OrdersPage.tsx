import React, { useState, useEffect } from 'react';
import type { Order, OrderStatus } from '@ritsu/shared';
import { SummaryStrip } from './SummaryStrip.js';
import { OrderCard } from './OrderCard.js';
import { alertService } from '../../services/AlertService.js';
import { Skeleton } from '../../components/Skeleton.js';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface OrdersPageProps {
  onOrdersCountChange?: (pendingCount: number) => void;
  onSseStatusChange?: (status: 'connected' | 'reconnecting' | 'disconnected') => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onOrdersCountChange,
  onSseStatusChange,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Fetch initial orders
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/owner/orders');
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
        const pendingCount = data.filter((o) => o.status === 'pending').length;
        if (onOrdersCountChange) onOrdersCountChange(pendingCount);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // 1. Establish SSE stream with /api/owner/live
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
            setOrders((prev) => {
              // Deduplicate if already present
              const filtered = prev.filter((o) => o.id !== newOrder.id);
              const updated = [newOrder, ...filtered];
              const pendingCount = updated.filter((o) => o.status === 'pending').length;
              if (onOrdersCountChange) onOrdersCountChange(pendingCount);
              return updated;
            });

            // Trigger spoken alert system
            alertService.enqueue({
              id: newOrder.id,
              table_label: newOrder.table_label,
            });

            // Update page title badge
            document.title = `(!) New Order - Table ${newOrder.table_label}`;

            // Browser push notification if permitted
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
            setOrders((prev) => {
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
          // Retry after 4 seconds
          setTimeout(connectSSE, 4000);
        };
      } catch (err) {
        if (onSseStatusChange) onSseStatusChange('disconnected');
      }
    };

    connectSSE();

    // 2. Fallback polling every 8 seconds in case SSE drops
    pollInterval = setInterval(fetchOrders, 8000);

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const handleAdvanceStatus = async (orderId: string, nextStatus: OrderStatus) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    alertService.markOrderAdvanced(orderId);

    try {
      const res = await fetch(`/api/owner/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        // Rollback on failure
        fetchOrders();
      }
    } catch {
      fetchOrders();
    }
  };

  const handleMarkPaid = async (orderId: string, method: 'cash' | 'upi_manual') => {
    setOrders((prev) =>
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
    setOrders((prev) =>
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
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
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
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table, name, #no..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-canvas)] border border-[var(--border-default)] text-[var(--text-primary)] rounded placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-ink)]"
            />
          </div>

          {/* Table Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="text-xs bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded px-2 py-1.5 text-[var(--text-primary)]"
            >
              <option value="">All Tables</option>
              {Array.from(new Set(orders.map((o) => o.table_label))).map((tbl) => (
                <option key={tbl} value={tbl}>
                  Table {tbl}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Filter */}
          <div className="flex items-center rounded border border-[var(--border-default)] p-0.5 bg-[var(--bg-canvas)]">
            {(['all', 'unpaid', 'paid'] as const).map((pf) => (
              <button
                key={pf}
                onClick={() => setPaymentFilter(pf)}
                className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded ${
                  paymentFilter === pf
                    ? 'bg-[var(--gold-ink)] text-[var(--bg-canvas)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {pf}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchOrders}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--gold-ink)] transition-colors"
          title="Refresh orders"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 3. 4-Column Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
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
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded flex flex-col max-h-[calc(100vh-280px)]"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-[var(--border-default)] bg-[var(--bg-card)] flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        col.status === 'pending'
                          ? 'bg-amber-500 animate-ping'
                          : col.status === 'preparing'
                          ? 'bg-blue-500'
                          : col.status === 'ready'
                          ? 'bg-emerald-500'
                          : 'bg-zinc-400'
                      }`}
                    />
                    <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      {col.label}
                    </h3>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-default)] text-[var(--text-secondary)] font-semibold">
                    {col.count}
                  </span>
                </div>

                {/* Column Body / Cards List */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {colOrders.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[var(--text-muted)] italic font-serif">
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

