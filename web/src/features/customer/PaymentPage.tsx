import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Order, RestaurantSettings } from '@ritsu/shared';
import { apiAdapter } from '../../data/ApiAdapter.js';
import { Button } from '../../components/Button.js';
import { ThemeToggle } from '../../components/ThemeToggle.js';

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
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    apiAdapter
      .getRestaurantSettings()
      .then((s) => {
        setSettings(s);
        // Generate UPI payload
        const amountRupees = (order.total_paise / 100).toFixed(2);
        const upiUri = `upi://pay?pa=${encodeURIComponent(s.upi_vpa)}&pn=${encodeURIComponent(
          s.name
        )}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(
          `Order ${order.order_no} Table ${order.table_label}`
        )}`;

        QRCode.toDataURL(upiUri, {
          margin: 2,
          width: 260,
          color: {
            dark: '#000000',
            light: '#FFFFFF', // Strict white background
          },
        }).then(setQrDataUrl);
      })
      .catch(() => {});
  }, [order]);

  const upiVpa = settings?.upi_vpa || 'ritsu@upi';
  const amountRupees = (order.total_paise / 100).toFixed(2);
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(
    settings?.name || 'Ritsu Food Corner'
  )}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(
    `Order ${order.order_no} Table ${order.table_label}`
  )}`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] p-6 max-w-lg mx-auto flex flex-col justify-between">
      <header className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
        <div>
          <span className="text-[12px] uppercase tracking-wider font-semibold text-[var(--gold-ink)]">
            Order {order.order_no} · Table {order.table_label}
          </span>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
            Payment Options
          </h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="my-auto py-6 text-center space-y-6">
        {/* Total Amount Banner */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-4 rounded-[2px]">
          <div className="text-[12px] uppercase tracking-wider text-[var(--text-secondary)] font-medium">
            Total Payable (Incl. 5% GST)
          </div>
          <div className="font-serif text-4xl font-bold text-[var(--gold-ink)] mt-1">
            ₹{amountRupees}
          </div>
        </div>

        {/* UPI QR Tile - Always dark QR on pure white */}
        <div className="inline-block p-4 bg-white border border-[var(--border-hairline)] rounded-[4px] shadow-sm">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan to pay via UPI"
              className="w-56 h-56 mx-auto block select-none"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-gray-400 text-sm">
              Generating UPI QR...
            </div>
          )}
          <p className="text-[11px] uppercase tracking-wider text-black font-semibold mt-2 select-none">
            Scan with GPay, PhonePe, Paytm, or BHIM
          </p>
        </div>

        {/* UPI ID Row */}
        <div className="flex items-center justify-center gap-2 text-[13px]">
          <span className="text-[var(--text-secondary)]">UPI ID:</span>
          <code className="bg-[var(--bg-surface-elevated)] px-2 py-0.5 rounded border border-[var(--border-hairline)] font-mono text-[var(--text-primary)]">
            {upiVpa}
          </code>
          <button
            type="button"
            onClick={handleCopyUPI}
            className="text-[var(--gold-ink)] font-semibold hover:underline text-[12px] uppercase tracking-wider"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Deep link for mobile users */}
          <a
            href={upiDeepLink}
            className="w-full h-12 bg-[var(--gold-ink)] text-[var(--gold-ink-contrast)] rounded-[2px] font-medium uppercase tracking-wider text-[13px] inline-flex items-center justify-center shadow-sm hover:opacity-90 active:scale-[0.99] transition-all"
          >
            Pay with UPI App
          </a>

          <Button
            variant="secondary"
            className="w-full"
            onClick={onContinueToTracking}
          >
            Pay at Counter / Cash & Track Order
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-[12px] text-[var(--text-secondary)] italic max-w-xs mx-auto leading-relaxed">
          * Payment status is verified and confirmed at the restaurant counter.
        </p>
      </main>

      <footer className="text-center pt-4 border-t border-[var(--border-hairline)]">
        <Button variant="tertiary" onClick={onViewBill}>
          View / Print Detailed Bill →
        </Button>
      </footer>
    </div>
  );
};

