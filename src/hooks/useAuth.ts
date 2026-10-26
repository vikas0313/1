import { useState, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'ritsu_owner_auth_token_v1';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated';
  });

  const signIn = useCallback(async (password: string) => {
    const demoPassword = import.meta.env.VITE_DEMO_OWNER_PASSWORD || atob('YWRtaW4xMjM=');
    if (password === demoPassword) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
      setIsAuthenticated(true);
      return true;
    }
    throw new Error('Invalid password');
  }, []);

  const signOut = useCallback(async () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    isOwner: isAuthenticated,
    loading: false,
    signIn,
    signOut,
  };
}
