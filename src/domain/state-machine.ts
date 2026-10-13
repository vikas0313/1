import { OrderStatus } from '../types/order';

/**
 * Strict one-directional Order Status State Machine:
 * Pending -> Preparing -> Ready -> Complete
 *
 * Rules:
 * - No skipping forward (e.g., Pending cannot jump to Ready).
 * - No moving backward (e.g., Ready cannot revert to Preparing).
 * - Cancelled allowed only from Pending or Preparing.
 * - Completed orders cannot be cancelled.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['complete'],
  complete: [],
  cancelled: [],
};

export function canTransition(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next) return false;
  return ALLOWED_TRANSITIONS[current].includes(next);
}

export function getNextStep(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case 'pending':
      return 'preparing';
    case 'preparing':
      return 'ready';
    case 'ready':
      return 'complete';
    default:
      return null;
  }
}

export function canCancel(current: OrderStatus): boolean {
  return current === 'pending' || current === 'preparing';
}

export function assertValidTransition(current: OrderStatus, next: OrderStatus): void {
  if (!canTransition(current, next)) {
    throw new Error(`Illegal order status transition from "${current}" to "${next}"`);
  }
}
