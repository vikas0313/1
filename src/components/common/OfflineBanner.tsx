import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="bg-rose-700 text-white px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md"
    >
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>You are currently offline. Ordering is temporarily disabled until connection resumes.</span>
    </div>
  );
};
