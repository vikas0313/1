import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { Order, OrderStatus } from '@ritsu/shared';
import { alertService } from '../services/AlertService.js';

interface OwnerOrdersContextType {
  orders: Order[];
  loading: boolean;
  sseStatus: 'connected' | 'reconnecting' | 'disconnected';
  pendingOrdersCount: number;
  fetchOrders: () => Promise<void>;
  advanceStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  markPaid: (orderId: string, method: 'cash' | 'upi_manual') => Promise<void>;
  markRefunded: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
}

const OwnerOrdersContext = createContext<OwnerOrdersContextType | null>(null);

export const OwnerOrdersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sseStatus, setSseStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/orders');
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);

        // On polling fallback, alert for any unseen pending orders
        if (!isInitialLoadRef.current) {
          for (const order of data) {
            if (order.status === 'pending' && !knownOrderIdsRef.current.has(order.id)) {
              alertService.enqueue({
                id: order.id,
                table_label: order.table_label,
              });
              document.title = `(!) New Order - Table ${order.table_label}`;
            }
          }
        }

        data.forEach((o) => knownOrderIdsRef.current.add(o.id));
        isInitialLoadRef.current = false;
        return;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    // Fallback: load local orders when backend is unreachable or on static hosting
    try {
      const localOrders: Order[] = JSON.parse(localStorage.getItem('ritsu_local_orders') || '[]');
      setOrders(localOrders);
      if (!isInitialLoadRef.current) {
        for (const order of localOrders) {
          if (order.status === 'pending' && !knownOrderIdsRef.current.has(order.id)) {
            alertService.enqueue({
              id: order.id,
              table_label: order.table_label,
            });
          }
        }
      }
      localOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
      isInitialLoadRef.current = false;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    let eventSource: EventSource | null = null;
    let pollInterval: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/owner/live');

        eventSource.onopen = () => {
          setSseStatus('connected');
        };

        eventSource.addEventListener('order.created', (event: any) => {
          try {
            const newOrder: Order = JSON.parse(event.data);
            knownOrderIdsRef.current.add(newOrder.id);

            setOrders((prev) => {
              const filtered = prev.filter((o) => o.id !== newOrder.id);
              return [newOrder, ...filtered];
            });

            // Trigger spoken alert system: attention chime + "New order. Table {n}."
            alertService.enqueue({
              id: newOrder.id,
              table_label: newOrder.table_label,
            });

            // Update title
            document.title = `(!) New Order - Table ${newOrder.table_label}`;

            // Push notification if permitted
            if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
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
            knownOrderIdsRef.current.add(updatedOrder.id);

            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );

            if (updatedOrder.status !== 'pending') {
              alertService.markOrderAdvanced(updatedOrder.id);
            }
          } catch (e) {
            console.error('SSE order.updated parse error', e);
          }
        });

        eventSource.onerror = () => {
          setSseStatus('reconnecting');
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          setTimeout(connectSSE, 4000);
        };
      } catch {
        setSseStatus('disconnected');
      }
    };

    connectSSE();

    // Polling fallback every 8 seconds
    pollInterval = setInterval(fetchOrders, 8000);

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [fetchOrders]);

  const advanceStatus = async (orderId: string, nextStatus: OrderStatus) => {
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
      if (!res.ok) fetchOrders();
    } catch {
      fetchOrders();
    }
  };

  const markPaid = async (orderId: string, method: 'cash' | 'upi_manual') => {
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

  const markRefunded = async (orderId: string) => {
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

  const cancelOrder = async (orderId: string) => {
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

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <OwnerOrdersContext.Provider
      value={{
        orders,
        loading,
        sseStatus,
        pendingOrdersCount,
        fetchOrders,
        advanceStatus,
        markPaid,
        markRefunded,
        cancelOrder,
      }}
    >
      {children}
    </OwnerOrdersContext.Provider>
  );
};

export const useOwnerOrdersSafe = () => useContext(OwnerOrdersContext);

export const useOwnerOrders = () => {
  const context = useContext(OwnerOrdersContext);
  if (!context) {
    throw new Error('useOwnerOrders must be used within an OwnerOrdersProvider');
  }
  return context;
};

