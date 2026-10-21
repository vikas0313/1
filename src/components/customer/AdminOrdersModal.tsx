import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  DollarSign,
  TrendingUp,
  Clock,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  LogOut,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { formatINR } from '../../domain/pricing';
import { RESTAURANT_CONFIG } from '../../config/restaurant.config';

interface AdminOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AUTH_STORAGE_KEY = 'ritsu_owner_auth_token_v1';

const getDemoPassword = (): string => {
  return (
    import.meta.env.VITE_DEMO_OWNER_PASSWORD ||
    (import.meta.env.VITE_DATA_BACKEND === 'supabase' ? '' : atob('YWRtaW4xMjM='))
  );
};

export const AdminOrdersModal: React.FC<AdminOrdersModalProps> = ({ isOpen, onClose }) => {
  const { allOrders, advanceOrderStatus, updateOrderStatus, markPaid } = useOrders();
  const { session, isOwner, signIn, signOut, isSupabaseBackend } = useAuth();

  // Auth states
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [isDemoAuthenticated, setIsDemoAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated';
  });

  // Check if authenticated
  const isAuthenticated = isSupabaseBackend ? !!(session && isOwner) : isDemoAuthenticated;

  // Dashboard view states
  const [activeTab, setActiveTab] = useState<'earnings' | 'orders'>('earnings');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'all'>('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);

  // Sync auth state if changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDemoAuthenticated(sessionStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated');
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      if (isSupabaseBackend) {
        // In Supabase mode, attempt Supabase email/password login
        try {
          const email = username.includes('@') ? username : `${username}@ritsufoodcorner.com`;
          await signIn(email, password);
          sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
          setIsDemoAuthenticated(true);
        } catch (supabaseErr: unknown) {
          // Allow fallback to demo credentials if enabled
          const demoPassword = getDemoPassword();
          const validUser = username.trim().toLowerCase() === 'admin' || username.trim().toLowerCase() === 'owner';
          if (validUser && demoPassword && password === demoPassword) {
            sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
            setIsDemoAuthenticated(true);
            setPassword('');
          } else {
            throw supabaseErr;
          }
        }
      } else {
        // Local/Demo Mode validation
        const demoPassword = getDemoPassword();
        const validUser = username.trim().toLowerCase() === 'admin' || username.trim().toLowerCase() === 'owner';

        if (validUser && demoPassword && password === demoPassword) {
          sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
          setIsDemoAuthenticated(true);
          setPassword('');
        } else {
          setLoginError('Invalid username or password.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsDemoAuthenticated(false);
    if (isSupabaseBackend) {
      signOut();
    }
  };

  // Filter orders by date for earnings
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

    return allOrders.filter((o) => {
      const orderTime = new Date(o.created_at).getTime();
      if (dateFilter === 'today') return orderTime >= startOfToday;
      if (dateFilter === '7days') return orderTime >= sevenDaysAgo;
      return true;
    });
  }, [allOrders, dateFilter]);

  // Earnings calculations
  const metrics = useMemo(() => {
    const nonCancelled = filteredOrders.filter((o) => o.status !== 'cancelled');
    const totalOrderCount = nonCancelled.length;

    const paidOrders = nonCancelled.filter((o) => o.payment_status === 'paid');
    const totalPaidPaise = paidOrders.reduce((sum, o) => sum + o.total_paise, 0);

    const unpaidOrders = nonCancelled.filter((o) => o.payment_status === 'unpaid');
    const totalUnpaidPaise = unpaidOrders.reduce((sum, o) => sum + o.total_paise, 0);

    const aovPaise = totalOrderCount > 0 ? Math.round((totalPaidPaise + totalUnpaidPaise) / totalOrderCount) : 0;

    return {
      totalOrderCount,
      totalPaidPaise,
      totalUnpaidPaise,
      aovPaise,
    };
  }, [filteredOrders]);

  // Orders tab list filtering
  const displayedOrders = useMemo(() => {
    let list = [...allOrders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (statusFilter !== 'all') {
      list = list.filter((o) => o.status === statusFilter);
    }

    return list;
  }, [allOrders, statusFilter]);

  const handleAdvanceStatus = async (orderId: string) => {
    try {
      setOrderActionLoading(orderId);
      await advanceOrderStatus(orderId);
    } catch (e) {
      console.error('Failed to advance order', e);
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleMarkPaid = async (orderId: string) => {
    try {
      setOrderActionLoading(orderId);
      await markPaid(orderId, 'counter_cash');
    } catch (e) {
      console.error('Failed to mark paid', e);
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setOrderActionLoading(orderId);
      await updateOrderStatus(orderId, 'cancelled');
    } catch (e) {
      console.error('Failed to cancel order', e);
    } finally {
      setOrderActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <div className="bg-surface border border-app rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-app flex items-center justify-between gap-3 bg-card/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="admin-modal-title" className="font-extrabold text-base text-app leading-tight">
                  Restaurant Admin
                </h2>
                {isAuthenticated && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Owner Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-app-muted">
                {isAuthenticated
                  ? `${RESTAURANT_CONFIG.restaurantName} • Realtime Orders & Sales`
                  : 'Owner & Staff Authentication'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-app-muted hover:text-red-400 hover:bg-red-500/10 transition"
                title="Sign Out Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-app-muted hover:text-app hover:bg-card transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {!isAuthenticated ? (
            /* Login Form */
            <div className="max-w-md mx-auto py-2">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3 mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-app">Owner & Staff Sign In</h3>
                <p className="text-xs text-app-muted mt-1">
                  Enter credentials to view all live dining orders and total earnings.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-app mb-1.5">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="Enter username or email"
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-app text-app placeholder-app-muted focus:outline-none focus:border-primary text-sm min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-app mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (loginError) setLoginError(null);
                      }}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-11 rounded-xl bg-card border border-app text-app placeholder-app-muted focus:outline-none focus:border-primary text-sm min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer min-h-[44px] active:scale-98 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sign In as Owner</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Authenticated Owner Dashboard */
            <div className="space-y-4">
              {/* Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-app pb-3 gap-2">
                <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl border border-app">
                  <button
                    onClick={() => setActiveTab('earnings')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === 'earnings'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-app-muted hover:text-app'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Total Earnings</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === 'orders'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-app-muted hover:text-app'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>All Orders ({allOrders.length})</span>
                  </button>
                </div>

                <a
                  href="/owner"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-card hover:bg-surface border border-app text-app text-xs font-bold transition"
                >
                  <span>Full Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-accent" />
                </a>
              </div>

              {/* EARNINGS TAB */}
              {activeTab === 'earnings' && (
                <div className="space-y-4">
                  {/* Date Filter Pills */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-app-muted font-medium">Summary Period:</span>
                    <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-app">
                      <button
                        onClick={() => setDateFilter('today')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          dateFilter === 'today' ? 'bg-primary text-white' : 'text-app-muted hover:text-app'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setDateFilter('7days')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          dateFilter === '7days' ? 'bg-primary text-white' : 'text-app-muted hover:text-app'
                        }`}
                      >
                        7 Days
                      </button>
                      <button
                        onClick={() => setDateFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          dateFilter === 'all' ? 'bg-primary text-white' : 'text-app-muted hover:text-app'
                        }`}
                      >
                        All Time
                      </button>
                    </div>
                  </div>

                  {/* Earnings Cards Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Paid Sales */}
                    <div className="bg-card border border-app p-4 rounded-2xl">
                      <div className="flex items-center justify-between text-app-muted mb-1">
                        <span className="text-xs font-medium">Total Sales (Paid)</span>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                        {formatINR(metrics.totalPaidPaise)}
                      </div>
                      <span className="text-[10px] text-app-muted mt-0.5 block">Collected counter & online</span>
                    </div>

                    {/* Unpaid Balance */}
                    <div className="bg-card border border-app p-4 rounded-2xl">
                      <div className="flex items-center justify-between text-app-muted mb-1">
                        <span className="text-xs font-medium">Pending Unpaid</span>
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                        {formatINR(metrics.totalUnpaidPaise)}
                      </div>
                      <span className="text-[10px] text-app-muted mt-0.5 block">Awaiting payment settlement</span>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-card border border-app p-4 rounded-2xl">
                      <div className="flex items-center justify-between text-app-muted mb-1">
                        <span className="text-xs font-medium">Total Orders</span>
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-app">
                        {metrics.totalOrderCount}
                      </div>
                      <span className="text-[10px] text-app-muted mt-0.5 block">Excluding cancelled</span>
                    </div>

                    {/* Average Order Value */}
                    <div className="bg-card border border-app p-4 rounded-2xl">
                      <div className="flex items-center justify-between text-app-muted mb-1">
                        <span className="text-xs font-medium">Avg Order Value</span>
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-app">
                        {formatINR(metrics.aovPaise)}
                      </div>
                      <span className="text-[10px] text-app-muted mt-0.5 block">Average per dining table</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {/* Status Filters */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <Filter className="w-3.5 h-3.5 text-app-muted flex-shrink-0 mr-1" />
                    {['all', 'pending', 'preparing', 'ready', 'complete', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-2.5 py-1 rounded-lg font-bold capitalize whitespace-nowrap transition cursor-pointer ${
                          statusFilter === status
                            ? 'bg-primary text-white'
                            : 'bg-card border border-app text-app-muted hover:text-app'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  {/* Orders List */}
                  {displayedOrders.length === 0 ? (
                    <div className="text-center py-10 bg-card rounded-2xl border border-app">
                      <ShoppingBag className="w-8 h-8 text-app-muted mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold text-app">No orders found</p>
                      <p className="text-[11px] text-app-muted mt-0.5">Orders placed by customers will appear here in realtime.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {displayedOrders.map((order) => {
                        const isActionRunning = orderActionLoading === order.id;

                        return (
                          <div
                            key={order.id}
                            className="bg-card border border-app rounded-2xl p-3.5 hover:border-app-muted/40 transition shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-sm text-app">
                                    #{order.id.slice(-6).toUpperCase()}
                                  </span>
                                  <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                    Table {order.table_label}
                                  </span>
                                  <span className="text-xs font-medium text-app truncate max-w-[120px]">
                                    {order.customer_name}
                                  </span>
                                </div>
                                <span className="text-[10px] text-app-muted">
                                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {/* Status badge */}
                                <span
                                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                    order.status === 'pending'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                      : order.status === 'preparing'
                                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                      : order.status === 'ready'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : order.status === 'complete'
                                      ? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  }`}
                                >
                                  {order.status}
                                </span>

                                {/* Payment badge */}
                                <span
                                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                    order.payment_status === 'paid'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  }`}
                                >
                                  {order.payment_status}
                                </span>
                              </div>
                            </div>

                            {/* Items Preview */}
                            <div className="text-xs text-app-muted bg-surface/60 rounded-xl p-2 mb-2.5 space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px]">
                                  <span className="truncate pr-2">
                                    <strong className="text-app font-bold">{item.quantity}×</strong> {item.name_snapshot} ({item.variant_label_snapshot})
                                  </span>
                                  <span className="font-mono text-app flex-shrink-0">
                                    {formatINR(item.unit_price_paise * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Total and Actions Bar */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-app/60">
                              <div>
                                <span className="text-[10px] text-app-muted uppercase font-semibold block">Total</span>
                                <span className="font-mono font-bold text-sm text-emerald-400">
                                  {formatINR(order.total_paise)}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Mark Paid button */}
                                {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleMarkPaid(order.id)}
                                    disabled={isActionRunning}
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Mark Paid</span>
                                  </button>
                                )}

                                {/* Status advancement */}
                                {order.status === 'pending' && (
                                  <button
                                    onClick={() => handleAdvanceStatus(order.id)}
                                    disabled={isActionRunning}
                                    className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <span>Start Preparing</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {order.status === 'preparing' && (
                                  <button
                                    onClick={() => handleAdvanceStatus(order.id)}
                                    disabled={isActionRunning}
                                    className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <span>Mark Ready</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {order.status === 'ready' && (
                                  <button
                                    onClick={() => handleAdvanceStatus(order.id)}
                                    disabled={isActionRunning}
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <span>Complete</span>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Cancel Order if not complete or cancelled */}
                                {order.status !== 'complete' && order.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleCancelOrder(order.id)}
                                    disabled={isActionRunning}
                                    className="p-1.5 rounded-xl text-app-muted hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                    title="Cancel Order"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
