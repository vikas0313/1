import React, { useState } from 'react';
import { QrCode, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle.js';
import { Button } from '../../components/Button.js';

const AVAILABLE_TABLES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];

export interface InvalidTablePageProps {
  onSelectTable?: (tableLabel: string) => void;
}

export const InvalidTablePage: React.FC<InvalidTablePageProps> = ({ onSelectTable }) => {
  const [selectedTable, setSelectedTable] = useState<string>('T1');

  const handleConfirm = () => {
    sessionStorage.setItem('ritsu_table', selectedTable);
    if (onSelectTable) {
      onSelectTable(selectedTable);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set('table', selectedTable);
      window.location.href = url.toString();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-between p-4 sm:p-6 text-center">
      <header className="flex justify-end">
        <ThemeToggle />
      </header>

      <main className="max-w-md w-full mx-auto warm-card p-6 sm:p-8 shadow-sm text-center my-auto">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent-ink)] flex items-center justify-center">
          <QrCode className="w-7 h-7" />
        </div>
        <h1 className="text-[22px] sm:text-[24px] font-bold text-[var(--text)] mb-2">
          Select Your Table
        </h1>
        <p className="text-[var(--text-muted)] text-[14px] leading-relaxed mb-6">
          Please select your table number below to view the menu and place your order.
        </p>

        {/* Table Selection Grid */}
        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {AVAILABLE_TABLES.map((t) => {
            const isSelected = selectedTable === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTable(t)}
                className={`touch-target h-14 rounded-2xl font-bold text-[15px] flex flex-col items-center justify-center border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[var(--accent)] text-[var(--on-accent)] border-[var(--accent)] shadow-sm scale-102 font-extrabold ring-2 ring-[var(--accent)]/30'
                    : 'bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent)]/50'
                }`}
              >
                <span className="text-[10px] uppercase font-semibold opacity-80 leading-none">Table</span>
                <span className="text-[17px] leading-tight mt-0.5">{t.replace('T', '')}</span>
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleConfirm}
          className="w-full font-semibold flex items-center justify-center gap-2 mb-4"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Continue with Table {selectedTable}</span>
        </Button>

        <div className="text-[12px] font-semibold text-[var(--accent-ink)]">
          Ritsu Food Corner · Dine-in ordering
        </div>
      </main>

      <footer className="text-center text-[12px] text-[var(--text-muted)] py-2">
        Need help? Please ask any staff member at the counter.
      </footer>
    </div>
  );
};
