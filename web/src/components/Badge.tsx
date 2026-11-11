import React from 'react';

export interface BadgeProps {
  variant?: 'gold' | 'accent' | 'veg' | 'non-veg' | 'muted' | 'status';
  status?: 'pending' | 'preparing' | 'ready' | 'complete' | 'cancelled';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'accent',
  status,
  children,
  className = '',
}) => {
  let styleClasses = 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]';

  if (variant === 'gold' || variant === 'accent') {
    styleClasses = 'bg-[var(--accent)]/15 text-[var(--accent-ink)] border-[var(--accent)]/30 font-semibold';
  } else if (variant === 'veg') {
    styleClasses = 'bg-emerald-50 text-[var(--veg)] border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60 font-medium';
  } else if (variant === 'non-veg') {
    styleClasses = 'bg-red-50 text-[var(--nonveg)] border-red-200 dark:bg-red-950/40 dark:border-red-800/60 font-medium';
  } else if (variant === 'status' && status) {
    if (status === 'pending') {
      styleClasses = 'bg-amber-50 text-[var(--warning)] border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 font-medium';
    } else if (status === 'preparing') {
      styleClasses = 'bg-[var(--accent)]/20 text-[var(--accent-ink)] border-[var(--accent)]/40 font-semibold';
    } else if (status === 'ready') {
      styleClasses = 'bg-emerald-50 text-[var(--success)] border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 font-medium';
    } else if (status === 'complete') {
      styleClasses = 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)] font-medium';
    } else if (status === 'cancelled') {
      styleClasses = 'bg-red-50 text-[var(--danger)] border-red-200 dark:bg-red-950/40 dark:border-red-800 font-medium';
    }
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 text-[12px] font-medium border rounded-full select-none ${styleClasses} ${className}`}
    >
      {children}
    </span>
  );
};


