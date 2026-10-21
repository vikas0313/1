import React from 'react';
import { RESTAURANT_CONFIG } from '../../config/restaurant.config';
import { ShoppingBag, UtensilsCrossed, PhoneCall, User, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  tableLabel: string;
  customerName?: string;
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tableLabel,
  customerName,
  cartItemCount,
  onOpenCart,
  onOpenAdmin,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <header className="bg-surface border-b border-app text-app transition-colors duration-200">
      {/* Top Banner: Party Order Promo */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-amber-600 px-4 py-1.5 text-xs text-white font-medium flex items-center justify-between gap-2 overflow-hidden shadow-sm">
        <span className="truncate">
          🎉 <strong className="font-bold">Party Orders:</strong> {RESTAURANT_CONFIG.partyOrderMessage}
        </span>
        <a
          href={`tel:${RESTAURANT_CONFIG.phone}`}
          className="flex items-center gap-1 bg-black/25 hover:bg-black/40 px-2 py-0.5 rounded-full text-[11px] font-bold text-amber-200 transition flex-shrink-0 cursor-pointer min-h-[24px]"
        >
          <PhoneCall className="w-3 h-3" />
          <span>Call Us</span>
        </a>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 text-white flex items-center justify-center font-black shadow-md flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">
                {RESTAURANT_CONFIG.restaurantName}
              </h1>
              <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Table {tableLabel}
              </span>
            </div>
            <p className="text-[11px] text-amber-400 font-medium italic">
              {RESTAURANT_CONFIG.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {customerName && (
            <div className="hidden sm:flex items-center gap-1.5 bg-card border border-app px-2.5 py-1 rounded-full text-xs text-app-muted">
              <User className="w-3.5 h-3.5 text-accent" />
              <span className="font-medium truncate max-w-[100px]">{customerName}</span>
            </div>
          )}

          <ThemeToggle
            currentTheme={theme}
            resolvedTheme={resolvedTheme}
            onThemeChange={setTheme}
            variant="compact"
          />

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-2.5 py-2 rounded-xl bg-card hover:bg-surface border border-app text-app text-xs font-bold flex items-center gap-1.5 transition min-h-[44px] cursor-pointer active:scale-95 shadow-sm"
              title="Admin / Owner Login"
              aria-label="Admin Login"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden xs:inline">Admin</span>
            </button>
          )}

          <button
            onClick={onOpenCart}
            className="relative px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md shadow-primary/30 flex items-center gap-2 cursor-pointer min-h-[44px] min-w-[44px] active:scale-95"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden xs:inline">Cart</span>
            {cartItemCount > 0 && (
              <span className="bg-accent text-neutral-950 text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center -ml-0.5 animate-bounce-subtle">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
