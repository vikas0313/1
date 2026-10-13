import React, { useState } from 'react';
import { Lock, AlertCircle, ShieldCheck, Mail } from 'lucide-react';
import { RESTAURANT_CONFIG } from '../../config/restaurant.config';
import { useAuth } from '../../hooks/useAuth';

export const OwnerLoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app text-app flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-surface border border-app rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-4 mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div className="text-center mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
            {RESTAURANT_CONFIG.restaurantName}
          </span>
          <h1 className="text-xl font-bold text-app mt-1">Owner Sign In</h1>
          <p className="text-xs text-app-muted mt-1">
            Access live orders, menu management, and sales reports.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-app-muted mb-1.5">
              Owner Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-app-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@ritsufoodcorner.com"
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-card border border-app text-app placeholder-neutral-500 focus:outline-none focus:border-primary min-h-[44px] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-muted mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-card border border-app text-app placeholder-neutral-500 focus:outline-none focus:border-primary min-h-[44px] text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/20 transition flex items-center justify-center gap-2 cursor-pointer min-h-[44px] active:scale-98 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
