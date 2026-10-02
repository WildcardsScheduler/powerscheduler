'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, UserCheck, LogIn, LogOut, BookOpen, Sun, Moon } from 'lucide-react';
import { LeagueSeason } from '@/types/league';
import { useTheme } from '@/context/ThemeContext';

export type UserRole = 'public' | 'team_rep' | 'scheduler';

interface NavbarProps {
  leagues: LeagueSeason[];
  activeLeagueId: string;
  currentRole: UserRole;
  authRole?: UserRole;
  authLeagueId?: string | null;
  authLeagueName?: string;
  activeTeamName?: string;
  authTeamName?: string;
  onRoleChange: (role: UserRole) => void;
  onSelectLeague: (id: string) => void;
  onOpenLeagueManager: () => void;
  onOpenRulesModal?: () => void;
  onOpenInstallModal?: () => void;
  onOpenLoginModal?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  authRole,
  activeTeamName,
  authTeamName,
  onOpenRulesModal,
  onLogout,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0e1012] backdrop-blur-md border-b border-slate-200 dark:border-[#1c1f24] text-slate-900 dark:text-white w-full overflow-x-hidden transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Theme Toggle Button & PowerSchedule Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-slate-200 dark:border-[#333943] bg-white dark:bg-[#15171b] hover:bg-slate-100 dark:hover:bg-[#23262d] text-slate-800 dark:text-white flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer"
            title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Light and Dark Mode"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-400 animate-in spin-in duration-300" />
            ) : (
              <Moon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-slate-700 animate-in spin-in duration-300" />
            )}
          </button>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-[#101010] dark:text-[#ffffff] whitespace-nowrap">
                PowerSchedule
              </span>

              {/* Live Cloud Indicator (Map Green) */}
              <span className="hidden md:inline-flex items-center gap-1 bg-[#228a56]/10 text-[#228a56] dark:text-[#34d399] text-[10px] px-2 py-0.5 rounded-full font-bold border border-[#228a56]/30 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-[#228a56] dark:bg-[#34d399] animate-ping" />
                Live Cloud
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Auth / Role Switcher Header Controls */}
        <div className="flex items-center space-x-2 shrink-0">

          {onOpenRulesModal && (
            <button
              onClick={onOpenRulesModal}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#15171b] dark:hover:bg-[#23262d] text-slate-700 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#333943] text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
              title="View Official League Rules"
            >
              <BookOpen className="h-3.5 w-3.5 text-slate-600 dark:text-[#a0aaba]" />
              <span>Rules</span>
            </button>
          )}

          {currentRole === 'public' ? (
            <div className="flex items-center space-x-2">
              {authRole === 'team_rep' && authTeamName && (
                <div className="hidden sm:flex items-center space-x-1.5 bg-white dark:bg-[#15171b] border border-slate-200 dark:border-[#333943] text-slate-700 dark:text-[#a0aaba] px-2.5 py-1 rounded-xl text-[11px]">
                  <UserCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Signed in: <strong className="text-slate-900 dark:text-white">{authTeamName}</strong></span>
                  <button
                    onClick={onLogout}
                    className="ml-1 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-semibold underline text-[10px]"
                    title="Log out from team"
                  >
                    Log Out
                  </button>
                </div>
              )}
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-xl bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] dark:text-white font-bold text-[11px] sm:text-xs shadow-xs flex items-center space-x-1 sm:space-x-1.5 transition-all shrink-0 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Team / Admin Login</span>
              </Link>
            </div>
          ) : currentRole === 'team_rep' ? (
            <div className="flex items-center space-x-2">
              <div className="bg-white dark:bg-[#15171b] border border-slate-200 dark:border-[#333943] text-slate-700 dark:text-[#a0aaba] px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                <UserCheck className="h-3.5 w-3.5 text-[#228a56] dark:text-[#34d399]" />
                <span className="hidden sm:inline">Captain:</span>
                <strong className="text-slate-900 dark:text-white truncate max-w-[120px]">{activeTeamName || 'Team'}</strong>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#15171b] dark:hover:bg-[#23262d] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#333943] transition-colors"
                title="Sign Out to Public View"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="bg-white dark:bg-[#15171b] border border-slate-200 dark:border-[#333943] text-slate-700 dark:text-[#a0aaba] px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0099ff] dark:text-[#007afc]" />
                <span>Admin Authorized</span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#15171b] dark:hover:bg-[#23262d] text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-[#333943] transition-colors"
                title="Sign Out to Public View"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
