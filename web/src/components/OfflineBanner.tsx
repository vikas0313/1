import React, { useEffect, useState } from 'react';

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
      className="w-full bg-amber-500/10 border-b-2 border-[var(--border-gold)] text-[var(--gold-ink)] py-2.5 px-4 text-center text-[13px] font-medium tracking-wide uppercase shadow-sm select-none"
    >
      ⚠️ No internet connection. Ordering is paused. Please check your network.
    </div>
  );
};

