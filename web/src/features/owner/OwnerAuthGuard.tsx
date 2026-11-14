import React, { useState, useEffect } from 'react';
import { OwnerLoginPage } from './OwnerLoginPage.js';
import { Skeleton } from '../../components/Skeleton.js';

interface OwnerAuthGuardProps {
  children: React.ReactNode;
}

export const OwnerAuthGuard: React.FC<OwnerAuthGuardProps> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/owner/session', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(!!data.authenticated);
        setChecking(false);
        return;
      }
    } catch {
      // Fallback
    }

    const localAuth = sessionStorage.getItem('ritsu_owner_authenticated') === 'true';
    setIsAuthenticated(localAuth);
    setChecking(false);
  };

  useEffect(() => {
    checkSession();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-40 w-full mt-6" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <OwnerLoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <>{children}</>;
};

