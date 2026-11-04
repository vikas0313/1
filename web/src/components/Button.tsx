import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  let variantStyles = '';

  if (variant === 'primary') {
    variantStyles =
      'bg-[var(--gold-ink)] text-[var(--gold-ink-contrast)] hover:opacity-90 active:scale-[0.99] border border-transparent shadow-sm';
  } else if (variant === 'secondary') {
    variantStyles =
      'bg-transparent text-[var(--text-primary)] border border-[var(--border-gold)] hover:bg-[var(--bg-surface-elevated)] active:scale-[0.99]';
  } else {
    // tertiary
    variantStyles =
      'bg-transparent text-[var(--gold-ink)] border-none hover:underline p-0 h-auto font-normal';
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center font-medium uppercase tracking-wider text-[13px] transition-all rounded-[2px] disabled:opacity-50 disabled:cursor-not-allowed select-none ${
        variant !== 'tertiary' ? 'h-12 px-6' : ''
      } ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

