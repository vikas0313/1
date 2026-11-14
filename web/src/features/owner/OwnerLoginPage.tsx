import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button.js';
import { alertService } from '../../services/AlertService.js';
import { Lock, ShieldCheck, KeyRound } from 'lucide-react';

interface OwnerLoginPageProps {
  onLoginSuccess: () => void;
}

const ACCEPTED_DEMO_PASSWORDS = [
  'admin123',
  'staff123',
  'admin',
  'staff',
  'owner',
  'ritsu123',
  '123456',
];

export const OwnerLoginPage: React.FC<OwnerLoginPageProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if session is already authenticated locally
    if (sessionStorage.getItem('ritsu_owner_authenticated') === 'true') {
      onLoginSuccess();
    }
  }, [onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = password.trim();
    if (!cleanPassword) {
      setError('Please enter the portal password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/owner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: cleanPassword }),
      });

      if (response.ok) {
        sessionStorage.setItem('ritsu_owner_authenticated', 'true');
        await alertService.unlock();
        onLoginSuccess();
        return;
      }

      if (response.status === 429) {
        setError('Too many attempts. Please wait a few minutes.');
        setLoading(false);
        return;
      }

      // If backend returns 401 or 404 (e.g. running on static Vercel or DEMO_MODE)
      if (response.status === 404 || response.status === 401) {
        if (ACCEPTED_DEMO_PASSWORDS.includes(cleanPassword.toLowerCase())) {
          sessionStorage.setItem('ritsu_owner_authenticated', 'true');
          await alertService.unlock();
          onLoginSuccess();
          return;
        }
      }

      setError('Incorrect password. Please use admin123 or staff123.');
      setLoading(false);
    } catch {
      // Fallback on network/Vercel static hosting
      if (ACCEPTED_DEMO_PASSWORDS.includes(cleanPassword.toLowerCase())) {
        sessionStorage.setItem('ritsu_owner_authenticated', 'true');
        await alertService.unlock();
        onLoginSuccess();
        return;
      }
      setError('Incorrect password. Please use admin123 or staff123.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm warm-card p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--accent)]/15 text-[var(--accent-ink)] mb-3 border border-[var(--accent)]/30">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[var(--text)]">
            Staff & Owner Portal
          </h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">
            Ritsu Food Corner · Kitchen orders & management
          </p>
        </div>

        {/* Clear Credentials Guidance Card */}
        <div className="mb-5 p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-left">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--accent-ink)] mb-2">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Default Portal Passwords</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
            <button
              type="button"
              onClick={() => setPassword('admin123')}
              className="px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-mono font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-all cursor-pointer text-xs"
              title="Click to fill admin123"
            >
              admin123
            </button>
            <button
              type="button"
              onClick={() => setPassword('staff123')}
              className="px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-mono font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-all cursor-pointer text-xs"
              title="Click to fill staff123"
            >
              staff123
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-tight">
            Tap a password above or type it below to sign in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[var(--text)] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter admin123 or staff123"
              autoComplete="off"
              autoFocus
              className="touch-target w-full px-4 h-12 text-[14px] bg-[var(--surface-2)] border border-[var(--border)] rounded-full text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-[var(--danger)] rounded-xl text-[13px] font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full font-semibold flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign in to Dashboard</span>
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--border)] text-center text-[12px] text-[var(--text-muted)]">
          Protected kitchen & management console.
        </div>
      </div>
    </div>
  );
};

