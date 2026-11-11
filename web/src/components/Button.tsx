import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'peach' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  let sizeStyles = 'h-11 px-5 text-[15px] rounded-full';
  if (size === 'sm') {
    sizeStyles = 'h-9 px-3.5 text-[13px] rounded-full';
  } else if (size === 'lg') {
    sizeStyles = 'h-13 px-6 text-[16px] rounded-full font-semibold';
  }

  let variantStyles = '';

  if (variant === 'primary') {
    // In light: charcoal nav fill with light text.
    // In dark: peach fill with dark text (per Warm Peach directive).
    variantStyles =
      'bg-[var(--nav)] text-[var(--on-nav)] dark:bg-[var(--accent)] dark:text-[var(--on-accent)] hover:opacity-90 active:scale-[0.98] shadow-sm';
  } else if (variant === 'peach') {
    // Explicit Peach fill: text is ALWAYS var(--on-accent) (#1F1F1F)
    variantStyles =
      'bg-[var(--accent)] text-[var(--on-accent)] hover:opacity-90 active:scale-[0.98] shadow-sm font-semibold';
  } else if (variant === 'secondary') {
    variantStyles =
      'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-2)] active:scale-[0.98] shadow-xs';
  } else if (variant === 'danger') {
    variantStyles =
      'bg-red-50 text-[var(--danger)] border border-red-200 dark:bg-red-950/40 dark:border-red-800 hover:bg-red-100 active:scale-[0.98]';
  } else {
    // tertiary
    sizeStyles = 'h-auto p-0 text-[14px]';
    variantStyles =
      'bg-transparent text-[var(--accent-ink)] hover:underline active:opacity-75 font-medium';
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`touch-target relative inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed select-none ${sizeStyles} ${variantStyles} ${className}`}
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

