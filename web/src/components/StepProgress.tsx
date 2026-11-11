import React from 'react';

export interface StepProgressProps {
  currentStep: number; // 1 to 4
  totalSteps?: number;
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps = 4,
  className = '',
}) => {
  const steps = [
    { num: 1, label: 'Placed' },
    { num: 2, label: 'Preparing' },
    { num: 3, label: 'Ready' },
    { num: 4, label: 'Completed' },
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* Chunky rounded blocks */}
      <div className="flex items-center gap-2 w-full mb-3">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isFilled = isDone || isCurrent;

          return (
            <div
              key={stepNum}
              className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
                isFilled
                  ? 'bg-[var(--accent)] shadow-xs'
                  : 'bg-[var(--surface-2)] border border-[var(--border)]/40'
              }`}
            />
          );
        })}
      </div>

      {/* Step labels */}
      <div className="flex justify-between items-center text-[12px] font-medium text-[var(--text-muted)]">
        {steps.map((s) => {
          const isDone = s.num < currentStep;
          const isCurrent = s.num === currentStep;

          return (
            <span
              key={s.num}
              className={
                isCurrent
                  ? 'text-[var(--accent-ink)] font-bold'
                  : isDone
                  ? 'text-[var(--text)] font-semibold'
                  : 'text-[var(--text-muted)]'
              }
            >
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};
