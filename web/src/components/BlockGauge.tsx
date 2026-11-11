import React from 'react';

export interface BlockGaugeProps {
  totalBlocks?: number;
  filledBlocks: number;
  bigValue: string;
  peachCaption: string;
  mutedLabel?: string;
  className?: string;
}

export const BlockGauge: React.FC<BlockGaugeProps> = ({
  totalBlocks = 10,
  filledBlocks,
  bigValue,
  peachCaption,
  mutedLabel,
  className = '',
}) => {
  const blocks = Array.from({ length: totalBlocks }, (_, i) => i < filledBlocks);

  return (
    <div className={`p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-sm ${className}`}>
      {mutedLabel && (
        <div className="text-[12px] font-medium text-[var(--text-muted)] mb-1">
          {mutedLabel}
        </div>
      )}

      <div className="text-[32px] sm:text-[36px] font-bold tabular-nums text-[var(--text)] tracking-tight leading-none mb-1">
        {bigValue}
      </div>

      <div className="text-[13px] font-semibold text-[var(--accent-ink)] mb-3">
        {peachCaption}
      </div>

      {/* Curved row of chunky rounded blocks */}
      <div className="flex items-center gap-1.5 w-full">
        {blocks.map((isFilled, idx) => (
          <div
            key={idx}
            className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
              isFilled
                ? 'bg-[var(--accent)] shadow-xs'
                : 'bg-[var(--surface-2)] border border-[var(--border)]/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
