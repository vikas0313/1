import React from 'react';
import { Home, UtensilsCrossed, ShoppingBag, Clock, Receipt } from 'lucide-react';

export type NavTab = 'welcome' | 'menu' | 'cart' | 'track' | 'bill';

export interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  cartItemCount?: number;
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  cartItemCount = 0,
  className = '',
}) => {
  return (
    <nav
      aria-label="Bottom Navigation"
      className={`fixed bottom-4 left-4 right-4 z-40 md:hidden flex justify-center pointer-events-none no-print ${className}`}
    >
      <div className="pointer-events-auto bg-[var(--nav)] text-[var(--on-nav)] border border-[var(--border)]/20 shadow-xl rounded-[28px] px-3 py-2 flex items-center justify-between w-full max-w-md mx-auto backdrop-blur-md">
        {/* 1. Home / Welcome */}
        <button
          type="button"
          onClick={() => onSelectTab('welcome')}
          aria-label="Home"
          className={`touch-target flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
            activeTab === 'welcome'
              ? 'text-[var(--accent)] font-semibold'
              : 'text-[var(--on-nav)]/70 hover:text-[var(--on-nav)]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* 2. Menu */}
        <button
          type="button"
          onClick={() => onSelectTab('menu')}
          aria-label="Menu"
          className={`touch-target flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
            activeTab === 'menu'
              ? 'text-[var(--accent)] font-semibold'
              : 'text-[var(--on-nav)]/70 hover:text-[var(--on-nav)]'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>

        {/* 3. Center Cart: Larger peach rounded-square button */}
        <div className="relative -top-2 px-1">
          <button
            type="button"
            onClick={() => onSelectTab('cart')}
            aria-label={`Cart with ${cartItemCount} items`}
            className="touch-target w-13 h-13 bg-[var(--accent)] text-[var(--on-accent)] rounded-[18px] flex items-center justify-center shadow-lg active:scale-95 transition-transform relative select-none"
          >
            <ShoppingBag className="w-6 h-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[var(--on-accent)] text-[var(--accent)] text-[11px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center border-2 border-[var(--nav)] shadow-xs">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* 4. Track */}
        <button
          type="button"
          onClick={() => onSelectTab('track')}
          aria-label="Track Order"
          className={`touch-target flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
            activeTab === 'track'
              ? 'text-[var(--accent)] font-semibold'
              : 'text-[var(--on-nav)]/70 hover:text-[var(--on-nav)]'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Status</span>
        </button>

        {/* 5. Bill */}
        <button
          type="button"
          onClick={() => onSelectTab('bill')}
          aria-label="View Bill"
          className={`touch-target flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
            activeTab === 'bill'
              ? 'text-[var(--accent)] font-semibold'
              : 'text-[var(--on-nav)]/70 hover:text-[var(--on-nav)]'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Bill</span>
        </button>
      </div>
    </nav>
  );
};
