import React, { useState } from 'react';
import { ThemeToggle } from '../../components/ThemeToggle.js';
import { AlertBanner } from '../../components/AlertBanner.js';
import { 
  ClipboardList, 
  UtensilsCrossed, 
  QrCode, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu as MenuIcon, 
  X,
  Wifi,
  WifiOff
} from 'lucide-react';

export type OwnerTab = 'orders' | 'menu' | 'tables' | 'sales' | 'settings';

interface OwnerLayoutProps {
  currentTab: OwnerTab;
  onTabChange: (tab: OwnerTab) => void;
  sseStatus: 'connected' | 'reconnecting' | 'disconnected';
  pendingOrdersCount?: number;
  children: React.ReactNode;
}

export const OwnerLayout: React.FC<OwnerLayoutProps> = ({
  currentTab,
  onTabChange,
  sseStatus,
  pendingOrdersCount = 0,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/owner/logout', { method: 'POST' });
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  const navItems: { id: OwnerTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'orders', label: 'Orders Kanban', icon: ClipboardList },
    { id: 'menu', label: 'Menu Manager', icon: UtensilsCrossed },
    { id: 'tables', label: 'Tables & QR', icon: QrCode },
    { id: 'sales', label: 'Sales & Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col">
      {/* 1. Global Alert Banner */}
      <AlertBanner />

      {/* 2. Top Header */}
      <header className="h-14 border-b border-[var(--border-default)] bg-[var(--bg-card)] px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>

          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-lg text-[var(--gold-ink)] tracking-wider">
              RITSU
            </span>
            <span className="text-xs uppercase font-semibold text-[var(--text-secondary)] tracking-widest hidden sm:inline">
              Management
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* SSE Connection Status */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {sseStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live</span>
              </span>
            ) : sseStatus === 'reconnecting' ? (
              <span className="inline-flex items-center gap-1 text-amber-500 animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reconnecting</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-500">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            )}
          </div>

          <ThemeToggle />

          <button
            onClick={handleLogout}
            className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
            title="Sign out of owner dashboard"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-60 border-r border-[var(--border-default)] bg-[var(--bg-surface)] p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors relative ${
                  active
                    ? 'bg-[var(--gold-ink)]/10 text-[var(--gold-ink)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--gold-ink)] rounded-r" />
                  )}
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>

                {item.id === 'orders' && pendingOrdersCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[var(--gold-ink)] text-[var(--bg-canvas)] font-bold">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Mobile Slide-over Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-[80vw] bg-[var(--bg-surface)] border-r border-[var(--border-default)] p-4 flex flex-col justify-between z-50">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3 px-2">
                  Navigation
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-3 text-xs font-medium uppercase tracking-wider rounded transition-colors ${
                        active
                          ? 'bg-[var(--gold-ink)]/15 text-[var(--gold-ink)] font-bold'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.id === 'orders' && pendingOrdersCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[var(--gold-ink)] text-[var(--bg-canvas)] font-bold">
                          {pendingOrdersCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 font-medium hover:bg-red-500/10 rounded transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

