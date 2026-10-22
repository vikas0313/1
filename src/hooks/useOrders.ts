import { useState, useEffect, useCallback, useRef } from 'react';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../types/order';
import { getOrderRepository } from '../data/repositoryFactory';
import { getNextStep } from '../domain/state-machine';

interface UseOrdersOptions {
  onNewOrder?: (order: Order) => void;
  tableLabel?: string;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialMount = useRef<boolean>(true);

  // Stabilise the repository reference – getOrderRepository() is a singleton
  // but calling it on every render can cause useEffect to see a different reference
  // depending on bundler/minifier behaviour. Pin it with useRef so the subscription
  // effect only ever fires once.
  const orderRepoRef = useRef(getOrderRepository());
  const orderRepo = orderRepoRef.current;

  // Pin the onNewOrder callback so that callers who pass an inline arrow function
  // don't cause the subscription effect to tear down and re-create on every render.
  const onNewOrderRef = useRef(options.onNewOrder);
  useEffect(() => {
    onNewOrderRef.current = options.onNewOrder;
  });

  const { tableLabel } = options;

  useEffect(() => {
    setLoading(true);
    const unsubscribe = orderRepo.subscribeToOrders((updatedOrders) => {
      // Check for incoming new orders after initial load
      if (!isInitialMount.current && onNewOrderRef.current) {
        updatedOrders.forEach((o) => {
          if (!knownOrderIdsRef.current.has(o.id)) {
            onNewOrderRef.current!(o);
          }
        });
      }

      knownOrderIdsRef.current = new Set(updatedOrders.map((o) => o.id));
      isInitialMount.current = false;
      setOrders(updatedOrders);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderRepo]); // only depend on the stable repo ref – callbacks are read via ref

  const filteredOrders = tableLabel
    ? orders.filter((o) => o.table_label.toUpperCase() === tableLabel.toUpperCase())
    : orders;

  const advanceOrderStatus = useCallback(
    async (orderId: string): Promise<Order> => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) throw new Error('Order not found');
      const next = getNextStep(order.status);
      if (!next) throw new Error(`Cannot advance order with status "${order.status}"`);
      return orderRepo.updateOrderStatus(orderId, next);
    },
    [orders, orderRepo]
  );

  const cancelOrder = useCallback(
    async (orderId: string): Promise<Order> => {
      return orderRepo.updateOrderStatus(orderId, 'cancelled');
    },
    [orderRepo]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus): Promise<Order> => {
      return orderRepo.updateOrderStatus(orderId, status);
    },
    [orderRepo]
  );

  const markPaid = useCallback(
    async (orderId: string, method: PaymentMethod = 'counter_cash'): Promise<Order> => {
      return orderRepo.updatePaymentStatus(orderId, 'paid', method);
    },
    [orderRepo]
  );

  const updatePaymentStatus = useCallback(
    async (
      orderId: string,
      paymentStatus: PaymentStatus,
      method?: PaymentMethod
    ): Promise<Order> => {
      return orderRepo.updatePaymentStatus(orderId, paymentStatus, method);
    },
    [orderRepo]
  );

  const createOrder = useCallback(
    async (orderInput: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> => {
      return orderRepo.createOrder(orderInput);
    },
    [orderRepo]
  );

  const clearAllOrders = useCallback(async (): Promise<void> => {
    return orderRepo.clearAllOrders();
  }, [orderRepo]);

  return {
    orders: filteredOrders,
    allOrders: orders,
    loading,
    advanceOrderStatus,
    cancelOrder,
    updateOrderStatus,
    markPaid,
    updatePaymentStatus,
    createOrder,
    clearAllOrders,
  };
}
