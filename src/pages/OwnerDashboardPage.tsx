import React, { useState } from 'react';
import { OwnerAuthGuard } from '../components/owner/OwnerAuthGuard';
import { LiveOrdersBoard } from '../components/owner/LiveOrdersBoard';
import { MetricsSummary } from '../components/owner/MetricsSummary';
import { TableQrManager } from '../components/owner/TableQrManager';
import { MenuManager } from '../components/owner/MenuManager';
import { DemoTools } from '../components/owner/DemoTools';
import { DemoBanner } from '../components/common/DemoBanner';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { useOrders } from '../hooks/useOrders';
import { RESTAURANT_CONFIG } from '../../src/config/restaurant.config';
import {
  UtensilsCrossed,
  Flame,
  TrendingUp,
  BookOpen,
  QrCode,
  Dices,
  ExternalLink,
} from 'lucide-react';

import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const OwnerDashboardPage: React.FC = () => {
  return (
    <OwnerAuthGuard>
      <OwnerDashboardContent />
    </OwnerAuthGuard>
  );
};

const OwnerDashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'metrics' | 'menu' | 'qrs' | 'demo'>('orders');
  const { allOrders } = useOrders();
  const { theme, resolvedTheme, setTheme } = useTheme('ritsu-owner-theme', 'light');

  const pendingCount = allOrders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  ).length;

  return (
    <div className="min-h-screen bg-app text-app pb-20 transition-colors duration-200">
      <OfflineBanner />
      <DemoBanner message="DEMO MODE: Changes in this dashboard sync instantly across open customer tabs using BroadcastChannel." />

      {/* Main Owner Header */}
      <header className="bg-surface border-b border-app no-print transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-white flex items-center justify-center font-black shadow-lg">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-app">
                  {RESTAURANT_CONFIG.restaurantName}
                </h1>
                <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold">
                  Management Console
                </span>
              </div>
              <p className="text-xs text-app-muted italic">"{RESTAURANT_CONFIG.tagline}"</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle
              currentTheme={theme}
              resolvedTheme={resolvedTheme}
              onThemeChange={setTheme}
              variant="compact"
            />

            <a
              href="/?table=T1"
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 rounded-xl bg-card hover:bg-surface border border-app text-app text-xs font-semibold flex items-center gap-1.5 transition min-h-[38px]"
            >
              <span>Open Customer Tab (T1)</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent" />
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap min-h-[44px] ${
              activeTab === 'orders'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Flame className="w-4 h-4 text-red-500" />
            <span>Live Orders</span>
            {pendingCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap min-h-[44px] ${
              activeTab === 'metrics'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Sales Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap min-h-[44px] ${
              activeTab === 'menu'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Menu Manager</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qrs')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap min-h-[44px] ${
              activeTab === 'qrs'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            <span>Table QR Codes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap min-h-[44px] ${
              activeTab === 'demo'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Dices className="w-4 h-4 text-emerald-400" />
            <span>Demo Sandbox</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'orders' && (
          <>
            <MetricsSummary orders={allOrders} />
            <LiveOrdersBoard />
          </>
        )}

        {activeTab === 'metrics' && <MetricsSummary orders={allOrders} />}

        {activeTab === 'menu' && <MenuManager />}

        {activeTab === 'qrs' && <TableQrManager />}

        {activeTab === 'demo' && (
          <div className="space-y-6">
            <DemoTools />
            <LiveOrdersBoard />
          </div>
        )}
      </main>
    </div>
  );
};
