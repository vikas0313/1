import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { OwnerLoginPage } from './OwnerLoginPage';
import { LocalDemoLogin } from './LocalDemoLogin';

interface OwnerAuthGuardProps {
  children: React.ReactNode;
}

const AUTH_STORAGE_KEY = 'ritsu_owner_auth_token_v1';

export const OwnerAuthGuard: React.FC<OwnerAuthGuardProps> = ({ children }) => {
  const { session, isOwner, loading, signOut, isSupabaseBackend } = useAuth();

  const [isDemoAuthenticated, setIsDemoAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated';
  });

  const handleDemoSuccess = () => {
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
    setIsDemoAuthenticated(true);
  };

  const handleDemoLogout = () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsDemoAuthenticated(false);
  };

  if (isSupabaseBackend) {
    if (loading) {
      return (
        <div className="min-h-screen bg-app text-app flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-app-muted">Checking owner credentials...</p>
          </div>
        </div>
      );
    }

    if (!session) {
      return <OwnerLoginPage />;
    }

    if (!isOwner) {
      return (
        <div className="min-h-screen bg-app text-app flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-surface border border-app rounded-3xl p-6 text-center shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-app">Access Denied</h2>
            <p className="text-xs text-app-muted mt-1 mb-4">
              Your account ({session.user.email}) is not registered as an authorized owner.
            </p>
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 px-4 rounded-xl bg-card border border-app text-app text-xs font-semibold hover:bg-neutral-800 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }
  } else {
    if (!isDemoAuthenticated) {
      return <LocalDemoLogin onSuccess={handleDemoSuccess} />;
    }
  }

  return (
    <div>
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-1.5 text-xs text-neutral-400 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-neutral-200">
            {isSupabaseBackend ? `Logged in: ${session?.user?.email}` : 'Owner Session Active'}
          </span>
          {!isSupabaseBackend && (
            <span className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.2 rounded font-mono font-bold">
              DEMO MODE
            </span>
          )}
        </div>
        <button
          onClick={() => {
            if (isSupabaseBackend) {
              signOut();
            } else {
              handleDemoLogout();
            }
          }}
          className="text-neutral-400 hover:text-white underline cursor-pointer text-xs"
        >
          Sign Out
        </button>
      </div>
      {children}
    </div>
  );
};
