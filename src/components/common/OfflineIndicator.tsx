/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-18 left-4 right-4 z-40 flex items-center justify-center gap-2 rounded-xl bg-amber-600/95 text-white px-4 py-2 text-xs font-semibold shadow-xl backdrop-blur-md animate-bounce">
      <WifiOff className="w-4 h-4" />
      <span>Offline Mode — Working smoothly with offline cached data</span>
    </div>
  );
};
