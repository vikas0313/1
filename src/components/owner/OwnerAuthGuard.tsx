import React, { useState } from 'react';
import { LocalDemoLogin } from './LocalDemoLogin';

interface OwnerAuthGuardProps {
  children: React.ReactNode;
}

const AUTH_STORAGE_KEY = 'ritsu_owner_auth_token_v1';

export const OwnerAuthGuard: React.FC<OwnerAuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated';
  });

  const handleLoginSuccess = () => {
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LocalDemoLogin onSuccess={handleLoginSuccess} />;
  }

  return (
    <div>
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-1.5 text-xs text-neutral-400 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-neutral-200">Owner Session Active</span>
          <span className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.2 rounded font-mono font-bold">
            LOCAL MODE
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-neutral-400 hover:text-white underline cursor-pointer text-xs"
        >
          Sign Out
        </button>
      </div>
      {children}
    </div>
  );
};
