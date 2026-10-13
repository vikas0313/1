import React from 'react';
import { Order, OrderStatus } from '../../types/order';
import { formatINR } from '../../domain/pricing';
import { Clock, ChefHat, Bell, CheckCircle2, XCircle, Receipt } from 'lucide-react';

interface OrderTrackerProps {
  orders: Order[];
  activeOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  onOpenReceipt: (order: Order) => void;
}

const STEPPER_STAGES: Array<{
  status: OrderStatus;
  label: string;
  icon: React.ElementType;
}> = [
  { status: 'pending', label: 'Received', icon: Clock },
  { status: 'preparing', label: 'Preparing', icon: ChefHat },
  { status: 'ready', label: 'Ready', icon: Bell },
  { status: 'complete', label: 'Served', icon: CheckCircle2 },
];

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  orders,
  activeOrderId,
  onSelectOrder,
  onOpenReceipt,
}) => {
  if (orders.length === 0) return null;

  const currentOrder = orders.find((o) => o.id === activeOrderId) || orders[0];

  const getStepState = (stepStatus: OrderStatus, currentStatus: OrderStatus) => {
    if (currentStatus === 'cancelled') return 'cancelled';

    const orderHierarchy: Record<OrderStatus, number> = {
      pending: 0,
      preparing: 1,
      ready: 2,
      complete: 3,
      cancelled: -1,
    };

    const currentLevel = orderHierarchy[currentStatus];
    const stepLevel = orderHierarchy[stepStatus];

    if (currentLevel > stepLevel) return 'completed';
    if (currentLevel === stepLevel) return 'current';
    return 'upcoming';
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Live Order Status
          </span>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Order #{currentOrder.id.slice(-6)}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
              Table {currentOrder.table_label}
            </span>
          </h3>
        </div>

        <button
          onClick={() => onOpenReceipt(currentOrder)}
          className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer min-h-[36px]"
        >
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          <span>View Bill</span>
        </button>
      </div>

      {/* Cancelled Alert or Visual Stepper */}
      {currentOrder.status === 'cancelled' ? (
        <div className="my-5 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 flex items-center gap-3 text-rose-300 text-xs">
          <XCircle className="w-6 h-6 flex-shrink-0 text-rose-400" />
          <div>
            <p className="font-bold text-sm text-rose-200">Order Cancelled</p>
            <p className="text-rose-400/90 text-xs mt-0.5">
              This order was cancelled by restaurant staff. Please contact the counter for assistance.
            </p>
          </div>
        </div>
      ) : (
        <div className="py-5">
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-neutral-800 -translate-y-1/2 z-0" />

            {STEPPER_STAGES.map((step) => {
              const state = getStepState(step.status, currentOrder.status);
              const Icon = step.icon;

              let circleStyles = 'bg-neutral-800 border-neutral-700 text-neutral-500';
              let textStyles = 'text-neutral-500 font-normal';

              if (state === 'completed') {
                circleStyles = 'bg-emerald-600 border-emerald-500 text-white shadow-sm';
                textStyles = 'text-emerald-400 font-semibold';
              } else if (state === 'current') {
                circleStyles =
                  'bg-red-600 border-red-400 text-white shadow-lg shadow-red-900/50 animate-pulse';
                textStyles = 'text-red-400 font-bold';
              }

              return (
                <div key={step.status} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition ${circleStyles}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] mt-1.5 tracking-tight ${textStyles}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Items Summary */}
      <div className="bg-neutral-950/60 rounded-2xl p-3 border border-neutral-800/60 text-xs space-y-1.5">
        <div className="flex justify-between text-neutral-400 font-medium">
          <span>Items in this order:</span>
          <span className="font-mono text-white font-bold">{formatINR(currentOrder.total_paise)}</span>
        </div>
        <div className="text-neutral-300 space-y-1 max-h-24 overflow-y-auto no-scrollbar">
          {currentOrder.items.map((i) => (
            <div key={i.id} className="flex justify-between items-center text-[11px]">
              <span className="truncate max-w-[200px]">
                {i.quantity} × #{i.item_no} {i.name_snapshot} ({i.variant_label_snapshot})
              </span>
              <span className="font-mono text-neutral-400">
                {formatINR(i.unit_price_paise * i.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Order Table History */}
      {orders.length > 1 && (
        <div className="mt-4 pt-3 border-t border-neutral-800/80">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
            Earlier Orders at Table {currentOrder.table_label} ({orders.length})
          </span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() => onSelectOrder(o.id)}
                className={`py-2 px-3 rounded-xl border text-xs whitespace-nowrap transition cursor-pointer min-h-[38px] flex items-center gap-2 ${
                  o.id === currentOrder.id
                    ? 'border-red-500 bg-red-600/10 text-white font-bold'
                    : 'border-neutral-800 bg-neutral-850 text-neutral-400 hover:text-white'
                }`}
              >
                <span>#{o.id.slice(-6)}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                    o.status === 'complete'
                      ? 'bg-emerald-950 text-emerald-400'
                      : o.status === 'cancelled'
                      ? 'bg-rose-950 text-rose-400'
                      : 'bg-amber-950 text-amber-400'
                  }`}
                >
                  {o.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
