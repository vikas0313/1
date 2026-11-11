import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export interface ThemeToggleProps {
  isOwner?: boolean;
  className?: string;
  showLabel?: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isOwner = false,
  className = '',
  showLabel = false,
}) => {
  const storageKey = isOwner ? 'ritsu-theme-owner' : 'ritsu-theme-customer';
  const defaultMode: ThemeMode = isOwner ? 'light' : 'system';
  const [mode, setMode] = useState<ThemeMode>(defaultMode);

  useEffect(() => {
    const stored = (localStorage.getItem(storageKey) as ThemeMode) || defaultMode;
    setMode(stored);
    applyTheme(stored);
  }, [storageKey, defaultMode]);

  const applyTheme = (targetMode: ThemeMode) => {
    let effectiveTheme: 'light' | 'dark' = 'light';
    if (targetMode === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effectiveTheme = targetMode;
    }

    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.style.colorScheme = effectiveTheme;

    // Update theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#171514' : '#F3EFE7');
    }
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

  const getLabel = () => {
    if (mode === 'system') return 'System';
    if (mode === 'dark') return 'Dark';
    return 'Light';
  };

  const renderIcon = () => {
    if (mode === 'dark') return <Moon className="w-4 h-4 text-[var(--accent)]" />;
    if (mode === 'light') return <Sun className="w-4 h-4 text-[var(--accent-ink)]" />;
    return <Monitor className="w-4 h-4 text-[var(--text-muted)]" />;
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`touch-target inline-flex items-center justify-center gap-2 rounded-[16px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]/50 active:scale-[0.97] transition-all p-2.5 shadow-xs select-none ${className}`}
      title={`Theme: ${getLabel()} (Click to toggle)`}
      aria-label={`Current theme is ${getLabel()}. Click to toggle between Light, Dark, and System.`}
    >
      {renderIcon()}
      {showLabel && (
        <span className="text-[13px] font-medium text-[var(--text)]">{getLabel()}</span>
      )}
    </button>
  );
};


