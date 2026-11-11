import React, { useState, useEffect } from 'react';
import { apiAdapter } from '../../data/ApiAdapter.js';
import { Button } from '../../components/Button.js';
import { ThemeToggle } from '../../components/ThemeToggle.js';
import { InvalidTablePage } from './InvalidTablePage.js';
import { Phone, UtensilsCrossed } from 'lucide-react';

export interface WelcomePageProps {
  onStartOrdering: (tableLabel: string, customerName: string) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onStartOrdering }) => {
  const [tableLabel, setTableLabel] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [isValidatingTable, setIsValidatingTable] = useState<boolean>(true);
  const [isTableValid, setIsTableValid] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string>('');
  const [phone, setPhone] = useState<string>('+91 98765 43210');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table') || sessionStorage.getItem('ritsu_table') || '';
    const storedName = sessionStorage.getItem('ritsu_customer_name') || '';

    if (storedName) {
      setCustomerName(storedName);
    }

    if (!tableParam) {
      setIsValidatingTable(false);
      setIsTableValid(false);
      return;
    }

    setTableLabel(tableParam);

    apiAdapter
      .getTable(tableParam)
      .then((table) => {
        setIsTableValid(Boolean(table && table.active));
      })
      .catch(() => {
        setIsTableValid(tableParam.toUpperCase().startsWith('T'));
      })
      .finally(() => {
        setIsValidatingTable(false);
      });

    apiAdapter
      .getRestaurantSettings()
      .then((s) => setPhone(s.phone))
      .catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customerName.trim();
    if (trimmed.length < 2) {
      setNameError('Please enter your name (at least 2 characters)');
      return;
    }
    if (trimmed.length > 40) {
      setNameError('Name cannot exceed 40 characters');
      return;
    }

    sessionStorage.setItem('ritsu_table', tableLabel);
    sessionStorage.setItem('ritsu_customer_name', trimmed);
    onStartOrdering(tableLabel, trimmed);
  };

  if (isValidatingTable) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
        <div className="text-[16px] font-medium text-[var(--accent-ink)] animate-pulse">
          Connecting to table...
        </div>
      </div>
    );
  }

  if (!isTableValid) {
    return <InvalidTablePage />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Central Warm Card */}
      <div className="w-full max-w-[500px] warm-card p-6 sm:p-8 flex flex-col justify-between my-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[13px] font-semibold">Table {tableLabel}</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent-ink)] flex items-center justify-center shadow-xs">
            <UtensilsCrossed className="w-8 h-8" />
          </div>

          <h1 className="text-[28px] sm:text-[34px] font-bold text-[var(--text)] tracking-tight leading-tight mb-2">
            Welcome to Ritsu
          </h1>

          <p className="text-[15px] sm:text-[16px] text-[var(--text-muted)] mb-8 leading-relaxed max-w-xs mx-auto">
            Indo-Chinese street kitchen. Freshly tossed and served hot to your table.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label
                htmlFor="customer-name"
                className="block text-[13px] font-semibold text-[var(--text)] mb-2"
              >
                Your name
              </label>
              <input
                id="customer-name"
                type="text"
                autoFocus
                maxLength={40}
                placeholder="e.g. Rahul Sharma"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setNameError('');
                }}
                className="touch-target w-full h-12 px-4 text-[15px] bg-[var(--surface-2)] border border-[var(--border)] rounded-full text-[var(--text)] focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none transition-all"
              />
              {nameError && (
                <p className="text-[12px] text-[var(--danger)] mt-1.5 ml-2 font-medium">
                  {nameError}
                </p>
              )}
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2">
              Start ordering
            </Button>
          </form>
        </main>

        <footer className="text-center pt-6 mt-6 border-t border-[var(--border)]">
          <p className="text-[12px] text-[var(--text-muted)] mb-1">
            Hosting a party or bulk event?
          </p>
          <a
            href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-ink)] hover:underline"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call us: {phone}</span>
          </a>
        </footer>
      </div>
    </div>
  );
};


