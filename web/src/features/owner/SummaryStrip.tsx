import React, { useState, useEffect } from 'react';
import { formatPaise } from '@ritsu/shared';
import { BlockGauge } from '../../components/BlockGauge.js';

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

  // Daily target default ₹15,000 (1500000 paise)
  const dailyTargetPaise = 1500000;

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

  const paidSales = summary?.totalSalesPaise || 0;
  const targetPercent = Math.min(100, Math.round((paidSales / dailyTargetPaise) * 100));
  const filledBlocks = Math.min(10, Math.max(0, Math.round((targetPercent / 100) * 10)));

  return (
    <div className="mb-6 space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--text)]">
            Sales overview
          </h2>
          <p className="text-[12px] text-[var(--text-muted)]">
            Times calculated in Asia/Kolkata
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="inline-flex rounded-full border border-[var(--border)] p-1 bg-[var(--surface-2)]">
          {(['today', '7days', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`touch-target px-4 py-1.5 text-[13px] rounded-full font-medium transition-all ${
                period === p
                  ? 'bg-[var(--surface)] text-[var(--text)] font-bold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {p === 'today' ? 'Today' : p === '7days' ? '7 days' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: BlockGauge + 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* BlockGauge for Paid Sales */}
        <div className="md:col-span-2">
          <BlockGauge
            totalBlocks={10}
            filledBlocks={filledBlocks}
            bigValue={loading ? '—' : formatPaise(paidSales, false)}
            peachCaption={`Paid sales · ${targetPercent}% of daily target (₹${dailyTargetPaise / 100})`}
            mutedLabel="Target progress"
          />
        </div>

        {/* Unpaid Orders Card */}
        <div className="warm-card p-4 flex flex-col justify-between">
          <div className="text-[12px] font-medium text-[var(--text-muted)]">
            Unpaid orders
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold tabular-nums text-[var(--warning)] tracking-tight leading-tight my-1">
            {loading ? '—' : formatPaise(summary?.unpaidPaise || 0, false)}
          </div>
          <div className="text-[12px] font-medium text-[var(--text-muted)]">
            Pending at counter
          </div>
        </div>

        {/* Orders & AOV Card */}
        <div className="warm-card p-4 flex flex-col justify-between">
          <div className="text-[12px] font-medium text-[var(--text-muted)]">
            Order count & AOV
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold tabular-nums text-[var(--text)] tracking-tight leading-tight my-1">
            {loading ? '—' : summary?.orderCount ?? 0}
          </div>
          <div className="text-[12px] font-semibold text-[var(--accent-ink)]">
            Avg {loading ? '—' : formatPaise(summary?.averageOrderValuePaise || 0, false)}
          </div>
        </div>
      </div>
    </div>
  );
};


