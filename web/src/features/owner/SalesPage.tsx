import React, { useState, useEffect } from 'react';
import { formatPaise } from '@ritsu/shared';
import { Button } from '../../components/Button.js';
import { Skeleton } from '../../components/Skeleton.js';
import { Download, Calendar, DollarSign, ArrowDownToLine, RefreshCw } from 'lucide-react';

interface DailySummary {
  date: string;
  paidOrders: number;
  paidRevenuePaise: number;
  unpaidOrders: number;
  unpaidRevenuePaise: number;
}

export const SalesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailySummary[]>([]);
  const [totalSalesPaise, setTotalSalesPaise] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      // 1. Fetch summary metrics
      const sumRes = await fetch('/api/owner/summary?period=all');
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setTotalSalesPaise(sumData.totalSalesPaise || 0);
        setTotalOrders(sumData.orderCount || 0);
      }

      // 2. Fetch all orders to group into daily totals
      const ordersRes = await fetch('/api/owner/orders');
      if (ordersRes.ok) {
        const allOrders: any[] = await ordersRes.json();
        const map = new Map<string, DailySummary>();

        allOrders.forEach((o) => {
          const d = (o.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
          if (!map.has(d)) {
            map.set(d, {
              date: d,
              paidOrders: 0,
              paidRevenuePaise: 0,
              unpaidOrders: 0,
              unpaidRevenuePaise: 0,
            });
          }
          const entry = map.get(d)!;
          if (o.payment_status === 'paid') {
            entry.paidOrders += 1;
            entry.paidRevenuePaise += o.total_paise || 0;
          } else {
            entry.unpaidOrders += 1;
            entry.unpaidRevenuePaise += o.total_paise || 0;
          }
        });

        const sorted = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
        setDailyData(sorted);
      } else {
        // Fallback: local orders
        const localOrders: any[] = JSON.parse(localStorage.getItem('ritsu_local_orders') || '[]');
        const map = new Map<string, DailySummary>();
        let totalSales = 0;

        localOrders.forEach((o) => {
          const d = (o.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
          if (!map.has(d)) {
            map.set(d, {
              date: d,
              paidOrders: 0,
              paidRevenuePaise: 0,
              unpaidOrders: 0,
              unpaidRevenuePaise: 0,
            });
          }
          const entry = map.get(d)!;
          if (o.payment_status === 'paid') {
            entry.paidOrders += 1;
            entry.paidRevenuePaise += o.total_paise || 0;
            totalSales += o.total_paise || 0;
          } else {
            entry.unpaidOrders += 1;
            entry.unpaidRevenuePaise += o.total_paise || 0;
          }
        });

        const sorted = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
        setDailyData(sorted);
        setTotalOrders(localOrders.length);
        setTotalSalesPaise(totalSales);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const handleDownloadBackup = () => {
    window.location.href = '/api/owner/backup';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Backup Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-bold text-[var(--text)]">
            Sales & reports
          </h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
            Daily revenue breakdowns, transaction totals, and database backup.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-1.5 font-semibold"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Download backup (.db)</span>
          </Button>
        </div>
      </div>

      {/* 2. Highlights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="warm-card p-5">
          <div className="text-[12px] font-medium text-[var(--text-muted)]">
            All-time paid revenue
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold tabular-nums text-[var(--accent-ink)] mt-1">
            {formatPaise(totalSalesPaise, false)}
          </div>
        </div>

        <div className="warm-card p-5">
          <div className="text-[12px] font-medium text-[var(--text-muted)]">
            Total orders processed
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold tabular-nums text-[var(--text)] mt-1">
            {totalOrders}
          </div>
        </div>

        <div className="warm-card p-5">
          <div className="text-[12px] font-medium text-[var(--text-muted)]">
            Average order value
          </div>
          <div className="text-[28px] sm:text-[32px] font-bold tabular-nums text-[var(--text)] mt-1">
            {totalOrders > 0 ? formatPaise(Math.round(totalSalesPaise / totalOrders), false) : '₹0'}
          </div>
        </div>
      </div>

      {/* 3. Daily Breakdown Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="warm-card overflow-hidden shadow-xs">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/60 text-[var(--text-muted)] font-semibold text-[12px]">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Paid Orders</th>
                <th className="py-3.5 px-4">Paid Revenue</th>
                <th className="py-3.5 px-4">Unpaid Orders</th>
                <th className="py-3.5 px-4">Unpaid Amount</th>
                <th className="py-3.5 px-4 text-right">Day Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/50">
              {dailyData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[13px] text-[var(--text-muted)] italic">
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                dailyData.map((day) => {
                  const totalDayOrders = day.paidOrders + day.unpaidOrders;
                  const totalDayPaise = day.paidRevenuePaise + day.unpaidRevenuePaise;
                  const avgPaise = totalDayOrders > 0 ? Math.round(totalDayPaise / totalDayOrders) : 0;
                  return (
                    <tr key={day.date} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[var(--text)]">
                        {day.date}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-[var(--success)] font-semibold">
                        {day.paidOrders}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums font-bold text-[var(--accent-ink)]">
                        {formatPaise(day.paidRevenuePaise, false)}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-[var(--warning)] font-semibold">
                        {day.unpaidOrders}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-[var(--text-muted)]">
                        {formatPaise(day.unpaidRevenuePaise, false)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-[var(--text)]">
                        {formatPaise(avgPaise, false)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

