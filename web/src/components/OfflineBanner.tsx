import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className="w-full bg-amber-500/15 border-b border-[var(--warning)]/30 text-[var(--warning)] py-2.5 px-4 text-center text-[13px] font-medium flex items-center justify-center gap-2 select-none"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>No internet connection. Reconnecting automatically...</span>
    </div>
  );
};


