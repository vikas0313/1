import React from 'react';

interface DietBadgeProps {
  isVeg: boolean;
  size?: 'sm' | 'md';
}

export const DietBadge: React.FC<DietBadgeProps> = ({ isVeg, size = 'sm' }) => {
  const containerClass =
    size === 'sm'
      ? 'w-4 h-4 border p-0.5'
      : 'w-5 h-5 border-2 p-0.5';

  const dotClass = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm bg-neutral-900 flex-shrink-0 ${containerClass} ${
        isVeg ? 'border-emerald-500' : 'border-rose-600'
      }`}
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      aria-label={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
    >
      <span
        className={`rounded-full ${dotClass} ${
          isVeg ? 'bg-emerald-500' : 'bg-rose-600'
        }`}
      />
    </span>
  );
};
