import React, { useState, useEffect } from 'react';
import type { Order, OrderStatus } from '@ritsu/shared';
import { formatPaise, getNextStep } from '@ritsu/shared';
import { Button } from '../../components/Button.js';
import { Badge } from '../../components/Badge.js';
import { Clock, CheckCircle2, DollarSign, XCircle, RotateCcw } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onAdvanceStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  onMarkPaid: (orderId: string, method: 'cash' | 'upi_manual') => Promise<void>;
  onMarkRefunded: (orderId: string) => Promise<void>;
  onCancelOrder: (orderId: string) => Promise<void>;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onAdvanceStatus,
  onMarkPaid,
  onMarkRefunded,
  onCancelOrder,
}) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [showPaidDialog, setShowPaidDialog] = useState(false);
  const [paidMethod, setPaidMethod] = useState<'cash' | 'upi_manual'>('cash');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const calculateElapsed = () => {
      const created = new Date(order.created_at).getTime();
      const diffMs = Date.now() - created;
      setElapsedMinutes(Math.max(0, Math.floor(diffMs / 60000)));
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 15000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const nextStep = getNextStep(order.status);
  const isOverdue = elapsedMinutes >= 15 && order.status !== 'complete' && order.status !== 'cancelled';
  const isFresh = elapsedMinutes < 2 && order.status === 'pending';

  const nextButtonLabel: Record<OrderStatus, string> = {
    pending: 'Start Cooking',
    preparing: 'Mark Ready',
    ready: 'Complete Order',
    complete: '',
    cancelled: '',
  };

  const handleNextStep = async () => {
    if (!nextStep) return;
    setActionLoading(true);
    try {
      await onAdvanceStatus(order.id, nextStep);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPaid = async () => {
    setActionLoading(true);
    try {
      await onMarkPaid(order.id, paidMethod);
      setShowPaidDialog(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRefund = async () => {
    setActionLoading(true);
    try {
      await onMarkRefunded(order.id);
      setShowRefundDialog(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    setActionLoading(true);
    try {
      await onCancelOrder(order.id);
      setShowCancelDialog(false);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className={`bg-[var(--bg-card)] border ${
        isFresh
          ? 'border-[var(--gold-ink)] ring-2 ring-[var(--gold-ink)]/30 animate-pulse'
          : 'border-[var(--border-default)]'
      } p-4 flex flex-col justify-between shadow-sm transition-all duration-200`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 border-b border-[var(--border-subtle)] pb-2 mb-3">
          <div>
            <div className="font-serif text-xl font-bold text-[var(--gold-ink)] tracking-tight">
              Table {order.table_label.replace(/^T/i, '')}
            </div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              {order.customer_name}
            </div>
          </div>

          <div className="text-right">
            <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
              #{order.order_no}
            </span>
            <div
              className={`flex items-center justify-end gap-1 text-[11px] font-mono mt-0.5 ${
                isOverdue ? 'text-red-600 dark:text-red-400 font-bold' : 'text-[var(--text-muted)]'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{elapsedMinutes}m ago</span>
            </div>
          </div>
        </div>

        {/* Status and Payment Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge
            status={
              order.status === 'pending'
                ? 'pending'
                : order.status === 'preparing'
                ? 'preparing'
                : order.status === 'ready'
                ? 'ready'
                : order.status === 'complete'
                ? 'complete'
                : 'cancelled'
            }
          >
            {order.status.toUpperCase()}
          </Badge>

          <span
            className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${
              order.payment_status === 'paid'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : order.payment_status === 'refunded'
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            {order.payment_status.toUpperCase()}
          </span>

          {order.payment_method && (
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              ({order.payment_method})
            </span>
          )}
        </div>

        {/* Itemised Lines */}
        <div className="space-y-1.5 border-t border-b border-[var(--border-subtle)] py-2 my-2 text-xs">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between items-baseline gap-2">
              <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
                <span className="font-bold text-[var(--text-primary)]">{it.quantity}×</span>
                <span className="truncate text-[var(--text-primary)]">{it.item_name}</span>
                {it.size_label && (
                  <span className="text-[10px] px-1 bg-[var(--bg-canvas)] border border-[var(--border-default)] text-[var(--text-secondary)] rounded">
                    {it.size_label}
                  </span>
                )}
              </div>
              <span className="font-mono text-[var(--text-secondary)]">
                {formatPaise(it.unit_price_paise * it.quantity)}
              </span>
            </div>
          ))}

          {order.special_instructions && (
            <div className="p-1.5 bg-[var(--bg-canvas)] border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] rounded mt-1 italic">
              Note: "{order.special_instructions}"
            </div>
          )}
        </div>

        {/* Bill Total */}
        <div className="flex justify-between items-baseline pt-1 pb-3 text-xs">
          <span className="text-[var(--text-secondary)] uppercase tracking-wider font-medium text-[11px]">
            Total Bill
          </span>
          <span className="font-serif font-bold text-base text-[var(--text-primary)]">
            {formatPaise(order.total_paise)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
        {nextStep && (
          <Button
            variant="primary"
            onClick={handleNextStep}
            loading={actionLoading}
            className="w-full py-2 text-xs uppercase font-bold tracking-wider"
          >
            {nextButtonLabel[order.status]}
          </Button>
        )}

        <div className="flex items-center gap-1.5">
          {order.payment_status === 'unpaid' && (
            <Button
              variant="secondary"
              onClick={() => setShowPaidDialog(true)}
              className="flex-1 py-1.5 text-[11px] uppercase tracking-wider font-semibold"
            >
              <DollarSign className="w-3.5 h-3.5 inline mr-1" />
              Mark Paid
            </Button>
          )}

          {order.payment_status === 'paid' && (
            <button
              onClick={() => setShowRefundDialog(true)}
              className="flex-1 py-1 text-[11px] text-[var(--text-muted)] hover:text-purple-600 transition-colors"
            >
              Refund
            </button>
          )}

          {(order.status === 'pending' || order.status === 'preparing') && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="px-2.5 py-1 text-[11px] text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Cancel Order"
            >
              <XCircle className="w-3.5 h-3.5 inline mr-0.5" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Dialog 1: Mark Paid */}
      {showPaidDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 max-w-xs w-full shadow-2xl">
            <h3 className="font-serif text-base font-bold text-[var(--text-primary)] mb-1">
              Confirm Payment
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Total amount: <strong className="text-[var(--text-primary)]">{formatPaise(order.total_paise)}</strong>
            </p>

            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaidMethod('cash')}
                  className={`py-2 text-xs font-bold uppercase rounded border transition-colors ${
                    paidMethod === 'cash'
                      ? 'border-[var(--gold-ink)] bg-[var(--gold-ink)]/15 text-[var(--gold-ink)]'
                      : 'border-[var(--border-default)] text-[var(--text-secondary)]'
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaidMethod('upi_manual')}
                  className={`py-2 text-xs font-bold uppercase rounded border transition-colors ${
                    paidMethod === 'upi_manual'
                      ? 'border-[var(--gold-ink)] bg-[var(--gold-ink)]/15 text-[var(--gold-ink)]'
                      : 'border-[var(--border-default)] text-[var(--text-secondary)]'
                  }`}
                >
                  UPI Verified
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleConfirmPaid}
                loading={actionLoading}
                className="flex-1 py-2 text-xs"
              >
                Confirm Paid
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowPaidDialog(false)}
                className="py-2 text-xs"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog 2: Cancel Order */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-red-500/30 p-5 max-w-xs w-full shadow-2xl">
            <h3 className="font-serif text-base font-bold text-red-600 dark:text-red-400 mb-1">
              Cancel Order #{order.order_no}?
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              This action cannot be undone. The kitchen and customer will be notified immediately.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmCancel}
                disabled={actionLoading}
                className="flex-1 py-2 bg-red-600 text-white font-bold text-xs uppercase rounded hover:bg-red-700 transition-colors"
              >
                {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <Button
                variant="ghost"
                onClick={() => setShowCancelDialog(false)}
                className="py-2 text-xs"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog 3: Mark Refunded */}
      {showRefundDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-purple-500/30 p-5 max-w-xs w-full shadow-2xl">
            <h3 className="font-serif text-base font-bold text-purple-600 dark:text-purple-400 mb-1">
              Mark Order Refunded?
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Mark {formatPaise(order.total_paise)} as refunded to the customer?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmRefund}
                disabled={actionLoading}
                className="flex-1 py-2 bg-purple-600 text-white font-bold text-xs uppercase rounded hover:bg-purple-700 transition-colors"
              >
                {actionLoading ? 'Updating...' : 'Yes, Refund'}
              </button>
              <Button
                variant="ghost"
                onClick={() => setShowRefundDialog(false)}
                className="py-2 text-xs"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

