import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ThemePreference, ResolvedTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  currentTheme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  onThemeChange: (theme: ThemePreference) => void;
  variant?: 'compact' | 'segmented';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  currentTheme,
  resolvedTheme,
  onThemeChange,
  variant = 'compact',
}) => {
  if (variant === 'compact') {
    // Cycles: Light -> Dark -> System -> Light
    const handleCycle = () => {
      if (currentTheme === 'light') onThemeChange('dark');
      else if (currentTheme === 'dark') onThemeChange('system');
      else onThemeChange('light');
    };

    return (
      <button
        type="button"
        onClick={handleCycle}
        className="p-2 rounded-xl bg-surface border border-app hover:border-neutral-500 text-app transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
        title={`Theme: ${currentTheme} (click to cycle)`}
        aria-label={`Current theme is ${currentTheme}. Click to cycle theme`}
      >
        {currentTheme === 'system' ? (
          <Monitor className="w-4 h-4 text-accent" />
        ) : resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-amber-300" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center p-1 rounded-xl bg-card border border-app gap-1">
      <button
        type="button"
        onClick={() => onThemeChange('light')}
        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer min-h-[36px] ${
          currentTheme === 'light'
            ? 'bg-primary text-white shadow-xs'
            : 'text-app-muted hover:text-app'
        }`}
        title="Light theme"
      >
        <Sun className="w-3.5 h-3.5" />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => onThemeChange('dark')}
        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer min-h-[36px] ${
          currentTheme === 'dark'
            ? 'bg-primary text-white shadow-xs'
            : 'text-app-muted hover:text-app'
        }`}
        title="Dark theme"
      >
        <Moon className="w-3.5 h-3.5" />
        <span>Dark</span>
      </button>
      <button
        type="button"
        onClick={() => onThemeChange('system')}
        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer min-h-[36px] ${
          currentTheme === 'system'
            ? 'bg-primary text-white shadow-xs'
            : 'text-app-muted hover:text-app'
        }`}
        title="Follow system OS setting"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>Auto</span>
      </button>
    </div>
  );
};
