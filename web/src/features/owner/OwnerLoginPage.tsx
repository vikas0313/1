import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button.js';
import { Lock } from 'lucide-react';

interface OwnerLoginPageProps {
  onLoginSuccess: () => void;
}

export const OwnerLoginPage: React.FC<OwnerLoginPageProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if DEMO_MODE banner should show
    fetch('/api/owner/session')
      .then((res) => {
        // Just checking connectivity
      })
      .catch(() => {});
    
    // In our server config, demo password admin123 is accepted when DEMO_MODE=true
    if (window.location.search.includes('demo=true')) {
      setIsDemoMode(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the owner password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/owner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setError('Too many failed attempts. Please wait 15 minutes.');
        } else {
          setError('Incorrect password. Access denied.');
        }
        setLoading(false);
        return;
      }

      onLoginSuccess();
    } catch (err) {
      setError('Connection error. Could not reach server.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-center items-center px-4 py-8">
      {isDemoMode && (
        <div className="fixed top-0 inset-x-0 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-center py-1.5 text-xs font-medium">
          DEMO MODE ENABLED — Default password: <code className="font-mono font-bold">admin123</code>
        </div>
      )}

      <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-default)] p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--gold-ink)]/10 text-[var(--gold-ink)] mb-3 border border-[var(--gold-ink)]/20">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Owner Portal
          </h1>
          <p className="font-serif text-xs italic text-[var(--text-secondary)] mt-1">
            Ritsu Food Corner · Kitchen & Management
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Owner Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="off"
              className="w-full px-3 py-2.5 text-sm bg-[var(--bg-canvas)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-ink)] focus:ring-1 focus:ring-[var(--gold-ink)] transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full py-2.5 tracking-wider font-semibold"
          >
            SIGN IN
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
          Protected portal for restaurant administration.
        </div>
      </div>
    </div>
  );
};
