import React, { useState, useEffect } from 'react';
import { apiAdapter } from '../../data/ApiAdapter.js';
import { Button } from '../../components/Button.js';
import { ThemeToggle } from '../../components/ThemeToggle.js';
import { InvalidTablePage } from './InvalidTablePage.js';

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
    // Read table parameter from URL (e.g. ?table=T1)
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

    // Validate table existence against backend
    apiAdapter
      .getTable(tableParam)
      .then((table) => {
        setIsTableValid(Boolean(table && table.active));
      })
      .catch(() => {
        // Fallback for offline or local preview
        setIsTableValid(tableParam.toUpperCase().startsWith('T'));
      })
      .finally(() => {
        setIsValidatingTable(false);
      });

    // Fetch restaurant phone
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
      <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center p-6">
        <div className="font-serif text-lg text-[var(--gold-ink)] animate-pulse">
          Connecting to table...
        </div>
      </div>
    );
  }

  if (!isTableValid) {
    return <InvalidTablePage />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col justify-between p-6 max-w-lg mx-auto">
      <header className="flex justify-between items-center pt-2">
        <span className="text-[12px] uppercase tracking-widest font-semibold text-[var(--gold-ink)]">
          Table {tableLabel}
        </span>
        <ThemeToggle />
      </header>

      <main className="my-auto py-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 border-2 border-[var(--border-gold)] text-[var(--gold-ink)] flex items-center justify-center font-serif text-3xl font-bold rounded-[2px]">
          R
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[var(--text-primary)] mb-2 tracking-tight">
          Ritsu Food Corner
        </h1>

        <p className="font-serif italic text-[16px] text-[var(--gold-ink)] mb-8">
          Indo-Chinese ka asli maza – Ritsu ke saath!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto text-left">
          <div>
            <label
              htmlFor="customer-name"
              className="block text-[12px] uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5"
            >
              Your Name
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
              className="w-full h-12 px-4 text-[15px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] text-[var(--text-primary)] focus:border-[var(--border-gold)] focus:outline-none transition-colors"
            />
            {nameError && (
              <p className="text-[12px] text-red-600 mt-1 font-medium">{nameError}</p>
            )}
          </div>

          <Button type="submit" variant="primary" className="w-full">
            Start Ordering
          </Button>
        </form>
      </main>

      <footer className="text-center pb-4 border-t border-[var(--border-hairline)] pt-4">
        <p className="text-[12px] text-[var(--text-secondary)] mb-1">
          Hosting a party or bulk event?
        </p>
        <a
          href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
          className="text-[13px] font-semibold text-[var(--gold-ink)] hover:underline"
        >
          Call us: {phone}
        </a>
      </footer>
    </div>
  );
};
