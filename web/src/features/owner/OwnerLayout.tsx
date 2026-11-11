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
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'tables', label: 'Tables & QR', icon: QrCode },
    { id: 'sales', label: 'Sales', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* 1. Global Alert Banner */}
      <AlertBanner />

      {/* 2. Top Header */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden touch-target w-11 h-11 rounded-[16px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[18px] text-[var(--text)] tracking-tight">
              Ritsu Food Corner
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent-ink)] border border-[var(--accent)]/30">
              Kitchen & Ops
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* SSE Connection Status */}
          <div className="flex items-center gap-1.5 text-[12px] font-medium">
            {sseStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--success)]">
                <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                <span className="hidden sm:inline">Live</span>
              </span>
            ) : sseStatus === 'reconnecting' ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--warning)] animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reconnecting</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[var(--danger)]">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            )}
          </div>

          <ThemeToggle isOwner />

          <button
            onClick={handleLogout}
            className="touch-target w-10 h-10 rounded-[16px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
            title="Sign out of owner dashboard"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. Main Workspace with Charcoal Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Charcoal bar per directive) */}
        <aside className="hidden md:flex flex-col w-60 border-r border-[var(--border)]/20 bg-[var(--nav)] text-[var(--on-nav)] p-4 justify-between select-none">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`touch-target w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-[14px] font-medium transition-all relative ${
                    active
                      ? 'bg-[var(--surface-2)]/10 text-[var(--accent)] font-bold'
                      : 'text-[var(--on-nav)]/70 hover:bg-[var(--surface-2)]/5 hover:text-[var(--on-nav)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>

                  {item.id === 'orders' && pendingOrdersCount > 0 && (
                    <span className="min-w-5 h-5 px-1.5 text-[11px] rounded-full bg-[var(--accent)] text-[var(--on-accent)] font-bold flex items-center justify-center">
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[var(--border)]/20 text-[12px] text-[var(--on-nav)]/60">
            <span>Ritsu POS v1.0</span>
          </div>
        </aside>

        {/* Mobile Slide-over Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-[80%] bg-[var(--nav)] text-[var(--on-nav)] p-4 flex flex-col justify-between shadow-2xl z-50">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]/20 mb-3">
                  <span className="font-bold text-[16px]">Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-[var(--on-nav)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
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
                      className={`touch-target w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-[14px] font-medium transition-all ${
                        active
                          ? 'bg-[var(--surface-2)]/10 text-[var(--accent)] font-bold'
                          : 'text-[var(--on-nav)]/70 hover:text-[var(--on-nav)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.id === 'orders' && pendingOrdersCount > 0 && (
                        <span className="min-w-5 h-5 px-1.5 text-[11px] rounded-full bg-[var(--accent)] text-[var(--on-accent)] font-bold flex items-center justify-center">
                          {pendingOrdersCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[var(--border)]/20">
                <ThemeToggle isOwner showLabel className="w-full justify-start text-[var(--on-nav)]" />
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--bg)]">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (when on mobile screen) */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-[var(--nav)] text-[var(--on-nav)] rounded-[26px] p-2 flex items-center justify-around shadow-xl border border-[var(--border)]/20 backdrop-blur-md">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`touch-target flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
                active
                  ? 'text-[var(--accent)] font-bold'
                  : 'text-[var(--on-nav)]/60 hover:text-[var(--on-nav)]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
              {item.id === 'orders' && pendingOrdersCount > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};


