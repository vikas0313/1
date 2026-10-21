import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
import { RESTAURANT_CONFIG } from '../../config/restaurant.config';

interface LocalDemoLoginProps {
  onSuccess: () => void;
}

const ATTEMPTS_STORAGE_KEY = 'ritsu_owner_login_attempts';
const LOCKOUT_STORAGE_KEY = 'ritsu_owner_lockout_time';

export const LocalDemoLogin: React.FC<LocalDemoLoginProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  const demoPassword =
    import.meta.env.VITE_DEMO_OWNER_PASSWORD ||
    (import.meta.env.VITE_DATA_BACKEND === 'supabase' ? '' : atob('YWRtaW4xMjM='));

  useEffect(() => {
    const checkLockout = () => {
      const lockoutTime = Number(localStorage.getItem(LOCKOUT_STORAGE_KEY) || 0);
      const now = Date.now();
      if (lockoutTime > now) {
        setLockoutRemaining(Math.ceil((lockoutTime - now) / 1000));
      } else {
        setLockoutRemaining(0);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutRemaining > 0) {
      setError(`Too many failed attempts. Locked for ${lockoutRemaining}s.`);
      return;
    }

    if (password === demoPassword) {
      localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
      localStorage.removeItem(LOCKOUT_STORAGE_KEY);
      setError(null);
      onSuccess();
    } else {
      const currentAttempts = Number(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || 0) + 1;
      localStorage.setItem(ATTEMPTS_STORAGE_KEY, String(currentAttempts));

      if (currentAttempts >= 5) {
        const lockoutUntil = Date.now() + 60 * 1000;
        localStorage.setItem(LOCKOUT_STORAGE_KEY, String(lockoutUntil));
        setLockoutRemaining(60);
        setError('5 failed attempts. Locked for 60 seconds.');
      } else {
        setError(`Incorrect password. ${5 - currentAttempts} attempts remaining.`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-4 mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div className="text-center mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            {RESTAURANT_CONFIG.restaurantName}
          </span>
          <h1 className="text-xl font-bold text-white mt-1">Staff & Owner Portal</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Enter password to access kitchen management & live orders.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-5 text-left text-xs text-amber-300">
          <div className="font-semibold flex items-center gap-1 mb-1">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Demo Password</span>
          </div>
          <p className="text-[11px] text-amber-300/80">
            Prototype demo password: <code className="bg-neutral-950 px-1.5 py-0.5 rounded font-mono font-bold text-white">{demoPassword || 'configured in .env'}</code>
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="ownerPassword" className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Portal Password
            </label>
            <input
              id="ownerPassword"
              type="password"
              required
              autoFocus
              disabled={lockoutRemaining > 0}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter password..."
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 min-h-[44px] text-sm"
            />
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={lockoutRemaining > 0}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white font-bold text-sm shadow-lg shadow-red-950/40 transition flex items-center justify-center gap-2 cursor-pointer min-h-[44px] active:scale-98 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{lockoutRemaining > 0 ? `Locked (${lockoutRemaining}s)` : 'Access Dashboard'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
