import React from 'react';
import { Volleyball, ShieldCheck, UserCheck, Trophy, Globe, LogIn, LogOut, Lock, BookOpen, Download } from 'lucide-react';
import { LeagueSeason } from '@/types/league';

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
  onOpenLoginModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  leagues,
  activeLeagueId,
  currentRole,
  authRole,
  authLeagueId,
  authLeagueName,
  activeTeamName,
  authTeamName,
  onRoleChange,
  onSelectLeague,
  onOpenLeagueManager,
  onOpenRulesModal,
  onOpenInstallModal,
  onOpenLoginModal,
  onLogout,
}) => {
  const activeLeague = leagues.find((l) => l.id === activeLeagueId) || leagues[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Multi-League Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 p-0.5 shadow-lg shadow-rose-500/20 shrink-0">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Volleyball className="h-4 w-4 sm:h-6 sm:w-6 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-base sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400 truncate">
                PowerSchedule
              </span>

              <span className="bg-amber-500/10 text-amber-400 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium border border-amber-500/20 shrink-0">
                {activeLeague?.sport || 'Volleyball'}
              </span>

              {/* Live Cloud Indicator */}
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/20 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
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
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              title="View Official League Rules"
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span>Rules</span>
            </button>
          )}

          {currentRole === 'public' ? (
            <div className="flex items-center space-x-2">
              {authRole === 'team_rep' && authTeamName && (
                <div className="hidden sm:flex items-center space-x-1.5 bg-slate-950 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-xl text-[11px]">
                  <UserCheck className="h-3 w-3 text-amber-400" />
                  <span>Signed in: <strong className="text-white">{authTeamName}</strong></span>
                  <button
                    onClick={onLogout}
                    className="ml-1 text-slate-400 hover:text-rose-400 font-semibold underline text-[10px]"
                    title="Log out from team"
                  >
                    Log Out
                  </button>
                </div>
              )}
              <button
                onClick={onOpenLoginModal}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-[11px] sm:text-xs shadow-md shadow-rose-500/20 flex items-center space-x-1 sm:space-x-1.5 transition-all shrink-0"
              >
                <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Team / Admin Login</span>
              </button>
            </div>
          ) : currentRole === 'team_rep' ? (
            <div className="flex items-center space-x-2">
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Captain:</span>
                <strong className="text-white truncate max-w-[120px]">{activeTeamName || 'Team'}</strong>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                title="Sign Out to Public View"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="bg-violet-500/10 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
                <span>Admin Authorized</span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                title="Sign Out to Public View"
              >
                <LogOut className="h-4 w-4 text-rose-400" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
