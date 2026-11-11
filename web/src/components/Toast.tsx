import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

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

  let icon = <CheckCircle2 className="w-5 h-5 text-[var(--success)] shrink-0" />;
  let borderClass = 'border-[var(--border)]';
  if (type === 'error') {
    icon = <XCircle className="w-5 h-5 text-[var(--danger)] shrink-0" />;
    borderClass = 'border-red-200 dark:border-red-900';
  } else if (type === 'warning') {
    icon = <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0" />;
    borderClass = 'border-amber-200 dark:border-amber-900';
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-[var(--surface)] text-[var(--text)] border ${borderClass} shadow-lg py-3 px-4 rounded-2xl flex items-center justify-between gap-3 text-[14px] font-medium transition-all animate-in fade-in slide-in-from-top-3`}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};


