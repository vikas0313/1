import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DemoBannerProps {
  message?: string;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  message = 'DEMO PROTOTYPE MODE – Real payments & cloud database disabled. Data syncs locally across browser tabs.',
}) => {
  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 px-3 py-1.5 text-xs flex items-center justify-center gap-1.5 text-center font-medium">
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
      <span>{message}</span>
    </div>
  );
};
