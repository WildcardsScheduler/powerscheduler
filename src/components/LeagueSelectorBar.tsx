'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Star, Plus, Settings2, ChevronDown, Check } from 'lucide-react';
import { LeagueSeason } from '@/types/league';
import { UserRole } from './Navbar';

interface LeagueSelectorBarProps {
  leagues: LeagueSeason[];
  activeLeagueId: string;
  currentRole: UserRole;
  onSelectLeague: (leagueId: string) => void;
  onOpenLeagueManager: () => void;
}

export const LeagueSelectorBar: React.FC<LeagueSelectorBarProps> = ({
  leagues,
  activeLeagueId,
  currentRole,
  onSelectLeague,
  onOpenLeagueManager,
}) => {
  const [defaultLeagueId, setDefaultLeagueId] = useState<string | null>(null);
  const [justSavedDefault, setJustSavedDefault] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('powerschedule_default_league_id');
      if (saved) {
        setDefaultLeagueId(saved);
      }
    } catch {}
  }, []);

  const activeLeague = leagues.find((l) => l.id === activeLeagueId) || leagues[0];
  const isCurrentDefault = defaultLeagueId === activeLeagueId;

  const handleToggleDefault = () => {
    if (typeof window === 'undefined') return;
    try {
      if (isCurrentDefault) {
        localStorage.removeItem('powerschedule_default_league_id');
        setDefaultLeagueId(null);
      } else {
        localStorage.setItem('powerschedule_default_league_id', activeLeagueId);
        setDefaultLeagueId(activeLeagueId);
        setJustSavedDefault(true);
        setTimeout(() => setJustSavedDefault(false), 2500);
      }
    } catch (err) {
      console.error('Failed to set default league', err);
    }
  };

  return (
    <section aria-label="League Selection" className="bg-slate-900/95 border-b border-slate-800 text-white w-full shadow-sm backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left: League Selector Dropdown */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 max-w-full sm:max-w-xl">
          <div className="flex items-center space-x-1.5 shrink-0 text-amber-400">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-slate-400 hidden xs:inline">
              League:
            </span>
          </div>

          <div className="relative flex-1 min-w-[160px] max-w-sm">
            <select
              value={activeLeagueId}
              onChange={(e) => {
                if (e.target.value === 'MANAGE') {
                  onOpenLeagueManager();
                } else {
                  onSelectLeague(e.target.value);
                }
              }}
              className="w-full appearance-none bg-slate-950 hover:bg-slate-800/90 text-white font-bold text-xs sm:text-sm pl-3 pr-8 py-1.5 rounded-xl border border-slate-700/80 hover:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer transition-all shadow-inner truncate"
            >
              {leagues.map((l) => (
                <option key={l.id} value={l.id} className="bg-slate-900 text-white font-medium">
                  {l.name} {defaultLeagueId === l.id ? '★ (Your Default)' : ''}
                </option>
              ))}
              {currentRole === 'scheduler' && (
                <option value="MANAGE" className="bg-slate-950 text-amber-400 font-bold">
                  + Manage / Create Leagues...
                </option>
              )}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Quick League Count / Info */}
          {leagues.length > 1 && (
            <span className="hidden md:inline-block text-[11px] text-slate-400 shrink-0">
              ({leagues.length} leagues available)
            </span>
          )}
        </div>

        {/* Right: Default League Toggle & Admin Management Action */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* Set as Default Button */}
          <button
            onClick={handleToggleDefault}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border ${
              isCurrentDefault
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
            }`}
            title={isCurrentDefault ? 'This league opens by default when you visit' : 'Set this league to automatically open when you visit'}
          >
            <Star
              className={`h-3.5 w-3.5 transition-all ${
                isCurrentDefault ? 'fill-amber-400 text-amber-400 scale-110' : 'text-slate-400'
              }`}
            />
            <span>
              {justSavedDefault
                ? 'Saved as Default!'
                : isCurrentDefault
                ? 'Default League'
                : 'Set as Default'}
            </span>
            {isCurrentDefault && !justSavedDefault && (
              <Check className="h-3 w-3 text-amber-400 ml-0.5" />
            )}
          </button>

          {/* Admin Manage Leagues Button */}
          {currentRole === 'scheduler' && (
            <button
              onClick={onOpenLeagueManager}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 hover:border-amber-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              title="Add or Manage Leagues"
            >
              <Settings2 className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Manage Leagues</span>
            </button>
          )}

        </div>

      </div>
    </section>
  );
};
