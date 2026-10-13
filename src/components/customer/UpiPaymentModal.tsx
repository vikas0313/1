import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Order } from '../../types/order';
import { formatINR } from '../../domain/pricing';
import { RESTAURANT_CONFIG } from '../../config/restaurant.config';
import { AlertCircle, QrCode, Banknote, ExternalLink, X, CheckCircle } from 'lucide-react';

interface UpiPaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPayAtCounterSelected: () => void;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onPayAtCounterSelected,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!order) return;

    // Construct UPI URI: upi://pay?pa=<VPA>&pn=<Name>&am=<amount>&cu=INR&tn=<OrderId>
    const rupeesStr = (order.total_paise / 100).toFixed(2);
    const upiUri = `upi://pay?pa=${encodeURIComponent(
      RESTAURANT_CONFIG.demoUpiVpa
    )}&pn=${encodeURIComponent(
      RESTAURANT_CONFIG.demoUpiName
    )}&am=${rupeesStr}&cu=INR&tn=${encodeURIComponent(`Order ${order.id} Table ${order.table_label}`)}`;

    QRCode.toDataURL(upiUri, {
      width: 240,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error', err));
  }, [order]);

  if (!isOpen || !order) return null;

  const rupeesStr = (order.total_paise / 100).toFixed(2);
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(
    RESTAURANT_CONFIG.demoUpiVpa
  )}&pn=${encodeURIComponent(
    RESTAURANT_CONFIG.demoUpiName
  )}&am=${rupeesStr}&cu=INR&tn=${encodeURIComponent(`Order ${order.id}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative flex flex-col items-center text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close payment modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Pay via UPI</h3>
        <p className="text-xs text-neutral-400 mb-2">
          Order <span className="font-mono text-white font-semibold">{order.id}</span> • Table{' '}
          <span className="font-bold text-amber-400">{order.table_label}</span>
        </p>

        <div className="text-2xl font-bold font-mono text-white mb-3">
          {formatINR(order.total_paise)}
        </div>

        {/* Demo Disclaimer Banner */}
        <div className="w-full bg-amber-500/15 border border-amber-500/30 rounded-xl p-2.5 mb-4 text-left flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-200 leading-tight">
            <span className="font-bold uppercase tracking-wider block text-amber-300">
              Demo Prototype Notice
            </span>
            Payment is simulated and not auto-verified in Phase 1. Your order is already safely placed with the kitchen!
          </div>
        </div>

        {/* Generated UPI QR Code */}
        {qrDataUrl && (
          <div className="bg-white p-3 rounded-2xl shadow-lg border border-neutral-300 mb-4 inline-block">
            <img
              src={qrDataUrl}
              alt="UPI Payment QR Code"
              className="w-48 h-48 object-contain rounded-lg"
            />
          </div>
        )}

        <div className="w-full space-y-2.5">
          <a
            href={upiDeepLink}
            className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 min-h-[44px]"
          >
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span>Open in UPI App (GPay / PhonePe / Paytm)</span>
          </a>

          <button
            type="button"
            onClick={() => {
              onPayAtCounterSelected();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Banknote className="w-4 h-4 text-amber-300" />
            <span>Pay at Counter / Cash</span>
          </button>
        </div>

        <p className="text-[10px] text-neutral-400 mt-4 flex items-center gap-1 justify-center">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          Kitchen has received your order and is getting ready.
        </p>
      </div>
    </div>
  );
};
