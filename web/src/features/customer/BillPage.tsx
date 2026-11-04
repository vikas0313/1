import React, { useEffect, useState } from 'react';
import type { Order, RestaurantSettings } from '@ritsu/shared';
import { apiAdapter } from '../../data/ApiAdapter.js';
import { Button } from '../../components/Button.js';
import { Badge } from '../../components/Badge.js';
import { ThemeToggle } from '../../components/ThemeToggle.js';

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

  // Formatted date in Asia/Kolkata time
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
    <div className="min-h-screen bg-[var(--bg-canvas)] p-4 sm:p-6 max-w-lg mx-auto">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-hairline)]">
        <Button variant="secondary" onClick={onBackToTracking} className="h-9 px-3 text-[12px]">
          ← Back to Tracker
        </Button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Bill Receipt Card (Black on white in print mode) */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-6 rounded-[2px] shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="text-center pb-4 border-b border-dashed border-[var(--border-hairline)]">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {settings?.name || 'Ritsu Food Corner'}
          </h1>
          <p className="text-[12px] italic text-[var(--gold-ink)]">
            {settings?.tagline || 'Indo-Chinese ka asli maza – Ritsu ke saath!'}
          </p>
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">
            {settings?.address || 'Main Road, Food Street, India'}
          </p>
          <p className="text-[12px] text-[var(--text-secondary)]">
            GSTIN: <span className="font-mono">{settings?.gstin || '36ABCDE1234F1Z5'}</span> · Tel:{' '}
            {settings?.phone || '+91 98765 43210'}
          </p>
        </div>

        {/* Order Meta */}
        <div className="py-3 border-b border-dashed border-[var(--border-hairline)] text-[13px] flex justify-between">
          <div>
            <div>
              <span className="text-[var(--text-secondary)]">Order No: </span>
              <strong className="text-[var(--text-primary)]">{order.order_no}</strong>
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Customer: </span>
              <span className="text-[var(--text-primary)]">{order.customer_name}</span>
            </div>
          </div>
          <div className="text-right">
            <div>
              <span className="text-[var(--text-secondary)]">Table: </span>
              <strong className="text-[var(--gold-ink)]">{order.table_label}</strong>
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)]">{orderDate}</div>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-4 border-b border-dashed border-[var(--border-hairline)]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border-hairline)]">
                <th className="pb-1.5">Item</th>
                <th className="pb-1.5 text-center">Qty</th>
                <th className="pb-1.5 text-right">Price</th>
                <th className="pb-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {order.items.map((line) => (
                <tr key={line.id} className="py-2">
                  <td className="py-2 pr-2">
                    <div className="font-medium text-[var(--text-primary)]">
                      {line.name_snapshot}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {line.variant_label_snapshot}
                    </div>
                  </td>
                  <td className="py-2 text-center tabular-nums">{line.quantity}</td>
                  <td className="py-2 text-right font-serif tabular-nums text-[var(--text-secondary)]">
                    ₹{line.unit_price_paise / 100}
                  </td>
                  <td className="py-2 text-right font-serif tabular-nums font-semibold text-[var(--text-primary)]">
                    ₹{(line.unit_price_paise * line.quantity) / 100}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="py-3 border-b border-dashed border-[var(--border-hairline)] space-y-1.5 text-[13px] text-[var(--text-secondary)]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-serif tabular-nums text-[var(--text-primary)]">
              ₹{(order.subtotal_paise / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span>CGST (2.5%)</span>
            <span className="font-serif tabular-nums">
              ₹{(order.cgst_paise / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span>SGST (2.5%)</span>
            <span className="font-serif tabular-nums">
              ₹{(order.sgst_paise / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between font-serif text-[18px] font-bold text-[var(--text-primary)] pt-1 border-t border-[var(--border-hairline)]">
            <span>Total Payable</span>
            <span className="tabular-nums text-[var(--gold-ink)]">
              ₹{(order.total_paise / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Status Footer */}
        <div className="pt-4 flex items-center justify-between text-[12px]">
          <span className="text-[var(--text-secondary)]">Payment Status:</span>
          <Badge
            variant="status"
            status={order.payment_status === 'paid' ? 'complete' : 'pending'}
          >
            {order.payment_status === 'paid' ? 'PAID' : 'UNPAID / CASH AT COUNTER'}
          </Badge>
        </div>

        <div className="text-center pt-6 text-[12px] text-[var(--text-secondary)] italic">
          Thank you for dining with us! Please visit again.
        </div>
      </div>

      {/* Buttons (hidden during printing) */}
      <div className="no-print mt-6 space-y-3">
        <Button variant="primary" className="w-full" onClick={handlePrint}>
          🖨️ Print / Save Receipt (PDF)
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={handleShare}>
            {copied ? 'Link Copied!' : '📤 Share Receipt Link'}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onBackToMenu}>
            🍽️ Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

