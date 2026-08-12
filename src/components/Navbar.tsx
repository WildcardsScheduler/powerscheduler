'use client';

import React from 'react';
import { Volleyball, ShieldCheck, UserCheck, Trophy, ChevronDown, Plus, Globe } from 'lucide-react';
import { LeagueSeason } from '@/types/league';

export type UserRole = 'public' | 'team_rep' | 'scheduler';

interface NavbarProps {
  leagues: LeagueSeason[];
  activeLeagueId: string;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSelectLeague: (id: string) => void;
  onOpenLeagueManager: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  leagues,
  activeLeagueId,
  currentRole,
  onRoleChange,
  onSelectLeague,
  onOpenLeagueManager,
}) => {
  const activeLeague = leagues.find((l) => l.id === activeLeagueId) || leagues[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Multi-League Switcher */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 p-0.5 shadow-lg shadow-rose-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Volleyball className="h-6 w-6 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400">
                PowerSchedule
              </span>
              <span className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded-full font-medium border border-amber-500/20">
                {activeLeague?.sport || 'Volleyball'}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Cloud
              </span>
            </div>

            {/* League Dropdown Selector */}
            <div className="flex items-center space-x-1.5 mt-0.5">
              <Trophy className="h-3 w-3 text-amber-400 shrink-0" />
              <select
                value={activeLeagueId}
                onChange={(e) => {
                  if (e.target.value === 'MANAGE') {
                    onOpenLeagueManager();
                  } else {
                    onSelectLeague(e.target.value);
                  }
                }}
                className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer hover:text-white truncate max-w-[200px]"
              >
                {leagues.map((l) => (
                  <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                    {l.name}
                  </option>
                ))}
                {currentRole === 'scheduler' && (
                  <option value="MANAGE" className="bg-slate-950 text-amber-400 font-bold">
                    + Manage / Create League...
                  </option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Role Switcher */}
        <div className="flex items-center space-x-2">
          {currentRole === 'scheduler' && (
            <button
              onClick={onOpenLeagueManager}
              className="hidden md:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-xs font-semibold text-amber-400 transition-all"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Leagues ({leagues.length})</span>
            </button>
          )}

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onRoleChange('public')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'public'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Public Portal</span>
              <span className="sm:hidden">Public</span>
            </button>

            <button
              onClick={() => onRoleChange('team_rep')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'team_rep'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-teal-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Team Rep</span>
            </button>

            <button
              onClick={() => onRoleChange('scheduler')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'scheduler'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
