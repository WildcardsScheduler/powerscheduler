'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles, Apple } from 'lucide-react';

interface PWAInstallBarProps {
  onOpenInstallModal: () => void;
}

export const PWAInstallBar: React.FC<PWAInstallBarProps> = ({ onOpenInstallModal }) => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;

    // Check if running as installed standalone app
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

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
    <div className="bg-gradient-to-r from-emerald-500/10 via-slate-100 to-emerald-500/10 dark:from-emerald-950/60 dark:via-slate-900 dark:to-emerald-950/60 border-b border-emerald-500/30 text-slate-900 dark:text-white animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left App Description */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white dark:bg-slate-950 border border-emerald-500/40 p-1 flex items-center justify-center shrink-0 shadow-md">
            <img
              src="/icons/icon-192x192.png"
              alt="App Icon"
              className="h-full w-full object-contain rounded-lg"
            />
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                Install PowerSchedule App
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                <Sparkles className="h-2.5 w-2.5" />
                iOS & Android
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate hidden sm:block">
              Add to home screen for 1-tap court schedule, live standings, and team scorekeeping.
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onOpenInstallModal}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white dark:text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5"
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
