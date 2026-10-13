import React, { useState } from 'react';
import { MenuItem, MenuItemVariant } from '../../types/menu';
import { formatINR } from '../../domain/pricing';
import { DietBadge } from '../common/DietBadge';
import { X, Check } from 'lucide-react';

interface VariantSelectorModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, variant: MenuItemVariant, quantity: number) => void;
}

export const VariantSelectorModal: React.FC<VariantSelectorModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  if (!item) return null;

  const activeVariants = item.variants.filter((v) => v.available);
  const currentSelected = activeVariants.find((v) => v.id === selectedVariantId) || activeVariants[0];

  const handleAdd = () => {
    if (!currentSelected) return;
    onAddToCart(item, currentSelected, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800/80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close variant selector"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-2.5 mb-2 pr-10">
          <DietBadge isVeg={item.is_veg} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400 font-mono font-semibold">#{item.item_no}</span>
              <h3 className="font-bold text-white text-base leading-snug">{item.name}</h3>
            </div>
            {item.description && (
              <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-neutral-800/80 pt-4">
          <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
            Select Portion Size *
          </label>
          <div className="space-y-2">
            {item.variants.map((v) => {
              const isSelected = (currentSelected?.id === v.id);
              const isAvailable = v.available;

              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-medium transition cursor-pointer min-h-[48px] ${
                    !isAvailable
                      ? 'border-neutral-800 bg-neutral-900/50 text-neutral-600 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-red-500 bg-red-600/10 text-white shadow-sm'
                      : 'border-neutral-800 bg-neutral-850 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-red-500 bg-red-600 text-white'
                          : 'border-neutral-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="font-semibold">{v.label}</span>
                    {v.needs_verification && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        verified
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-amber-400 font-mono">
                    {formatINR(v.price_paise)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity selector */}
        <div className="mt-4 flex items-center justify-between border-t border-neutral-800/80 pt-3.5">
          <span className="text-xs font-semibold text-neutral-300">Quantity</span>
          <div className="flex items-center gap-3 bg-neutral-800 rounded-xl p-1 border border-neutral-700">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg bg-neutral-700/60 hover:bg-neutral-700 disabled:opacity-40 text-white flex items-center justify-center font-bold text-base cursor-pointer min-h-[32px] min-w-[32px]"
            >
              -
            </button>
            <span className="font-mono font-bold text-sm w-5 text-center text-white">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              disabled={quantity >= 20}
              className="w-8 h-8 rounded-lg bg-neutral-700/60 hover:bg-neutral-700 disabled:opacity-40 text-white flex items-center justify-center font-bold text-base cursor-pointer min-h-[32px] min-w-[32px]"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!currentSelected || !currentSelected.available}
          className="mt-5 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white font-bold text-sm shadow-lg shadow-red-900/30 flex items-center justify-between cursor-pointer min-h-[48px]"
        >
          <span>Add to Order</span>
          <span className="font-mono">
            {currentSelected ? formatINR(currentSelected.price_paise * quantity) : ''}
          </span>
        </button>
      </div>
    </div>
  );
};
