import React, { useState, useMemo } from 'react';
import { Order } from '../../types/order';
import { formatINR } from '../../domain/pricing';
import { DollarSign, Clock, ShoppingCart, TrendingUp } from 'lucide-react';

interface MetricsSummaryProps {
  orders: Order[];
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ orders }) => {
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'all'>('today');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

    return orders.filter((o) => {
      const orderTime = new Date(o.created_at).getTime();
      if (dateFilter === 'today') {
        return orderTime >= startOfToday;
      }
      if (dateFilter === '7days') {
        return orderTime >= sevenDaysAgo;
      }
      return true;
    });
  }, [orders, dateFilter]);

  const metrics = useMemo(() => {
    // Non-cancelled orders count
    const nonCancelled = filteredOrders.filter((o) => o.status !== 'cancelled');
    const totalOrderCount = nonCancelled.length;

    // Total Paid Sales
    const paidOrders = nonCancelled.filter((o) => o.payment_status === 'paid');
    const totalPaidPaise = paidOrders.reduce((sum, o) => sum + o.total_paise, 0);

    // Unpaid amount
    const unpaidOrders = nonCancelled.filter((o) => o.payment_status === 'unpaid');
    const totalUnpaidPaise = unpaidOrders.reduce((sum, o) => sum + o.total_paise, 0);

    // Average Order Value (AOV) based on active orders
    const aovPaise = totalOrderCount > 0
      ? Math.round((totalPaidPaise + totalUnpaidPaise) / totalOrderCount)
      : 0;

    return {
      totalOrderCount,
      totalPaidPaise,
      totalUnpaidPaise,
      aovPaise,
    };
  }, [filteredOrders]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Sales & Performance Overview</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Realtime metrics calculated from active dining orders
          </p>
        </div>

        {/* Date Filter Toggles */}
        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition min-h-[32px] ${
              dateFilter === 'today'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('7days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition min-h-[32px] ${
              dateFilter === '7days'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition min-h-[32px] ${
              dateFilter === 'all'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Paid Sales */}
        <div className="bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Total Sales (Paid)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
            {formatINR(metrics.totalPaidPaise)}
          </div>
          <span className="text-[10px] text-neutral-500">Collected in full</span>
        </div>

        {/* Unpaid Balance */}
        <div className="bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Pending Unpaid</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-400">
            {formatINR(metrics.totalUnpaidPaise)}
          </div>
          <span className="text-[10px] text-neutral-500">Awaiting counter settlement</span>
        </div>

        {/* Total Orders */}
        <div className="bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Order Count</span>
            <ShoppingCart className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            {metrics.totalOrderCount}
          </div>
          <span className="text-[10px] text-neutral-500">Excludes cancelled</span>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Avg Order Value</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            {formatINR(metrics.aovPaise)}
          </div>
          <span className="text-[10px] text-neutral-500">Per table order</span>
        </div>
      </div>
    </div>
  );
};
