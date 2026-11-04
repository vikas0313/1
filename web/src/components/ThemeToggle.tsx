import React, { useEffect, useState } from 'react';

export interface ThemeToggleProps {
  isOwner?: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isOwner = false }) => {
  const storageKey = isOwner ? 'ritsu-theme-owner' : 'ritsu-theme-customer';
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const stored = (localStorage.getItem(storageKey) as ThemeMode) || 'system';
    setMode(stored);
    applyTheme(stored);
  }, [storageKey]);

  const applyTheme = (targetMode: ThemeMode) => {
    let effectiveTheme: 'light' | 'dark' = 'light';
    if (targetMode === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effectiveTheme = targetMode;
    }

    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.style.colorScheme = effectiveTheme;
  };

  const cycleTheme = () => {
    let next: ThemeMode = 'light';
    if (mode === 'light') next = 'dark';
    else if (mode === 'dark') next = 'system';
    else next = 'light';

    setMode(next);
    localStorage.setItem(storageKey, next);
    applyTheme(next);
  };

  const displayText = mode === 'system' ? 'SYSTEM' : mode === 'dark' ? 'DARK' : 'LIGHT';

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="text-[12px] uppercase tracking-wider font-semibold text-[var(--gold-ink)] hover:underline px-2 py-1 select-none focus:outline-none"
      title="Click to toggle theme: Light / Dark / System"
    >
      THEME: {displayText}
    </button>
  );
};

