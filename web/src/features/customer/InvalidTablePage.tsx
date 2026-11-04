import React from 'react';

export const InvalidTablePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-8 rounded-[2px] shadow-sm">
        <div className="w-12 h-12 mx-auto mb-4 border border-[var(--border-gold)] text-[var(--gold-ink)] flex items-center justify-center text-xl font-serif">
          QR
        </div>
        <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)] mb-2">
          Table Not Recognized
        </h1>
        <p className="text-[var(--text-secondary)] text-[14px] leading-relaxed mb-6">
          Please scan the QR code located on your table to view the menu and place your order.
        </p>
        <div className="text-[12px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">
          Ritsu Food Corner · Dine-In
        </div>
      </div>
    </div>
  );
};

