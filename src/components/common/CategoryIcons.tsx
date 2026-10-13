import React from 'react';
import {
  Utensils,
  Soup,
  Flame,
  Coffee,
  Sparkles,
  Egg,
} from 'lucide-react';

interface CategoryIconProps {
  categoryId: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ categoryId, className = 'w-4 h-4' }) => {
  switch (categoryId) {
    case 'cat-1': // Starters (Non-Veg)
      return <Flame className={`${className} text-rose-500`} />;
    case 'cat-2': // Veg Starters
      return <Sparkles className={`${className} text-emerald-500`} />;
    case 'cat-3': // Noodles - Veg
    case 'cat-4': // Noodles - Non-Veg
      return <Soup className={`${className} text-amber-500`} />;
    case 'cat-5': // Veg Rice
    case 'cat-6': // Non-Veg Rice
      return <Egg className={`${className} text-amber-400`} />;
    case 'cat-7': // Veg Curries
    case 'cat-8': // Non-Veg Curries
      return <Utensils className={`${className} text-orange-400`} />;
    case 'cat-9': // Momos Veg
    case 'cat-10': // Momos Chicken
    case 'cat-11': // Momos Paneer
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Dumpling shape */}
          <path d="M4 14c0 4 4 6 8 6s8-2 8-6a8 8 0 0 0-16 0Z" />
          <path d="M7 13c1-2 2-3 5-3s4 1 5 3" />
          <path d="M12 10v4" />
        </svg>
      );
    case 'cat-12': // Biryani Veg
    case 'cat-13': // Biryani Non-Veg
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Handi pot */}
          <path d="M6 9h12v1a6 6 0 0 1-12 0Z" />
          <path d="M5 9a3 3 0 0 0 0-3h14a3 3 0 0 0 0 3" />
          <circle cx="12" cy="4" r="1" />
        </svg>
      );
    case 'cat-14': // Soft Drink
      return <Coffee className={`${className} text-blue-400`} />;
    default:
      return <Utensils className={className} />;
  }
};
