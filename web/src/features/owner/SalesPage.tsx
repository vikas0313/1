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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
            Sales & Financial Reports
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-serif italic">
            Daily revenue breakdowns, transaction totals, and database backup.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={handleDownloadBackup}
            className="text-xs py-1.5 px-3 inline-flex items-center gap-1.5 tracking-wider font-semibold"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>DOWNLOAD BACKUP (.DB)</span>
          </Button>
        </div>
      </div>

      {/* 2. Highlights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-secondary)]">
            All-Time Paid Revenue
          </div>
          <div className="font-serif text-2xl font-bold text-[var(--gold-ink)] mt-1">
            {formatPaise(totalSalesPaise)}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-secondary)]">
            Total Orders Processed
          </div>
          <div className="font-serif text-2xl font-bold text-[var(--text-primary)] mt-1">
            {totalOrders}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-secondary)]">
            Average Order Value
          </div>
          <div className="font-serif text-2xl font-bold text-[var(--text-primary)] mt-1">
            {totalOrders > 0 ? formatPaise(Math.round(totalSalesPaise / totalOrders)) : '₹0.00'}
          </div>
        </div>
      </div>

      {/* 3. Daily Breakdown Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Paid Orders</th>
                <th className="py-3 px-4">Paid Revenue</th>
                <th className="py-3 px-4">Unpaid Orders</th>
                <th className="py-3 px-4">Unpaid Amount</th>
                <th className="py-3 px-4 text-right">Day Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {dailyData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-[var(--text-muted)] italic font-serif">
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                dailyData.map((day) => {
                  const totalDayOrders = day.paidOrders + day.unpaidOrders;
                  const totalDayPaise = day.paidRevenuePaise + day.unpaidRevenuePaise;
                  const avgPaise = totalDayOrders > 0 ? Math.round(totalDayPaise / totalDayOrders) : 0;
                  return (
                    <tr key={day.date} className="hover:bg-[var(--bg-surface)] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[var(--text-primary)]">
                        {day.date}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {day.paidOrders}
                      </td>
                      <td className="py-3 px-4 font-serif font-bold text-[var(--gold-ink)]">
                        {formatPaise(day.paidRevenuePaise)}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-600 dark:text-amber-400 font-semibold">
                        {day.unpaidOrders}
                      </td>
                      <td className="py-3 px-4 font-serif text-[var(--text-secondary)]">
                        {formatPaise(day.unpaidRevenuePaise)}
                      </td>
                      <td className="py-3 px-4 text-right font-serif font-bold text-[var(--text-primary)]">
                        {formatPaise(avgPaise)}
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

