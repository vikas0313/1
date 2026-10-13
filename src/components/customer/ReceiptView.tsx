import React from 'react';
import { Order } from '../../types/order';
import { formatINR } from '../../domain/pricing';
import { RESTAURANT_CONFIG } from '../../config/restaurant.config';
import { Printer, X } from 'lucide-react';

interface ReceiptViewProps {
  order: Order;
  allTableOrders?: Order[];
  onClose: () => void;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({
  order,
  allTableOrders = [],
  onClose,
}) => {
  const [viewCombined, setViewCombined] = React.useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  // If viewing combined bill for table
  const ordersToDisplay = viewCombined && allTableOrders.length > 0 ? allTableOrders : [order];

  const totalSubtotal = ordersToDisplay.reduce((sum, o) => sum + o.subtotal_paise, 0);
  const totalCgst = ordersToDisplay.reduce((sum, o) => sum + o.cgst_paise, 0);
  const totalSgst = ordersToDisplay.reduce((sum, o) => sum + o.sgst_paise, 0);
  const totalGrand = ordersToDisplay.reduce((sum, o) => sum + o.total_paise, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white text-black rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-auto receipt-container">
        {/* Screen-only Controls */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
          <div className="flex items-center gap-2">
            {allTableOrders.length > 1 && (
              <button
                type="button"
                onClick={() => setViewCombined(!viewCombined)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 font-semibold cursor-pointer"
              >
                {viewCombined ? 'Show Single Order' : `Table Combined (${allTableOrders.length})`}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer min-h-[38px] shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-black rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              aria-label="Close receipt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="text-center pb-3 border-b border-dashed border-gray-400">
          <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
            {RESTAURANT_CONFIG.restaurantName}
          </h2>
          <p className="text-[11px] font-medium text-gray-600 italic">
            "{RESTAURANT_CONFIG.tagline}"
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            {RESTAURANT_CONFIG.address.line1}, {RESTAURANT_CONFIG.address.line2}
          </p>
          <p className="text-[10px] text-gray-600">
            {RESTAURANT_CONFIG.address.city}, {RESTAURANT_CONFIG.address.state} -{' '}
            {RESTAURANT_CONFIG.address.pincode}
          </p>
          <p className="text-[10px] text-gray-700 font-semibold mt-1">
            GSTIN: {RESTAURANT_CONFIG.gstin} | FSSAI: {RESTAURANT_CONFIG.fssaiNumber}
          </p>
          <p className="text-[10px] text-gray-600">Ph: {RESTAURANT_CONFIG.phone}</p>
        </div>

        {/* Order Meta */}
        <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
          <div className="flex justify-between">
            <span className="font-semibold">Order ID:</span>
            <span className="font-mono">{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Table:</span>
            <span className="font-bold">{order.table_label}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Customer:</span>
            <span>{order.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Date & Time:</span>
            <span>{new Date(order.created_at).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <span className="font-semibold">Payment Status:</span>
            <span
              className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                order.payment_status === 'paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {order.payment_status} {order.payment_method ? `(${order.payment_method})` : ''}
            </span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-2.5 border-b border-dashed border-gray-400 text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-300 text-[10px] text-gray-600 uppercase">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Rate</th>
                <th className="py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px]">
              {ordersToDisplay.flatMap((o) =>
                o.items.map((item) => (
                  <tr key={`${o.id}_${item.id}`}>
                    <td className="py-1 pr-1">
                      <div className="font-medium text-gray-900 leading-tight">
                        #{item.item_no} {item.name_snapshot}
                      </div>
                      <div className="text-[9px] text-gray-500">{item.variant_label_snapshot}</div>
                    </td>
                    <td className="py-1 text-center font-mono">{item.quantity}</td>
                    <td className="py-1 text-right font-mono text-[10px]">
                      {formatINR(item.unit_price_paise, false)}
                    </td>
                    <td className="py-1 text-right font-mono font-semibold">
                      {formatINR(item.unit_price_paise * item.quantity)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* GST & Totals */}
        <div className="py-2.5 border-b border-dashed border-gray-400 text-xs space-y-1">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span className="font-mono">{formatINR(totalSubtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>CGST (2.5%):</span>
            <span className="font-mono">{formatINR(totalCgst)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>SGST (2.5%):</span>
            <span className="font-mono">{formatINR(totalSgst)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-300">
            <span>Grand Total:</span>
            <span className="font-mono text-base">{formatINR(totalGrand)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-3 text-[10px] text-gray-500 space-y-0.5">
          <p className="font-semibold text-gray-700">Thank you for dining with us!</p>
          <p>Please visit again.</p>
          <p className="text-[9px] text-gray-400 font-mono mt-2">
            Generated via Ritsu Food Corner QR System
          </p>
        </div>
      </div>
    </div>
  );
};
