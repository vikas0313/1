import React from 'react';
import type { CartLine } from '@ritsu/shared';
import { calculateBill } from '@ritsu/shared';
import { Stepper } from '../../components/Stepper.js';
import { Button } from '../../components/Button.js';

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
  const [orderNote, setOrderNote] = React.useState('');

  if (!isOpen) return null;

  const bill = calculateBill(
    cart.map((line) => ({
      unit_price_paise: line.unit_price_paise,
      quantity: line.quantity,
    })),
    5
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full sm:max-w-lg bg-[var(--bg-surface)] border-t sm:border border-[var(--border-gold)] rounded-t-[4px] sm:rounded-[2px] max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">
              Your Order · Table {tableLabel}
            </h2>
            <p className="text-[12px] text-[var(--text-secondary)]">Ordering for {customerName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 text-xl font-bold"
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[var(--border-hairline)]">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              Your cart is empty. Please select items from the menu.
            </div>
          ) : (
            cart.map((line) => (
              <div
                key={`${line.item_id}-${line.variant_id}`}
                className="pt-3 first:pt-0 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        line.is_veg ? 'bg-[var(--veg-dot)]' : 'bg-[var(--non-veg-dot)]'
                      }`}
                    />
                    <h4 className="text-[14px] font-medium text-[var(--text-primary)] truncate">
                      {line.name}
                    </h4>
                  </div>
                  <span className="text-[12px] text-[var(--text-secondary)]">
                    {line.variant_label} · ₹{line.unit_price_paise / 100}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-serif text-[15px] font-semibold text-[var(--text-primary)] tabular-nums">
                    ₹{(line.unit_price_paise * line.quantity) / 100}
                  </span>
                  <Stepper
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
          <div className="p-4 border-t border-[var(--border-hairline)] bg-[var(--bg-surface-elevated)] space-y-3">
            <div>
              <input
                type="text"
                placeholder="Kitchen note (e.g. less spicy, extra lemon)..."
                maxLength={200}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="w-full h-10 px-3 text-[13px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-primary)] focus:border-[var(--border-gold)] focus:outline-none"
              />
            </div>

            {/* Bill Breakdown */}
            <div className="text-[13px] space-y-1 text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-serif tabular-nums text-[var(--text-primary)]">
                  ₹{(bill.subtotal_paise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span>CGST (2.5%)</span>
                <span className="font-serif tabular-nums">₹{(bill.cgst_paise / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span>SGST (2.5%)</span>
                <span className="font-serif tabular-nums">₹{(bill.sgst_paise / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-serif text-[18px] font-bold text-[var(--text-primary)] pt-1 border-t border-[var(--border-hairline)]">
                <span>Total Amount</span>
                <span className="tabular-nums text-[var(--gold-ink)]">
                  ₹{(bill.total_paise / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full mt-2"
              isLoading={isSubmitting}
              onClick={() => onPlaceOrder(orderNote)}
            >
              Place Order (₹{(bill.total_paise / 100).toFixed(2)})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

