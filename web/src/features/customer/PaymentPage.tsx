import React from 'react';
import type { Order } from '@ritsu/shared';
import { Button } from '../../components/Button.js';
import { TopBar } from '../../components/TopBar.js';
import { Banknote, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';

export interface PaymentPageProps {
  order: Order;
  onContinueToTracking: () => void;
  onViewBill: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  order,
  onContinueToTracking,
  onViewBill,
}) => {
  const amountRupees = (order.total_paise / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-between">
      <TopBar
        title="Pay at counter"
        subtitle={`Order #${order.order_no} · Table ${order.table_label}`}
        tableLabel={order.table_label}
      />

      <main className="max-w-md w-full mx-auto px-4 py-6 flex-1 flex flex-col justify-center space-y-6">
        {/* Total Amount Warm Card */}
        <div className="warm-card p-6 text-center">
          <span className="text-[13px] font-medium text-[var(--text-muted)]">
            Total payable (includes 5% GST)
          </span>
          <div className="text-[38px] sm:text-[44px] font-bold tabular-nums text-[var(--text)] tracking-tight leading-tight mt-1 mb-1">
            ₹{amountRupees}
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent-ink)] border border-[var(--accent)]/30 text-[12px] font-semibold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Order confirmed · Pay cash at counter</span>
          </div>
        </div>

        {/* Counter Cash Instructions Card */}
        <div className="warm-card p-6 space-y-4">
          <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border)]">
            <div className="w-12 h-12 rounded-[16px] bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent-ink)] flex items-center justify-center shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[var(--text)] leading-tight">
                Cash payment at counter
              </h2>
              <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
                Please settle bill at the cash desk
              </p>
            </div>
          </div>

          <div className="space-y-3 text-[13px] text-[var(--text-muted)]">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--surface-2)] text-[var(--text)] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <span>
                Your order is already sent to the kitchen and being prepared.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--surface-2)] text-[var(--text)] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <span>
                Please visit the counter with <strong className="text-[var(--text)]">Order #{order.order_no}</strong> and pay <strong className="text-[var(--text)]">₹{amountRupees}</strong> in cash.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--surface-2)] text-[var(--text)] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <span>
                Your server will bring your food directly to <strong className="text-[var(--text)]">Table {order.table_label}</strong>.
              </span>
            </div>
          </div>

          {/* Quick Order Info Pill Box */}
          <div className="p-3 bg-[var(--surface-2)]/60 rounded-2xl border border-[var(--border)]/70 text-[12px] flex items-center justify-between text-[var(--text-muted)]">
            <span>Table {order.table_label} · {order.customer_name}</span>
            <span className="font-semibold text-[var(--text)]">{order.items.length} items</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onContinueToTracking}
          >
            <span>Track order status</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={onViewBill}
          >
            <FileText className="w-4 h-4 mr-1.5" />
            <span>View / Print receipt</span>
          </Button>
        </div>

        <p className="text-[12px] text-[var(--text-muted)] text-center leading-relaxed">
          Staff will mark your payment verified upon receiving cash at the counter.
        </p>
      </main>

      <footer className="text-center p-4 border-t border-[var(--border)] max-w-md w-full mx-auto">
        <span className="text-[12px] text-[var(--text-muted)]">
          Ritsu Food Corner · Dine-in Service
        </span>
      </footer>
    </div>
  );
};
