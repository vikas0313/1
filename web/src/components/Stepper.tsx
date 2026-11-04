import React from 'react';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (newValue: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  min = 1,
  max = 20,
  onChange,
  className = '',
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value > min) {
      onChange(value - 1);
    } else {
      onChange(0); // Removing or reducing below min
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div
      className={`inline-flex items-center border border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-[2px] h-9 select-none ${className}`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={handleDecrement}
        className="w-9 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--gold-ink)] hover:bg-[var(--bg-surface-elevated)] transition-colors text-base"
      >
        −
      </button>

      <span className="w-8 text-center text-[14px] font-semibold text-[var(--text-primary)]">
        {value}
      </span>

      <button
        type="button"
        aria-label="Increase quantity"
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-9 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--gold-ink)] hover:bg-[var(--bg-surface-elevated)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base"
      >
        +
      </button>
    </div>
  );
};

