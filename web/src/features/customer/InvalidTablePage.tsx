import React from 'react';
import { QrCode } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle.js';

export const InvalidTablePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-between p-6 text-center">
      <header className="flex justify-end">
        <ThemeToggle />
      </header>

      <main className="max-w-md w-full mx-auto warm-card p-8 shadow-sm text-center my-auto">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent-ink)] flex items-center justify-center">
          <QrCode className="w-7 h-7" />
        </div>
        <h1 className="text-[22px] sm:text-[24px] font-bold text-[var(--text)] mb-2">
          Table not recognized
        </h1>
        <p className="text-[var(--text-muted)] text-[14px] leading-relaxed mb-6">
          Please scan the QR code located on your table to view the menu and place your order.
        </p>
        <div className="text-[12px] font-semibold text-[var(--accent-ink)]">
          Ritsu Food Corner · Dine-in ordering
        </div>
      </main>

      <footer className="text-center text-[12px] text-[var(--text-muted)]">
        Need help? Please ask any staff member at the counter.
      </footer>
    </div>
  );
};


