import React from 'react';
import { Category } from '../../types/menu';
import { Search, X } from 'lucide-react';

interface MenuCategoryTabsProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dietFilter: 'all' | 'veg' | 'non_veg';
  onDietFilterChange: (filter: 'all' | 'veg' | 'non_veg') => void;
}

export const MenuCategoryTabs: React.FC<MenuCategoryTabsProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  dietFilter,
  onDietFilterChange,
}) => {
  return (
    <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-app shadow-md transition-colors duration-200">
      {/* Search and Veg/Non-Veg Filters */}
      <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
        <div className="relative">
          <Search className="w-4 h-4 text-app-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search 165 dishes (e.g. Hakka, Manchurian, Momo)..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-card border border-app text-sm text-app placeholder-neutral-500 focus:outline-none focus:border-primary min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-app-muted hover:text-app rounded-full min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Diet Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => onDietFilterChange('all')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition whitespace-nowrap ${
              dietFilter === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-card text-app-muted border border-app hover:text-app'
            }`}
          >
            All Dishes
          </button>
          <button
            type="button"
            onClick={() => onDietFilterChange('veg')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 whitespace-nowrap ${
              dietFilter === 'veg'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-neutral-900 text-emerald-400 border border-neutral-800 hover:border-emerald-800/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Pure Veg</span>
          </button>
          <button
            type="button"
            onClick={() => onDietFilterChange('non_veg')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 whitespace-nowrap ${
              dietFilter === 'non_veg'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-neutral-900 text-rose-400 border border-neutral-800 hover:border-rose-900/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Non-Veg</span>
          </button>
        </div>
      </div>

      {/* Categories Horizontal Scroll Bar */}
      <nav aria-label="Categories" className="flex items-center gap-1.5 px-4 pb-2.5 overflow-x-auto no-scrollbar scroll-smooth">
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-card text-app hover:bg-surface border border-app'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
