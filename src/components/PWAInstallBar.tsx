'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

interface PWAInstallBarProps {
  onOpenInstallModal: () => void;
}

// iOS Safari exposes navigator.standalone when launched from the home screen
const isRunningStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

export const PWAInstallBar: React.FC<PWAInstallBarProps> = ({ onOpenInstallModal }) => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Browser-only value, read after hydration (reading it during render would mismatch the server HTML)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);

    // Check if running as installed standalone app
    setIsStandalone(isRunningStandalone());

    const dismissedSession = sessionStorage.getItem('powerschedule_pwa_banner_dismissed');
    if (dismissedSession === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Do not show if SSR, running in standalone PWA app, or user dismissed for this session
  if (!isMounted || isStandalone || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('powerschedule_pwa_banner_dismissed', 'true');
  };

  return (
    <div className="bg-slate-100 dark:bg-[#15171b] border-b border-[#e5e7eb] dark:border-[#1c1f24] text-[#242424] dark:text-[#a0aaba] animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left App Description */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white dark:bg-[#1c1f24] border border-[#e5e7eb] dark:border-[#333943] p-1 flex items-center justify-center shrink-0 shadow-xs">
            <Image
              src="/icons/icon-192x192.png"
              alt="App Icon"
              width={36}
              height={36}
              className="h-full w-full object-contain rounded-lg"
            />
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-extrabold text-[#242424] dark:text-white truncate">
                Install PowerSchedule App
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 bg-slate-200 dark:bg-[#1c1f24] text-slate-800 dark:text-[#a0aaba] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#e5e7eb] dark:border-[#333943]">
                <Sparkles className="h-2.5 w-2.5" />
                iOS & Android
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-[#8b96aa] truncate hidden sm:block">
              Add to home screen for 1-tap court schedule, live standings, and team scorekeeping.
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onOpenInstallModal}
            className="px-3.5 py-1.5 rounded-xl bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] dark:text-white font-black text-xs shadow-xs transition-all flex items-center space-x-1.5"
          >
            <Download className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Install App</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
