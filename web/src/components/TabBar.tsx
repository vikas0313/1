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
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md sticky top-0 z-20 py-2.5 px-4 ${className}`}
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
            className={`touch-target whitespace-nowrap px-4 py-2 text-[14px] font-medium rounded-full transition-all relative shrink-0 select-none ${
              isActive
                ? 'bg-[var(--accent)] text-[var(--on-accent)] font-bold shadow-xs'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)]/40'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`ml-1.5 text-[11px] px-2 py-0.5 rounded-full ${
                isActive
                  ? 'bg-[var(--on-accent)] text-[var(--accent)]'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

