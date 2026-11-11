import React, { useState, useEffect } from 'react';
import { formatPaise } from '@ritsu/shared';

interface SummaryData {
  period: 'today' | '7days' | 'all';
  totalSalesPaise: number;
  unpaidPaise: number;
  orderCount: number;
  averageOrderValuePaise: number;
}

export const SummaryStrip: React.FC = () => {
  const [period, setPeriod] = useState<'today' | '7days' | 'all'>('today');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async (p: 'today' | '7days' | 'all') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/summary?period=${p}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(period);
  }, [period]);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sm:p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <h2 className="text-xs uppercase font-bold tracking-widest text-[var(--gold-ink)]">
            Sales & Order Metrics
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] font-serif italic">
            Calculated in Asia/Kolkata IST
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="inline-flex rounded border border-[var(--border-default)] p-0.5 bg-[var(--bg-canvas)]">
          {(['today', '7days', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[11px] uppercase tracking-wider font-semibold transition-colors ${
                period === p
                  ? 'bg-[var(--gold-ink)] text-[var(--bg-canvas)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {p === 'today' ? 'Today' : p === '7days' ? '7 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)]">
        {/* Metric 1: Total Paid Sales */}
        <div className="pt-2 sm:pt-0 sm:px-3 first:px-0">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-secondary)]">
            Paid Sales
          </div>
          <div className="font-serif text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5 tabular-nums">
            {loading ? '—' : formatPaise(summary?.totalSalesPaise || 0)}
          </div>
        </div>

        {/* Metric 2: Unpaid Amount */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-secondary)]">
            Unpaid Orders
          </div>
          <div className="font-serif text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
            {loading ? '—' : formatPaise(summary?.unpaidPaise || 0)}
          </div>
        </div>

        {/* Metric 3: Total Orders */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-secondary)]">
            Order Count
          </div>
          <div className="font-serif text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5 tabular-nums">
            {loading ? '—' : (summary?.orderCount ?? 0)}
          </div>
        </div>

        {/* Metric 4: Average Order Value */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-secondary)]">
            Avg Order Value
          </div>
          <div className="font-serif text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5 tabular-nums">
            {loading ? '—' : formatPaise(summary?.averageOrderValuePaise || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

