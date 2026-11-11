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
      className={`warm-card p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
        isFresh
          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 shadow-md animate-pulse'
          : ''
      }`}
    >
      <div>
        {/* Top Header with Round Table Tile */}
        <div className="flex items-start justify-between gap-3 pb-3 mb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            {/* Round tile showing the table number */}
            <div className="w-13 h-13 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent-ink)] flex flex-col items-center justify-center shrink-0 shadow-2xs">
              <span className="text-[10px] font-bold uppercase leading-none text-[var(--text-muted)]">
                Table
              </span>
              <span className="text-[20px] font-bold leading-tight tabular-nums">
                {order.table_label.replace(/^T/i, '')}
              </span>
            </div>

            <div>
              <div className="text-[15px] font-bold text-[var(--text)] leading-snug">
                {order.customer_name}
              </div>
              <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Order #{order.order_no}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div
              className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${
                isOverdue
                  ? 'bg-red-50 text-[var(--danger)] border border-red-200 dark:bg-red-950/40'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{elapsedMinutes}m</span>
            </div>
          </div>
        </div>

        {/* Status and Payment Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge status={order.status}>
            {order.status}
          </Badge>

          <span
            className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
              order.payment_status === 'paid'
                ? 'bg-emerald-50 text-[var(--success)] border-emerald-200 dark:bg-emerald-950/40'
                : order.payment_status === 'refunded'
                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40'
                : 'bg-amber-50 text-[var(--warning)] border-amber-200 dark:bg-amber-950/40'
            }`}
          >
            {order.payment_status === 'paid' ? 'Paid' : order.payment_status === 'refunded' ? 'Refunded' : 'Unpaid'}
          </span>

          {order.payment_method && (
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              ({order.payment_method})
            </span>
          )}
        </div>

        {/* Itemised Lines */}
        <div className="space-y-1.5 border-t border-b border-[var(--border)] py-2.5 my-2 text-[13px]">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between items-baseline gap-2">
              <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
                <span className="font-bold text-[var(--text)] tabular-nums">{it.quantity}×</span>
                <span className="truncate text-[var(--text)]">{it.item_name}</span>
                {it.size_label && (
                  <span className="text-[11px] px-2 py-0.2 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] rounded-full">
                    {it.size_label}
                  </span>
                )}
              </div>
              <span className="tabular-nums font-medium text-[var(--text-muted)]">
                {formatPaise(it.unit_price_paise * it.quantity, false)}
              </span>
            </div>
          ))}

          {order.special_instructions && (
            <div className="p-2 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-[12px] rounded-xl mt-1.5">
              <span className="font-semibold text-[var(--accent-ink)]">Note:</span> "{order.special_instructions}"
            </div>
          )}
        </div>

        {/* Bill Total - Large Bold Figure */}
        <div className="flex justify-between items-baseline pt-1 pb-3">
          <span className="text-[12px] font-medium text-[var(--text-muted)]">
            Total bill
          </span>
          <span className="text-[20px] font-bold tabular-nums text-[var(--text)]">
            {formatPaise(order.total_paise, false)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-[var(--border)] space-y-2">
        {nextStep && (
          <Button
            variant="primary"
            size="md"
            onClick={handleNextStep}
            isLoading={actionLoading}
            className="w-full font-bold"
          >
            {nextButtonLabel[order.status]}
          </Button>
        )}

        <div className="flex items-center gap-2">
          {order.payment_status === 'unpaid' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPaidDialog(true)}
              className="flex-1 text-[12px] font-semibold"
            >
              <DollarSign className="w-3.5 h-3.5 inline mr-1 text-[var(--accent-ink)]" />
              Mark paid
            </Button>
          )}

          {order.payment_status === 'paid' && (
            <button
              onClick={() => setShowRefundDialog(true)}
              className="touch-target flex-1 py-1 text-[12px] text-[var(--text-muted)] hover:text-purple-600 transition-colors"
            >
              Refund
            </button>
          )}

          {(order.status === 'pending' || order.status === 'preparing') && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="touch-target px-3 py-1.5 text-[12px] text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-colors font-medium"
              title="Cancel order"
            >
              <XCircle className="w-3.5 h-3.5 inline mr-1" />
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

