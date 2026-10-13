import React from 'react';
import { CartLine, BillCalculation } from '../../types/order';
import { formatINR } from '../../domain/pricing';
import { DietBadge } from '../common/DietBadge';
import { ShoppingBag, Trash2, ArrowRight, X, MessageSquare } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lines: CartLine[];
  bill: BillCalculation;
  note: string;
  onNoteChange: (note: string) => void;
  onUpdateQty: (itemId: string, variantId: string, qty: number) => void;
  onRemoveLine: (itemId: string, variantId: string) => void;
  onPlaceOrder: () => void;
  isSubmitting?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  lines,
  bill,
  note,
  onNoteChange,
  onUpdateQty,
  onRemoveLine,
  onPlaceOrder,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/10 text-red-500 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Your Order Cart</h2>
              <p className="text-[11px] text-neutral-400">
                {lines.length} {lines.length === 1 ? 'dish' : 'dishes'} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart items list */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 no-scrollbar">
          {lines.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-sm">
              Your cart is empty. Add items from the menu!
            </div>
          ) : (
            lines.map((line) => {
              const lineTotal = line.unit_price_paise * line.quantity;
              return (
                <div
                  key={`${line.item_id}__${line.variant_id}`}
                  className="bg-neutral-850 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <DietBadge isVeg={line.is_veg} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-amber-500 font-mono font-bold">
                          #{line.item_no}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
                          {line.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-neutral-400 font-medium">
                          Size: {line.variant_label}
                        </span>
                        <span className="text-xs font-mono font-semibold text-amber-400">
                          {formatINR(line.unit_price_paise)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-neutral-800 rounded-xl p-1 border border-neutral-700">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(line.item_id, line.variant_id, line.quantity - 1)
                        }
                        className="w-7 h-7 rounded-lg bg-neutral-700/60 hover:bg-neutral-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer min-h-[30px] min-w-[30px]"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xs w-4 text-center text-white">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(line.item_id, line.variant_id, line.quantity + 1)
                        }
                        disabled={line.quantity >= 20}
                        className="w-7 h-7 rounded-lg bg-neutral-700/60 hover:bg-neutral-700 disabled:opacity-40 text-white flex items-center justify-center font-bold text-sm cursor-pointer min-h-[30px] min-w-[30px]"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[55px]">
                      <div className="font-mono font-bold text-xs text-white">
                        {formatINR(lineTotal)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveLine(line.item_id, line.variant_id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-lg cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Optional cooking note */}
          {lines.length > 0 && (
            <div className="pt-1">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Special Instructions (Optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                maxLength={100}
                placeholder="e.g. Less spicy, extra sauce, no onions"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>
          )}
        </div>

        {/* Live Bill Breakdown & Action */}
        {lines.length > 0 && (
          <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 rounded-b-3xl">
            <div className="space-y-1.5 text-xs text-neutral-400 pb-3 border-b border-neutral-800">
              <div className="flex justify-between">
                <span>Subtotal ({lines.reduce((s, l) => s + l.quantity, 0)} items)</span>
                <span className="font-mono text-neutral-200">{formatINR(bill.subtotal_paise)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (2.5%)</span>
                <span className="font-mono text-neutral-200">{formatINR(bill.cgst_paise)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (2.5%)</span>
                <span className="font-mono text-neutral-200">{formatINR(bill.sgst_paise)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-neutral-800/80">
                <span>Total Amount (incl. 5% GST)</span>
                <span className="font-mono text-amber-400 text-base">
                  {formatINR(bill.total_paise)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting || lines.length === 0}
              onClick={onPlaceOrder}
              className="mt-3 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white font-bold text-sm shadow-xl shadow-red-950/50 flex items-center justify-between cursor-pointer min-h-[48px] active:scale-98 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Placing Order...' : 'Confirm & Place Order'}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{formatINR(bill.total_paise)}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
