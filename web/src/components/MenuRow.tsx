import React, { useState } from 'react';
import type { MenuItem, MenuItemVariant } from '@ritsu/shared';
import { SizeLabel } from './SizeLabel.js';
import { Stepper } from './Stepper.js';
import { Plus, Utensils } from 'lucide-react';

export interface MenuRowProps {
  item: MenuItem;
  currentQuantity?: number;
  onAddToCart: (variant: MenuItemVariant, quantity: number) => void;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  getVariantQuantity?: (variantId: string) => number;
}

export const MenuRow: React.FC<MenuRowProps> = ({
  item,
  onAddToCart,
  onUpdateQuantity,
  getVariantQuantity,
}) => {
  const isAvailable = item.available && item.variants.some((v) => v.available);
  const hasMultipleVariants = item.variants.length > 1;

  // Selected variant for multi-variant items
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    item.variants[0]?.id || ''
  );

  const activeVariant =
    item.variants.find((v) => v.id === selectedVariantId) || item.variants[0];

  const currentVariantQty = getVariantQuantity
    ? getVariantQuantity(activeVariant?.id || '')
    : 0;

  const priceRupees = activeVariant ? activeVariant.price_paise / 100 : 0;

  return (
    <article
      className={`warm-card p-4 transition-all duration-150 ${
        !isAvailable ? 'opacity-40 grayscale-[40%]' : ''
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Round thumbnail with dish indicator */}
        <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0 relative">
          <Utensils className="w-5 h-5 text-[var(--text-muted)]" />
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--surface)] ${
              item.is_veg ? 'bg-[var(--veg)]' : 'bg-[var(--nonveg)]'
            }`}
            title={item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
          />
        </div>

        {/* Dish Name, description, popular badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[16px] font-bold text-[var(--text)] leading-snug">
              {item.name}
            </h3>
            {item.is_popular && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent-ink)] border border-[var(--accent)]/30">
                Popular
              </span>
            )}
          </div>

          {item.description ? (
            <p className="text-[13px] text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          ) : null}

          {/* Size Selectors (e.g. Single / Full) */}
          {hasMultipleVariants && isAvailable && (
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {item.variants.map((v) => (
                <SizeLabel
                  key={v.id}
                  label={v.label}
                  pricePaise={v.price_paise}
                  isSelected={v.id === activeVariant?.id}
                  disabled={!v.available}
                  onClick={() => setSelectedVariantId(v.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Big Bold Price figure and Add / Stepper action */}
        <div className="flex flex-col items-end justify-between self-stretch shrink-0 gap-2">
          <div className="text-right">
            <span className="text-[18px] sm:text-[20px] font-bold tabular-nums text-[var(--text)]">
              ₹{priceRupees}
            </span>
          </div>

          <div>
            {!isAvailable ? (
              <span className="text-[12px] font-medium text-[var(--text-muted)] italic">
                Unavailable
              </span>
            ) : currentVariantQty > 0 ? (
              <Stepper
                value={currentVariantQty}
                onChange={(newQty) => {
                  if (activeVariant) {
                    onUpdateQuantity(activeVariant.id, newQty);
                  }
                }}
              />
            ) : (
              /* Wide low beige '+' bar as add action */
              <button
                type="button"
                onClick={() => {
                  if (activeVariant) {
                    onAddToCart(activeVariant, 1);
                  }
                }}
                className="touch-target inline-flex items-center justify-center gap-1.5 px-4 h-11 rounded-full bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]/40 active:scale-95 transition-all text-[14px] font-semibold shadow-2xs"
                aria-label={`Add ${item.name} to order`}
              >
                <Plus className="w-4 h-4 text-[var(--accent-ink)]" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};


