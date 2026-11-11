import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Order, RestaurantSettings } from '@ritsu/shared';
import { apiAdapter } from '../../data/ApiAdapter.js';
import { Button } from '../../components/Button.js';
import { TopBar } from '../../components/TopBar.js';
import { Copy, Check, ArrowRight, FileText } from 'lucide-react';

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
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-between">
      <TopBar
        title="Payment options"
        subtitle={`Order #${order.order_no} · Table ${order.table_label}`}
        tableLabel={order.table_label}
      />

      <main className="max-w-md w-full mx-auto px-4 py-6 flex-1 flex flex-col justify-center space-y-6">
        {/* Total Amount Warm Card */}
        <div className="warm-card p-6 text-center">
          <span className="text-[13px] font-medium text-[var(--text-muted)]">
            Total payable (includes 5% GST)
          </span>
          <div className="text-[36px] sm:text-[42px] font-bold tabular-nums text-[var(--text)] tracking-tight leading-tight mt-1 mb-1">
            ₹{amountRupees}
          </div>
          <span className="text-[13px] font-semibold text-[var(--accent-ink)]">
            Order confirmed · Pay via UPI or Cash
          </span>
        </div>

        {/* UPI QR Tile - Strict white card with quiet zone */}
        <div className="p-6 bg-white border border-[var(--border)] rounded-[24px] shadow-sm text-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan to pay via UPI"
              className="w-56 h-56 mx-auto block select-none rounded-xl"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-gray-400 text-sm mx-auto">
              Generating UPI QR code...
            </div>
          )}
          <p className="text-[13px] text-gray-800 font-semibold mt-3 select-none">
            Scan with GPay, PhonePe, Paytm, or BHIM
          </p>

          {/* UPI ID Row */}
          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100 text-[13px]">
            <span className="text-gray-500">UPI ID:</span>
            <code className="bg-gray-100 px-2.5 py-1 rounded-full font-mono text-gray-800 font-medium">
              {upiVpa}
            </code>
            <button
              type="button"
              onClick={handleCopyUPI}
              className="touch-target inline-flex items-center gap-1 text-[var(--accent-ink)] font-semibold hover:underline px-2 py-1 text-[13px]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href={upiDeepLink}
            className="touch-target w-full h-12 bg-[var(--nav)] text-[var(--on-nav)] dark:bg-[var(--accent)] dark:text-[var(--on-accent)] rounded-full font-semibold text-[15px] inline-flex items-center justify-center shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Pay with UPI app
          </a>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={onContinueToTracking}
          >
            <span>Pay cash at counter · Track order</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>

        <p className="text-[12px] text-[var(--text-muted)] text-center leading-relaxed">
          Payment is verified and marked complete at the counter.
        </p>
      </main>

      <footer className="text-center p-4 border-t border-[var(--border)] max-w-md w-full mx-auto">
        <button
          type="button"
          onClick={onViewBill}
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--accent-ink)] hover:underline"
        >
          <FileText className="w-4 h-4" />
          <span>View / Print detailed receipt</span>
        </button>
      </footer>
    </div>
  );
};


