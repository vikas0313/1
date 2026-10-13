import React from 'react';
import { MenuItem, MenuItemVariant } from '../../types/menu';
import { formatINR } from '../../domain/pricing';
import { DietBadge } from '../common/DietBadge';
import { Plus } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onSelectVariantModal: (item: MenuItem) => void;
  onDirectAdd: (item: MenuItem, variant: MenuItemVariant) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onSelectVariantModal,
  onDirectAdd,
}) => {
  const isAvailable = item.available && item.variants.some((v) => v.available);
  const hasMultipleVariants = item.variants.length > 1;
  const singleVariant = item.variants[0];

  const handleAction = () => {
    if (!isAvailable) return;
    if (hasMultipleVariants) {
      onSelectVariantModal(item);
    } else if (singleVariant) {
      onDirectAdd(item, singleVariant);
    }
  };

  return (
    <div
      className={`bg-card border rounded-2xl p-3.5 transition duration-150 flex flex-col justify-between ${
        isAvailable
          ? 'border-app hover:border-app-subtle shadow-card-elevated'
          : 'border-app/40 opacity-55'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <DietBadge isVeg={item.is_veg} size="sm" />
            <span className="text-[11px] font-mono font-bold text-accent">
              #{item.item_no}
            </span>
          </div>
          {!isAvailable && (
            <span className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
              Sold Out
            </span>
          )}
        </div>

        <h3 className="font-semibold text-app text-sm leading-snug tracking-tight">
          {item.name}
        </h3>

        {item.description && (
          <p className="text-xs text-app-muted mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-app-subtle flex items-center justify-between gap-2">
        <div className="flex flex-col">
          {hasMultipleVariants ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.variants.map((v) => (
                <div key={v.id} className="text-xs">
                  <span className="text-[10px] text-app-muted font-medium mr-1">{v.label}</span>
                  <span className="font-mono font-bold text-accent">
                    {formatINR(v.price_paise, false)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="font-mono font-bold text-sm text-accent">
              {singleVariant ? formatINR(singleVariant.price_paise, false) : ''}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!isAvailable}
          onClick={handleAction}
          className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
            isAvailable
              ? 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20'
              : 'bg-card-muted text-app-muted cursor-not-allowed border border-app'
          }`}
          aria-label={`Add ${item.name} to cart`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{hasMultipleVariants ? 'Options' : 'Add'}</span>
        </button>
      </div>
    </div>
  );
};
