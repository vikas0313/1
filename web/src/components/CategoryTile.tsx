import React from 'react';
import type { Category } from '@ritsu/shared';
import {
  Utensils,
  Coffee,
  Soup,
  Pizza,
  Flame,
  Salad,
  Sparkles,
  Sandwich,
  Wine,
} from 'lucide-react';

export interface CategoryTileProps {
  category: Category;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export const CategoryTile: React.FC<CategoryTileProps> = ({
  category,
  isActive,
  onClick,
  className = '',
}) => {
  // Select a fitting icon for Indian / Indo-Chinese / Snack items
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('soup')) return <Soup className="w-6 h-6" />;
    if (lower.includes('noodle') || lower.includes('chowmein') || lower.includes('pasta'))
      return <Utensils className="w-6 h-6" />;
    if (lower.includes('rice') || lower.includes('biryani') || lower.includes('fried'))
      return <Flame className="w-6 h-6" />;
    if (lower.includes('manchurian') || lower.includes('chilli') || lower.includes('paneer'))
      return <Sparkles className="w-6 h-6" />;
    if (lower.includes('burger') || lower.includes('sandwich') || lower.includes('roll'))
      return <Sandwich className="w-6 h-6" />;
    if (lower.includes('pizza')) return <Pizza className="w-6 h-6" />;
    if (lower.includes('drink') || lower.includes('shake') || lower.includes('beverage'))
      return <Wine className="w-6 h-6" />;
    if (lower.includes('tea') || lower.includes('coffee')) return <Coffee className="w-6 h-6" />;
    if (lower.includes('salad') || lower.includes('starter') || lower.includes('veg'))
      return <Salad className="w-6 h-6" />;
    return <Utensils className="w-6 h-6" />;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      className={`touch-target flex flex-col items-center justify-center p-3 rounded-[20px] transition-all select-none shrink-0 min-w-[84px] h-[92px] ${
        isActive
          ? 'bg-[var(--surface)] border-2 border-[var(--accent)] shadow-md text-[var(--accent-ink)]'
          : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/50 hover:text-[var(--text)]'
      } ${className}`}
    >
      <div
        className={`w-10 h-10 rounded-[14px] flex items-center justify-center mb-1.5 transition-colors ${
          isActive
            ? 'bg-[var(--accent)]/20 text-[var(--accent-ink)]'
            : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
        }`}
      >
        {getCategoryIcon(category.name)}
      </div>
      <span
        className={`text-[12px] text-center leading-tight truncate w-full px-0.5 ${
          isActive ? 'font-bold text-[var(--accent-ink)]' : 'font-medium'
        }`}
      >
        {category.name}
      </span>
    </button>
  );
};
