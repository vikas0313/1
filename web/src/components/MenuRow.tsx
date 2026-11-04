import React, { useState } from 'react';
import type { MenuItem, MenuItemVariant } from '@ritsu/shared';
import { SizeLabel } from './SizeLabel.js';
import { Stepper } from './Stepper.js';
import { Button } from './Button.js';

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

  const itemNoStr = item.item_no < 10 ? `0${item.item_no}` : `${item.item_no}`;

  return (
    <article
      className={`py-3.5 border-b border-[var(--border-hairline)] transition-opacity ${
        !isAvailable ? 'opacity-40 grayscale-[40%]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left: Item Number & Veg/Non-Veg dot */}
        <div className="flex items-center gap-2 pt-0.5 shrink-0">
          <span className="font-serif text-[15px] font-medium text-[var(--text-tertiary)] w-6 text-right select-none">
            {itemNoStr}.
          </span>
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              item.is_veg ? 'bg-[var(--veg-dot)]' : 'bg-[var(--non-veg-dot)]'
            }`}
            title={item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
          />
        </div>

        {/* Middle: Dish Name, Popular Tag, Description */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] sm:text-[16px] font-medium text-[var(--text-primary)] leading-tight">
              {item.name}
            </h3>
            {item.is_popular && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-[2px] bg-[var(--bg-surface-elevated)] text-[var(--gold-ink)] border border-[var(--border-gold)]">
                POPULAR
              </span>
            )}
          </div>

          {item.description ? (
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">
              {item.description}
            </p>
          ) : null}

          {/* Size Selectors (if 2 variants e.g. Single / Full) */}
          {hasMultipleVariants && isAvailable && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
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

        {/* Dotted Leader */}
        <div className="hidden sm:block menu-leader" />

        {/* Right: Price & Add / Stepper Action */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {!hasMultipleVariants && activeVariant && (
            <span className="font-serif text-[17px] sm:text-[18px] font-semibold text-[var(--text-primary)] tabular-nums">
              ₹{activeVariant.price_paise / 100}
            </span>
          )}

          {!isAvailable ? (
            <span className="text-[12px] uppercase font-medium text-[var(--text-tertiary)] italic">
              Not available
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
            <Button
              variant="secondary"
              onClick={() => {
                if (activeVariant) {
                  onAddToCart(activeVariant, 1);
                }
              }}
              className="h-8 px-3 text-[12px] font-medium"
            >
              + ADD
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

