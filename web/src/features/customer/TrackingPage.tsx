import React, { useEffect, useState } from 'react';
import type { Order, OrderStatus } from '@ritsu/shared';
import { apiAdapter } from '../../data/ApiAdapter.js';
import { Button } from '../../components/Button.js';
import { Badge } from '../../components/Badge.js';
import { ThemeToggle } from '../../components/ThemeToggle.js';

export interface TrackingPageProps {
  order: Order;
  onAddMoreItems: () => void;
  onViewBill: () => void;
}

const STEPS: Array<{ key: OrderStatus; label: string; description: string }> = [
  { key: 'pending', label: 'Pending', description: 'Order received by the kitchen' },
  { key: 'preparing', label: 'Preparing', description: 'Chef is cooking your delicious food' },
  { key: 'ready', label: 'Ready', description: 'Your order is hot and ready to serve' },
  { key: 'complete', label: 'Served', description: 'Enjoy your meal! Indo-Chinese ka asli maza!' },
];

export const TrackingPage: React.FC<TrackingPageProps> = ({
  order: initialOrder,
  onAddMoreItems,
  onViewBill,
}) => {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'polling'>('connected');

  useEffect(() => {
    // Subscribe to SSE updates for this specific order
    const unsubscribe = apiAdapter.subscribeToOrder(
      order.public_token,
      (updatedOrder) => {
        setOrder(updatedOrder);
      },
      (status) => {
        setConnectionStatus(status);
      }
    );

    return () => unsubscribe();
  }, [order.public_token]);

  const currentStepIndex = STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] p-4 sm:p-6 max-w-xl mx-auto flex flex-col justify-between">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
        <div>
          <span className="text-[12px] uppercase tracking-wider font-semibold text-[var(--gold-ink)]">
            Live Tracking · Table {order.table_label}
          </span>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
            Order {order.order_no}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' && (
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Status Tracker */}
      <main className="my-auto py-8 space-y-8 text-center">
        {isCancelled ? (
          <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-[2px]">
            <h2 className="font-serif text-2xl font-bold text-red-600 mb-1">Order Cancelled</h2>
            <p className="text-[14px] text-[var(--text-secondary)]">
              This order was cancelled by the kitchen. Please talk to the restaurant staff.
            </p>
          </div>
        ) : (
          <div>
            {/* Current Status Headline */}
            <div className="mb-6">
              <Badge variant="status" status={order.status} className="mb-2 text-[12px] px-3 py-1">
                Status: {order.status}
              </Badge>
              <h2 className="font-serif text-3xl font-bold text-[var(--text-primary)]">
                {STEPS[currentStepIndex]?.label || order.status}
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] mt-1">
                {STEPS[currentStepIndex]?.description}
              </p>
            </div>

            {/* 4-Step Horizontal Stepper */}
            <div className="flex items-center justify-between relative max-w-md mx-auto my-6 px-2 select-none">
              {/* Background Connecting Line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-[var(--border-hairline)] -z-0" />
              {/* Progress Line */}
              <div
                className="absolute top-4 left-6 h-0.5 bg-[var(--border-gold)] -z-0 transition-all duration-500"
                style={{
                  width: `${(Math.max(0, currentStepIndex) / (STEPS.length - 1)) * 88}%`,
                }}
              />

              {STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all ${
                        isCurrent
                          ? 'bg-[var(--gold-ink)] text-[var(--gold-ink-contrast)] border-[var(--gold-ink)] scale-110 shadow-md ring-4 ring-[var(--gold-ink)]/20'
                          : isPassed
                          ? 'bg-[var(--bg-surface)] text-[var(--gold-ink)] border-[var(--border-gold)]'
                          : 'bg-[var(--bg-canvas)] text-[var(--text-tertiary)] border-[var(--border-hairline)]'
                      }`}
                    >
                      {isPassed && !isCurrent ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] uppercase tracking-wider mt-2 font-medium ${
                        isPassed ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Details Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-4 rounded-[2px] text-left">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--border-hairline)]">
            <span className="text-[12px] uppercase font-semibold text-[var(--text-secondary)]">
              Items Ordered ({order.items.length})
            </span>
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">
              Payment:{' '}
              <span
                className={
                  order.payment_status === 'paid'
                    ? 'text-emerald-600 font-bold'
                    : 'text-amber-600 font-bold'
                }
              >
                {order.payment_status.toUpperCase()}
              </span>
            </span>
          </div>

          <div className="space-y-2 text-[14px]">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <span>
                  {item.quantity} × {item.name_snapshot}{' '}
                  <span className="text-[12px] text-[var(--text-secondary)]">
                    ({item.variant_label_snapshot})
                  </span>
                </span>
                <span className="font-serif tabular-nums font-semibold">
                  ₹{(item.unit_price_paise * item.quantity) / 100}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-[var(--border-hairline)] flex justify-between font-serif text-[18px] font-bold">
            <span>Total Bill:</span>
            <span className="text-[var(--gold-ink)]">₹{(order.total_paise / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Action Links */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" className="flex-1" onClick={onAddMoreItems}>
            + Add More Items
          </Button>
          <Button variant="primary" className="flex-1" onClick={onViewBill}>
            View / Print Bill
          </Button>
        </div>
      </main>

      <footer className="text-center pt-4 border-t border-[var(--border-hairline)] text-[12px] text-[var(--text-secondary)]">
        Questions about your order? Wave or speak to any staff member.
      </footer>
    </div>
  );
};

