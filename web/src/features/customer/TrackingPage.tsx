import React, { useEffect, useState } from 'react';
import type { Order, OrderStatus } from '@ritsu/shared';
import { apiAdapter } from '../../data/ApiAdapter.js';
import { Button } from '../../components/Button.js';
import { Badge } from '../../components/Badge.js';
import { TopBar } from '../../components/TopBar.js';
import { StepProgress } from '../../components/StepProgress.js';
import { Clock, Plus, Receipt } from 'lucide-react';

export interface TrackingPageProps {
  order: Order;
  onAddMoreItems: () => void;
  onViewBill: () => void;
}

const STEPS: Array<{ key: OrderStatus; label: string; description: string; stepNumber: number }> = [
  { key: 'pending', label: 'Order placed', description: 'Order received by the kitchen. Preparing starts shortly.', stepNumber: 1 },
  { key: 'preparing', label: 'Preparing your food', description: 'Freshly tossed and cooked hot in the wok.', stepNumber: 2 },
  { key: 'ready', label: 'Ready to serve', description: 'Your dishes are plated and coming to your table.', stepNumber: 3 },
  { key: 'complete', label: 'Order completed', description: 'Enjoy your meal! Indo-Chinese ka asli maza.', stepNumber: 4 },
];

export const TrackingPage: React.FC<TrackingPageProps> = ({
  order: initialOrder,
  onAddMoreItems,
  onViewBill,
}) => {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'polling'>('connected');

  useEffect(() => {
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

  const activeStepConfig = STEPS.find((s) => s.key === order.status) || STEPS[0];
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-between">
      <TopBar
        title={`Order #${order.order_no}`}
        subtitle={`Live tracking · Table ${order.table_label}`}
        tableLabel={order.table_label}
      />

      <main className="max-w-md w-full mx-auto px-4 py-6 flex-1 flex flex-col justify-center space-y-6">
        {isCancelled ? (
          <div className="warm-card p-6 border-red-200 dark:border-red-900 text-center">
            <Badge variant="status" status="cancelled" className="mb-3">
              Cancelled
            </Badge>
            <h2 className="text-[20px] font-bold text-[var(--danger)] mb-2">Order cancelled</h2>
            <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">
              This order was cancelled by the kitchen. Please speak with our restaurant team.
            </p>
          </div>
        ) : (
          /* Live Progress Warm Card */
          <div className="warm-card p-6 text-center space-y-5">
            <div className="flex items-center justify-between">
              <Badge variant="status" status={order.status}>
                {order.status}
              </Badge>
              {connectionStatus === 'connected' && (
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--success)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                  Live sync
                </span>
              )}
            </div>

            <div>
              <h2 className="text-[24px] sm:text-[28px] font-bold text-[var(--text)] tracking-tight leading-snug">
                {activeStepConfig.label}
              </h2>
              <p className="text-[14px] text-[var(--text-muted)] mt-1 leading-relaxed">
                {activeStepConfig.description}
              </p>
            </div>

            {/* 4 Chunky Rounded Blocks Progress Indicator */}
            <div className="pt-2 pb-1">
              <StepProgress currentStep={activeStepConfig.stepNumber} totalSteps={4} />
            </div>
          </div>
        )}

        {/* Order Details Warm Card */}
        <div className="warm-card p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
            <span className="text-[13px] font-semibold text-[var(--text)]">
              Items ordered ({order.items.length})
            </span>
            <span className="text-[12px] font-medium text-[var(--text-muted)]">
              Payment:{' '}
              <span
                className={`font-semibold ml-1 ${
                  order.payment_status === 'paid'
                    ? 'text-[var(--success)]'
                    : 'text-[var(--warning)]'
                }`}
              >
                {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
              </span>
            </span>
          </div>

          <div className="space-y-2.5 text-[14px]">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <span className="text-[var(--text)]">
                  {item.quantity} × {item.name_snapshot}{' '}
                  <span className="text-[12px] text-[var(--text-muted)]">
                    ({item.variant_label_snapshot})
                  </span>
                </span>
                <span className="tabular-nums font-semibold text-[var(--text)]">
                  ₹{(item.unit_price_paise * item.quantity) / 100}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex justify-between items-center text-[18px] font-bold">
            <span className="text-[var(--text)]">Total amount</span>
            <span className="text-[var(--accent-ink)] tabular-nums">
              ₹{(order.total_paise / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={onAddMoreItems}
          >
            <Plus className="w-4 h-4 mr-1.5 text-[var(--accent-ink)]" />
            <span>Add more items</span>
          </Button>

          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={onViewBill}
          >
            <Receipt className="w-4 h-4 mr-1.5" />
            <span>View receipt</span>
          </Button>
        </div>
      </main>

      <footer className="text-center p-4 border-t border-[var(--border)] text-[12px] text-[var(--text-muted)] max-w-md w-full mx-auto">
        Have questions or need assistance? Please speak with our friendly team.
      </footer>
    </div>
  );
};


