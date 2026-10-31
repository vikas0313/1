import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] rounded-[2px] ${className}`}
    />
  );
};

export const MenuRowSkeleton: React.FC = () => {
  return (
    <div className="py-4 border-b border-[var(--border-hairline)] flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Skeleton className="w-6 h-4" />
        <Skeleton className="w-2.5 h-2.5 rounded-full" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="w-3/5 h-4" />
        <Skeleton className="w-2/5 h-3" />
      </div>
      <Skeleton className="w-16 h-8" />
    </div>
  );
};
