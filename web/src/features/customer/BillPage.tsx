import React, { useEffect, useState } from 'react';
import type { Order, RestaurantSettings } from '@ritsu/shared';
import { apiAdapter } from '../../data/ApiAdapter.js';
import { Button } from '../../components/Button.js';
import { Badge } from '../../components/Badge.js';
import { TopBar } from '../../components/TopBar.js';
import { Printer, Share2, ArrowLeft, UtensilsCrossed, Check } from 'lucide-react';

export interface BillPageProps {
  order: Order;
  onBackToMenu: () => void;
  onBackToTracking: () => void;
}

export const BillPage: React.FC<BillPageProps> = ({
  order,
  onBackToMenu,
  onBackToTracking,
}) => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    apiAdapter
      .getRestaurantSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Bill ${order.order_no} - Ritsu Food Corner`,
        text: `View receipt for Order ${order.order_no} at Ritsu Food Corner`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const orderDate = new Date(order.created_at).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-12">
      <TopBar
        title="Tax receipt"
        subtitle={`Order #${order.order_no} · Table ${order.table_label}`}
        tableLabel={order.table_label}
        showBack
        onBack={onBackToTracking}
      />

      <div className="max-w-lg mx-auto p-4 sm:p-6">
        {/* Bill Receipt Warm Card (Pure black on white when printed) */}
        <div className="warm-card p-6 sm:p-8 bg-[var(--surface)] text-[var(--text)] print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
          {/* Restaurant Header */}
          <div className="text-center pb-5 border-b border-dashed border-[var(--border)]">
            <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[var(--text)] print:text-black">
              {settings?.name || 'Ritsu Food Corner'}
            </h1>
            <p className="text-[13px] text-[var(--accent-ink)] font-medium mt-0.5 print:text-gray-700">
              {settings?.tagline || 'Indo-Chinese street kitchen'}
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1.5 print:text-gray-600">
              {settings?.address || 'Main Road, Food Street, India'}
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5 print:text-gray-600">
              GSTIN: <span className="font-mono">{settings?.gstin || '36ABCDE1234F1Z5'}</span>
            </p>
          </div>

          {/* Order Metadata */}
          <div className="py-4 border-b border-dashed border-[var(--border)] text-[13px] flex justify-between gap-4">
            <div>
              <div>
                <span className="text-[var(--text-muted)] print:text-gray-600">Order: </span>
                <strong className="text-[var(--text)] font-bold print:text-black">#{order.order_no}</strong>
              </div>
              <div className="mt-0.5">
                <span className="text-[var(--text-muted)] print:text-gray-600">Customer: </span>
                <span className="text-[var(--text)] font-semibold print:text-black">{order.customer_name}</span>
              </div>
            </div>
            <div className="text-right">
              <div>
                <span className="text-[var(--text-muted)] print:text-gray-600">Table: </span>
                <strong className="text-[var(--accent-ink)] font-bold print:text-black">{order.table_label}</strong>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5 print:text-gray-600">{orderDate}</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4 border-b border-dashed border-[var(--border)]">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[12px] font-semibold text-[var(--text-muted)] border-b border-[var(--border)] print:text-gray-700">
                  <th className="pb-2">Item</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/50">
                {order.items.map((line) => (
                  <tr key={line.id}>
                    <td className="py-2.5 pr-2">
                      <div className="font-semibold text-[var(--text)] print:text-black">
                        {line.name_snapshot}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] print:text-gray-600">
                        {line.variant_label_snapshot}
                      </div>
                    </td>
                    <td className="py-2.5 text-center tabular-nums font-medium">{line.quantity}</td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--text-muted)] print:text-gray-600">
                      ₹{line.unit_price_paise / 100}
                    </td>
                    <td className="py-2.5 text-right tabular-nums font-semibold text-[var(--text)] print:text-black">
                      ₹{(line.unit_price_paise * line.quantity) / 100}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown */}
          <div className="py-4 border-b border-dashed border-[var(--border)] space-y-1.5 text-[13px] text-[var(--text-muted)] print:text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums font-semibold text-[var(--text)] print:text-black">
                ₹{(order.subtotal_paise / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span>CGST (2.5%)</span>
              <span className="tabular-nums">
                ₹{(order.cgst_paise / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span>SGST (2.5%)</span>
              <span className="tabular-nums">
                ₹{(order.sgst_paise / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[18px] font-bold text-[var(--text)] pt-2 border-t border-[var(--border)] print:text-black">
              <span>Total amount</span>
              <span className="tabular-nums text-[var(--accent-ink)] print:text-black">
                ₹{(order.total_paise / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="pt-4 flex items-center justify-between text-[13px]">
            <span className="text-[var(--text-muted)] print:text-gray-600">Payment status:</span>
            <Badge
              variant="status"
              status={order.payment_status === 'paid' ? 'complete' : 'pending'}
            >
              {order.payment_status === 'paid' ? 'Paid' : 'Unpaid · Pay at counter'}
            </Badge>
          </div>

          <div className="text-center pt-6 text-[12px] text-[var(--text-muted)] print:text-gray-600 leading-relaxed">
            Thank you for dining at Ritsu Food Corner! Please visit again.
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="no-print mt-6 space-y-3">
          <Button variant="primary" size="lg" className="w-full" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            <span>Print or save receipt (PDF)</span>
          </Button>

          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={handleShare}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-[var(--success)]" />
                  <span>Link copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-1.5 text-[var(--accent-ink)]" />
                  <span>Share link</span>
                </>
              )}
            </Button>

            <Button variant="secondary" size="md" className="flex-1" onClick={onBackToMenu}>
              <UtensilsCrossed className="w-4 h-4 mr-1.5 text-[var(--accent-ink)]" />
              <span>Back to menu</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


