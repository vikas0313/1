import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-[var(--surface-2)] rounded-xl ${className}`}
    />
  );
};

export const MenuRowSkeleton: React.FC = () => {
  return (
    <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[24px] flex items-center justify-between gap-4 mb-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-20 h-3" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-14 h-8 rounded-full" />
        <Skeleton className="w-20 h-10 rounded-full" />
      </div>
    </div>
  );
};


