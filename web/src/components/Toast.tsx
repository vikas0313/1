import React, { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'warning' | 'error';
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  durationMs = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  let borderClass = 'border-[var(--border-gold)]';
  if (type === 'error') borderClass = 'border-red-500';
  if (type === 'warning') borderClass = 'border-amber-500';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-[var(--bg-surface)] text-[var(--text-primary)] border-2 ${borderClass} shadow-lg py-3 px-4 rounded-[2px] flex items-center justify-between gap-3 text-[13px] font-medium tracking-wide animate-in fade-in slide-in-from-top-4`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-base px-1"
      >
        ×
      </button>
    </div>
  );
};

