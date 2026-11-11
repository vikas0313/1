import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.js';

export interface TopBarProps {
  title: string;
  subtitle?: string;
  tableLabel?: string;
  onBack?: () => void;
  showBack?: boolean;
  hasNotification?: boolean;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  tableLabel,
  onBack,
  showBack = false,
  hasNotification = false,
  className = '',
}) => {
  return (
    <header
      className={`sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-[var(--border)]/40 transition-colors no-print ${className}`}
    >
      {/* Left: Rounded-square icon button (16px radius) */}
      <div className="w-11 flex items-center justify-start">
        {showBack && onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="touch-target w-11 h-11 rounded-[16px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:border-[var(--accent)]/50 active:scale-95 shadow-xs transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : tableLabel ? (
          <div
            className="w-11 h-11 rounded-[16px] bg-[var(--surface)] border border-[var(--border)] flex flex-col items-center justify-center text-[var(--text)] shadow-xs"
            title={`Table ${tableLabel}`}
          >
            <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] leading-none font-bold">
              TBL
            </span>
            <span className="text-[13px] font-bold text-[var(--accent-ink)] leading-none mt-0.5">
              {tableLabel}
            </span>
          </div>
        ) : null}
      </div>

      {/* Center: Small centered page title */}
      <div className="flex-1 text-center px-2">
        <h1 className="text-[15px] sm:text-[17px] font-bold text-[var(--text)] truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] sm:text-[12px] text-[var(--text-muted)] truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: Rounded-square white icon button with ThemeToggle and optional tiny peach dot */}
      <div className="w-11 flex items-center justify-end relative">
        <ThemeToggle className="w-11 h-11 rounded-[16px]!" />
        {hasNotification && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[var(--accent)] border-2 border-[var(--surface)] pointer-events-none" />
        )}
      </div>
    </header>
  );
};
