import React, { useRef } from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTabClick = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    onSelectTab(id);
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <div
      role="tablist"
      aria-label="Categories"
      ref={containerRef}
      className={`flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] sticky top-0 z-20 py-1 px-4 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={(e) => handleTabClick(tab.id, e)}
            className={`whitespace-nowrap px-3.5 py-2.5 text-[13px] uppercase tracking-wider font-medium transition-all relative shrink-0 select-none ${
              isActive
                ? 'text-[var(--gold-ink)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] text-[var(--text-tertiary)]">
                {tab.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-gold)] transition-all" />
            )}
          </button>
        );
      })}
    </div>
  );
};

