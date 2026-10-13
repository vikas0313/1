import React, { useState } from 'react';
import { Order, OrderStatus, PaymentMethod } from '../../types/order';
import { formatINR } from '../../domain/pricing';
import { getNextStep, canCancel } from '../../domain/state-machine';
import {
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  Receipt,
  Banknote,
  AlertTriangle,
  CreditCard,
  MessageSquare,
} from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onAdvanceStatus: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onMarkPaid: (orderId: string, method: PaymentMethod) => void;
  onViewReceipt: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onAdvanceStatus,
  onCancelOrder,
  onMarkPaid,
  onViewReceipt,
}) => {
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [showPaidModal, setShowPaidModal] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('counter_cash');

  const nextStep = getNextStep(order.status);
  const allowCancel = canCancel(order.status);

  // Time elapsed
  const getElapsedMinutes = () => {
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000));
    if (elapsed === 0) return 'Just now';
    if (elapsed === 1) return '1 min ago';
    return `${elapsed} mins ago`;
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'preparing':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'ready':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'complete':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'cancelled':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
  };

  const getNextActionLabel = (next: OrderStatus) => {
    switch (next) {
      case 'preparing':
        return 'Start Preparing';
      case 'ready':
        return 'Mark Ready';
      case 'complete':
        return 'Mark Complete';
      default:
        return 'Advance';
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between hover:border-neutral-700 transition">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 font-black text-xs font-mono">
                Table {order.table_label}
              </span>
              <span className="font-mono text-xs text-neutral-400 font-semibold">
                #{order.id.slice(-6)}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1 leading-snug">
              {order.customer_name}
            </h3>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                order.status
              )}`}
            >
              {order.status}
            </span>
            <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3" />
              <span>{getElapsedMinutes()}</span>
            </span>
          </div>
        </div>

        {/* Special Instructions Note if present */}
        {order.note && (
          <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">Note: "{order.note}"</span>
          </div>
        )}

        {/* Items List */}
        <div className="py-3 space-y-2 border-b border-neutral-800/80 max-h-48 overflow-y-auto no-scrollbar">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between text-xs text-neutral-300 gap-2"
            >
              <div className="flex items-start gap-1.5 min-w-0">
                <span className="font-mono font-bold text-amber-400">{item.quantity}×</span>
                <div className="min-w-0">
                  <span className="font-medium text-white truncate block">
                    #{item.item_no} {item.name_snapshot}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Size: {item.variant_label_snapshot}
                  </span>
                </div>
              </div>
              <span className="font-mono text-neutral-400 flex-shrink-0">
                {formatINR(item.unit_price_paise * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Amount & Payment Status Row */}
        <div className="py-2.5 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Total Bill</span>
            <span className="text-base font-bold font-mono text-white">
              {formatINR(order.total_paise)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                order.payment_status === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              {order.payment_status}
            </span>

            <button
              onClick={() => onViewReceipt(order)}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              title="Print Receipt"
              aria-label="Print receipt"
            >
              <Receipt className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="mt-3 pt-3 border-t border-neutral-800 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {nextStep && (
            <button
              onClick={() => onAdvanceStatus(order.id)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-950 flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] active:scale-95 transition"
            >
              <span>{getNextActionLabel(nextStep)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {order.payment_status === 'unpaid' && (
            <button
              onClick={() => setShowPaidModal(true)}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-emerald-600 hover:text-white text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] transition"
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Mark Paid</span>
            </button>
          )}

          {allowCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-900/60 text-neutral-400 hover:text-rose-300 border border-neutral-700 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Cancel Order"
              aria-label="Cancel order"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base mb-1">Cancel Order #{order.id.slice(-6)}?</h4>
            <p className="text-xs text-neutral-400 mb-5">
              Are you sure? This action cannot be undone. Order status will be updated to Cancelled.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs min-h-[40px] cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelOrder(order.id);
                  setShowCancelModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs min-h-[40px] cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Confirmation Modal */}
      {showPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base mb-1 text-center">Record Payment</h4>
            <p className="text-xs text-neutral-400 mb-4 text-center">
              Confirm receiving <strong className="text-white font-mono">{formatINR(order.total_paise)}</strong> for Table {order.table_label}.
            </p>

            <div className="space-y-2 mb-5">
              <label className="block text-xs font-semibold text-neutral-300">
                Payment Method:
              </label>
              {[
                { id: 'counter_cash', label: 'Cash at Counter', icon: Banknote },
                { id: 'upi_qr', label: 'Offline UPI (QR Scanned)', icon: CreditCard },
                { id: 'offline_other', label: 'Card / Other', icon: CreditCard },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition min-h-[44px] ${
                    selectedMethod === m.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-850 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <m.icon className="w-4 h-4 text-emerald-400" />
                    <span>{m.label}</span>
                  </span>
                  {selectedMethod === m.id && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPaidModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs min-h-[40px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onMarkPaid(order.id, selectedMethod);
                  setShowPaidModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs min-h-[40px] cursor-pointer"
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
