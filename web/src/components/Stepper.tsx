import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (newValue: number) => void;
  className?: string;
  size?: 'md' | 'sm';
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  min = 1,
  max = 20,
  onChange,
  className = '',
  size = 'md',
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

  const isSmall = size === 'sm';
  const containerHeight = isSmall ? 'h-9' : 'h-11';
  const btnSize = isSmall ? 'w-9 h-9' : 'w-11 h-11';

  return (
    <div
      className={`inline-flex items-center bg-[var(--surface-2)] border border-[var(--border)] rounded-full select-none ${containerHeight} ${className}`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={handleDecrement}
        className={`${btnSize} flex items-center justify-center text-[var(--text)] hover:bg-[var(--surface)] active:scale-[0.92] rounded-full transition-all`}
      >
        <Minus className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
      </button>

      <span className="w-8 text-center text-[15px] tabular-nums font-semibold text-[var(--text)]">
        {value}
      </span>

      <button
        type="button"
        aria-label="Increase quantity"
        onClick={handleIncrement}
        disabled={value >= max}
        className={`${btnSize} flex items-center justify-center text-[var(--text)] hover:bg-[var(--surface)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.92] rounded-full transition-all`}
      >
        <Plus className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
      </button>
    </div>
  );
};


