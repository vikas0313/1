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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] rounded-[2px] transition-all border select-none ${
        disabled
          ? 'opacity-40 border-[var(--border-hairline)] cursor-not-allowed text-[var(--text-tertiary)]'
          : isSelected
          ? 'border-[var(--border-gold)] bg-[var(--bg-surface-elevated)] text-[var(--gold-ink)] font-semibold shadow-xs'
          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-gold)]'
      }`}
    >
      <span>{label}</span>
      <span className="font-serif font-normal text-[var(--text-primary)]">₹{rupees}</span>
    </button>
  );
};
