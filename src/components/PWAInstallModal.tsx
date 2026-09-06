'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Apple, Check, X, Share, PlusSquare, ArrowDown, ExternalLink } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone PWA mode
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture Android/Desktop beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Install PowerSchedule App</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Available for iPhone, iPad, Android & Desktop</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* App Card Preview */}
          <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm">
            <img
              src="/icons/icon-192x192.png"
              alt="PowerSchedule App Icon"
              className="h-16 w-16 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 object-contain bg-white dark:bg-slate-950 p-1"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">Wildcards PowerSchedule</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">schedule.rockywildcards.com</p>
              <div className="flex items-center space-x-2 mt-1.5">
                <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Fast & Offline-Ready
                </span>
                <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  No App Store Needed
                </span>
              </div>
            </div>
          </div>

          {isStandalone || isInstalled ? (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 text-center space-y-2 shadow-sm">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-10 h-10 mx-auto flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">App is Installed!</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                You are running the official PowerSchedule Progressive Web App from your home screen.
              </p>
            </div>
          ) : isIOS ? (
            /* iOS Safari Instructions */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                  <Apple className="h-4 w-4" />
                  <span>iPhone & iPad Installation Steps</span>
                </div>
                <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pl-1">
                  <li className="flex items-start space-x-2.5">
                    <span className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <span>Tap the <strong>Share button</strong> <Share className="inline h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mx-0.5 -mt-0.5" /> in the Safari bottom toolbar.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <span>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="inline h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mx-0.5 -mt-0.5" />.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <span>Tap <strong>Add</strong> in the top-right corner to launch directly from your home screen!</span>
                  </li>
                </ol>
              </div>
            </div>
          ) : (
            /* Android / Desktop Install */
            <div className="space-y-3">
              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 text-white dark:text-slate-950 font-black text-sm shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Install App to Home Screen</span>
                </button>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
                  <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    <Smartphone className="h-4 w-4" />
                    <span>Android & Chrome Instructions</span>
                  </div>
                  <p>
                    Tap the <strong>three dots menu (⋮)</strong> in Chrome/Edge, then tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Features bullet list */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Full-screen app view</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Instant match access</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Court-side scorekeeper</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Zero App Store downloads</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
