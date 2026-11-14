import React, { useState, useEffect } from 'react';
import { apiAdapter } from '../../data/ApiAdapter.js';
import { Button } from '../../components/Button.js';
import { ThemeToggle } from '../../components/ThemeToggle.js';
import { InvalidTablePage } from './InvalidTablePage.js';
import { Phone, UtensilsCrossed, Edit2, Check } from 'lucide-react';

export interface WelcomePageProps {
  onStartOrdering: (tableLabel: string, customerName: string) => void;
}

const AVAILABLE_TABLES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];

export const WelcomePage: React.FC<WelcomePageProps> = ({ onStartOrdering }) => {
  const [tableLabel, setTableLabel] = useState<string>('');
  const [showTablePicker, setShowTablePicker] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [isValidatingTable, setIsValidatingTable] = useState<boolean>(true);
  const [isTableValid, setIsTableValid] = useState<boolean>(true);
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
      // No table param: allow selecting a table directly on WelcomePage
      setTableLabel('T1');
      setShowTablePicker(true);
      setIsTableValid(true);
      setIsValidatingTable(false);
    } else {
      setTableLabel(tableParam.toUpperCase());
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
    }

    apiAdapter
      .getRestaurantSettings()
      .then((s) => setPhone(s.phone))
      .catch(() => {});
  }, []);

  const handleSelectTable = (label: string) => {
    setTableLabel(label);
    setIsTableValid(true);
    sessionStorage.setItem('ritsu_table', label);
    const url = new URL(window.location.href);
    url.searchParams.set('table', label);
    window.history.replaceState({}, '', url.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveTable = tableLabel || 'T1';
    const trimmed = customerName.trim();
    if (trimmed.length < 2) {
      setNameError('Please enter your name (at least 2 characters)');
      return;
    }
    if (trimmed.length > 40) {
      setNameError('Name cannot exceed 40 characters');
      return;
    }

    sessionStorage.setItem('ritsu_table', effectiveTable);
    sessionStorage.setItem('ritsu_customer_name', trimmed);
    onStartOrdering(effectiveTable, trimmed);
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
    return (
      <InvalidTablePage
        onSelectTable={(newTable) => {
          handleSelectTable(newTable);
          setShowTablePicker(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Central Warm Card */}
      <div className="w-full max-w-[500px] warm-card p-6 sm:p-8 flex flex-col justify-between my-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span className="text-[13px] font-semibold">Table {tableLabel || 'T1'}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTablePicker(!showTablePicker)}
              className="touch-target px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-ink)] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>{showTablePicker ? 'Done' : 'Change'}</span>
            </button>
          </div>
          <ThemeToggle />
        </header>

        <main className="text-center py-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent-ink)] flex items-center justify-center shadow-xs">
            <UtensilsCrossed className="w-8 h-8" />
          </div>

          <h1 className="text-[26px] sm:text-[32px] font-bold text-[var(--text)] tracking-tight leading-tight mb-2">
            Welcome to Ritsu
          </h1>

          <p className="text-[14px] sm:text-[15px] text-[var(--text-muted)] mb-6 leading-relaxed max-w-xs mx-auto">
            Indo-Chinese street kitchen. Freshly tossed and served hot to your table.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Table Selection Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[13px] font-semibold text-[var(--text)]">
                  Your Table
                </label>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Selected: <strong className="text-[var(--accent-ink)] font-bold">Table {tableLabel || 'T1'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {AVAILABLE_TABLES.map((tbl) => {
                  const isSelected = (tableLabel || 'T1') === tbl;
                  return (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => handleSelectTable(tbl)}
                      className={`touch-target h-12 rounded-xl text-[13px] font-bold flex flex-col items-center justify-center border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-[var(--accent)] text-[var(--on-accent)] border-[var(--accent)] shadow-xs scale-102 font-extrabold ring-2 ring-[var(--accent)]/30'
                          : 'bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent)]/50'
                      }`}
                    >
                      <span className="text-[9px] uppercase font-medium opacity-80 leading-none">Table</span>
                      <span className="text-[15px] leading-tight mt-0.5">{tbl.replace('T', '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

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

            <Button type="submit" variant="primary" size="lg" className="w-full mt-3 font-semibold">
              Start ordering at Table {tableLabel || 'T1'}
            </Button>
          </form>
        </main>

        <footer className="text-center pt-5 mt-5 border-t border-[var(--border)]">
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
