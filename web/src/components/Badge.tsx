import React from 'react';

export interface BadgeProps {
  variant?: 'gold' | 'veg' | 'non-veg' | 'muted' | 'status';
  status?: 'pending' | 'preparing' | 'ready' | 'complete' | 'cancelled';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'gold',
  status,
  children,
  className = '',
}) => {
  let styleClasses = 'bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border-[var(--border-hairline)]';

  if (variant === 'gold') {
    styleClasses = 'bg-[var(--bg-surface-elevated)] text-[var(--gold-ink)] border-[var(--border-gold)] font-semibold';
  } else if (variant === 'veg') {
    styleClasses = 'bg-emerald-50 text-[var(--veg-dot)] border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800';
  } else if (variant === 'non-veg') {
    styleClasses = 'bg-red-50 text-[var(--non-veg-dot)] border-red-300 dark:bg-red-950/40 dark:border-red-800';
  } else if (variant === 'status' && status) {
    if (status === 'pending') {
      styleClasses = 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    } else if (status === 'preparing') {
      styleClasses = 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    } else if (status === 'ready') {
      styleClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    } else if (status === 'complete') {
      styleClasses = 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    } else if (status === 'cancelled') {
      styleClasses = 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
    }
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] uppercase tracking-wider font-medium border rounded-[2px] select-none ${styleClasses} ${className}`}
    >
      {children}
    </span>
  );
};

