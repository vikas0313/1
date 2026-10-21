import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QrCode, AlertCircle, UtensilsCrossed, ShieldCheck } from 'lucide-react';
import { RESTAURANT_CONFIG } from '../../config/restaurant.config';
import { AdminOrdersModal } from './AdminOrdersModal';

import { useTheme } from '../../hooks/useTheme';
import { ThemeToggle } from '../common/ThemeToggle';

interface TableGuardProps {
  children: (tableLabel: string) => React.ReactNode;
}

export const TableGuard: React.FC<TableGuardProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableParam = searchParams.get('table')?.trim().toUpperCase();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState<boolean>(false);

  const validTable = RESTAURANT_CONFIG.tables.find(
    (t) => t.active && t.label.toUpperCase() === tableParam
  );

  if (!validTable) {
    return (
      <div className="min-h-screen bg-app text-app flex flex-col items-center justify-center p-6 text-center transition-colors duration-200">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setIsOwnerModalOpen(true)}
            className="py-1.5 px-3 rounded-xl bg-card hover:bg-surface border border-app text-app text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            title="Owner / Staff Sign In"
            aria-label="Owner Login"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Owner Login</span>
          </button>

          <ThemeToggle
            currentTheme={theme}
            resolvedTheme={resolvedTheme}
            onThemeChange={setTheme}
            variant="compact"
          />
        </div>

        <div className="max-w-md w-full bg-surface border border-app rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-5 shadow-inner">
            <QrCode className="w-9 h-9" />
          </div>

          <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <UtensilsCrossed className="w-4 h-4" />
            <span>{RESTAURANT_CONFIG.restaurantName}</span>
          </div>

          <h1 className="text-2xl font-bold text-app mb-2">Scan Your Table QR</h1>

          <p className="text-app-muted text-sm mb-6 leading-relaxed">
            {tableParam ? (
              <span className="flex items-center justify-center gap-1.5 text-rose-500 mb-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Table "{tableParam}" was not recognized.
              </span>
            ) : null}
            Please scan the QR code located on your dining table standee to browse the menu and order.
          </p>

          <div className="w-full border-t border-app pt-5">
            <p className="text-xs text-app-muted mb-3 font-medium">
              Demo Mode: Choose a table to test:
            </p>
            <div className="grid grid-cols-4 gap-2 w-full">
              {RESTAURANT_CONFIG.tables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/?table=${t.label}`)}
                  className="py-2.5 px-3 rounded-xl bg-card hover:bg-primary hover:text-white border border-app hover:border-primary font-bold text-sm text-app transition active:scale-95 cursor-pointer"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Owner Quick Access Section */}
          <div className="w-full border-t border-app pt-4 mt-5 flex items-center justify-between text-xs">
            <span className="text-app-muted">Restaurant Owner or Staff?</span>
            <button
              onClick={() => setIsOwnerModalOpen(true)}
              className="font-bold text-accent hover:text-amber-300 flex items-center gap-1 cursor-pointer transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In as Owner</span>
            </button>
          </div>
        </div>

        <AdminOrdersModal
          isOpen={isOwnerModalOpen}
          onClose={() => setIsOwnerModalOpen(false)}
        />
      </div>
    );
  }

  return <>{children(validTable.label)}</>;
};
