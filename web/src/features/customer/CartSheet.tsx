import React, { useState } from 'react';
import type { CartLine } from '@ritsu/shared';
import { calculateBill } from '@ritsu/shared';
import { Stepper } from '../../components/Stepper.js';
import { Button } from '../../components/Button.js';
import { X, ShoppingBag } from 'lucide-react';

export interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartLine[];
  onUpdateQuantity: (itemId: string, variantId: string, quantity: number) => void;
  onPlaceOrder: (note: string) => void;
  isSubmitting: boolean;
  tableLabel: string;
  customerName: string;
}

export const CartSheet: React.FC<CartSheetProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onPlaceOrder,
  isSubmitting,
  tableLabel,
  customerName,
}) => {
  const [orderNote, setOrderNote] = useState('');

  if (!isOpen) return null;

  const bill = calculateBill(
    cart.map((line) => ({
      unit_price_paise: line.unit_price_paise,
      quantity: line.quantity,
    })),
    5
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-[var(--surface)] border-t sm:border border-[var(--border)] rounded-t-[28px] sm:rounded-[24px] max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[var(--accent-ink)]" />
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--text)]">
                Your order · Table {tableLabel}
              </h2>
            </div>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Ordering for {customerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target w-10 h-10 rounded-[16px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:border-[var(--accent)]/50 active:scale-95 transition-all"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-[var(--border)]/60">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-[14px]">
              Your cart is empty. Add dishes from the menu to start your order.
            </div>
          ) : (
            cart.map((line) => (
              <div
                key={`${line.item_id}-${line.variant_id}`}
                className="pt-3 first:pt-0 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        line.is_veg ? 'bg-[var(--veg)]' : 'bg-[var(--nonveg)]'
                      }`}
                    />
                    <h4 className="text-[15px] font-semibold text-[var(--text)] truncate">
                      {line.name}
                    </h4>
                  </div>
                  <span className="text-[12px] text-[var(--text-muted)] ml-4.5">
                    {line.variant_label} · ₹{line.unit_price_paise / 100}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[16px] font-bold text-[var(--text)] tabular-nums">
                    ₹{(line.unit_price_paise * line.quantity) / 100}
                  </span>
                  <Stepper
                    size="sm"
                    value={line.quantity}
                    onChange={(qty) => onUpdateQuantity(line.item_id, line.variant_id, qty)}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Notes & Summary */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface-2)]/60 space-y-3.5">
            <div>
              <label
                htmlFor="cart-order-note"
                className="block text-[12px] font-semibold text-[var(--text)] mb-1"
              >
                Special instructions (optional)
              </label>
              <input
                id="cart-order-note"
                type="text"
                placeholder="e.g. less spicy, extra lemon, no onions"
                maxLength={200}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="w-full h-11 px-4 text-[14px] bg-[var(--surface)] border border-[var(--border)] rounded-full text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-all"
              />
            </div>

            {/* Bill Breakdown */}
            <div className="text-[13px] space-y-1.5 text-[var(--text-muted)] pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold text-[var(--text)]">
                  ₹{(bill.subtotal_paise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span>CGST (2.5%)</span>
                <span className="tabular-nums">₹{(bill.cgst_paise / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span>SGST (2.5%)</span>
                <span className="tabular-nums">₹{(bill.sgst_paise / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[18px] font-bold text-[var(--text)] pt-2 border-t border-[var(--border)]">
                <span>Total Amount</span>
                <span className="tabular-nums text-[var(--accent-ink)]">
                  ₹{(bill.total_paise / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              onClick={() => onPlaceOrder(orderNote)}
            >
              Place order · ₹{(bill.total_paise / 100).toFixed(2)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};


