import React from 'react';

export interface SizeLabelProps {
  label: string;
  pricePaise: number;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const SizeLabel: React.FC<SizeLabelProps> = ({
  label,
  pricePaise,
  isSelected = false,
  disabled = false,
  onClick,
}) => {
  const rupees = pricePaise / 100;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`touch-target inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-full transition-all border select-none ${
        disabled
          ? 'opacity-40 border-[var(--border)] cursor-not-allowed text-[var(--text-muted)]'
          : isSelected
          ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent-ink)] font-semibold shadow-xs'
          : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]/50'
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums font-semibold">₹{rupees}</span>
    </button>
  );
};


