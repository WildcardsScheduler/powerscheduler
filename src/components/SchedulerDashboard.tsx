'use client';

import React from 'react';
import { LeagueSeason, Division, Team, Match, Location } from '@/types/league';
import { ShieldCheck, Calendar, Sparkles, Building2, Plus, Layers, MapPin, Users, KeyRound } from 'lucide-react';

interface SchedulerDashboardProps {
  league: LeagueSeason;
  divisions: Division[];
  teams: Team[];
  matches: Match[];
  locations: Location[];
  onOpenGenerator: () => void;
  onOpenLocationManager: () => void;
  onOpenDivisionManager: () => void;
  onOpenTeamManager: () => void;
  onOpenLeagueManager: () => void;
  selectedDivisionId: string;
  onSelectDivision: (id: string) => void;
}

export const SchedulerDashboard: React.FC<SchedulerDashboardProps> = ({
  league,
  divisions,
  teams,
  matches,
  locations,
  onOpenGenerator,
  onOpenLocationManager,
  onOpenDivisionManager,
  onOpenTeamManager,
  onOpenLeagueManager,
  selectedDivisionId,
  onSelectDivision,
}) => {
  const refDutiesAssigned = matches.filter((m) => !!m.workTeamId).length;
  const totalSubLocations = locations.reduce((sum, loc) => sum + loc.subLocations.length, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">League Scheduler Portal</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure single vs multi-division structures, edit team rosters & captains, and run automated schedule generators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={onOpenLeagueManager}
            className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/20 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            <KeyRound className="h-4 w-4" />
            <span>Passcode & League Settings</span>
          </button>

          <button
            onClick={onOpenTeamManager}
            className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            <Users className="h-4 w-4" />
            <span>Manage Teams & Rosters</span>
          </button>

          <button
            onClick={onOpenDivisionManager}
            className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-violet-400 border border-violet-500/20 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            <Layers className="h-4 w-4" />
            <span>Manage Divisions</span>
          </button>

          <button
            onClick={onOpenLocationManager}
            className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/20 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            <Building2 className="h-4 w-4" />
            <span>Manage Venues</span>
          </button>

          <button
            onClick={onOpenGenerator}
            className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Auto-Generate Schedule</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Division Structure</span>
          <span className="text-xl font-extrabold text-violet-400">
            {league.hasDivisions === false ? 'Single Division' : `${divisions.length} Divisions`}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Locations / Sub-Locations</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-extrabold text-amber-400 font-mono">{locations.length}</span>
            <span className="text-xs text-slate-400">({totalSubLocations} Courts)</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Registered Teams</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">{teams.length}</span>
            <button
              onClick={onOpenTeamManager}
              className="text-[11px] text-emerald-400 hover:underline font-semibold"
            >
              + Edit
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Ref Matrix Assigned</span>
          <span className="text-2xl font-extrabold text-rose-400 font-mono">{refDutiesAssigned}</span>
        </div>
      </div>

      {/* Locations & Sub-locations Overview Summary Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Active Venues & Sub-Location Courts</h3>
          </div>
          <button
            onClick={onOpenLocationManager}
            className="text-xs font-semibold text-rose-400 hover:underline flex items-center space-x-1"
          >
            <span>+ Edit Venues</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3"
            >
              <div>
                <h4 className="font-extrabold text-white text-sm">{loc.name}</h4>
                <div className="flex items-center space-x-1 text-xs text-slate-400 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{loc.address}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                  Courts ({loc.subLocations.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {loc.subLocations.map((sub) => (
                    <span
                      key={sub.id}
                      className="bg-slate-900 text-slate-200 border border-slate-800 px-2 py-0.5 rounded-lg text-xs font-medium"
                    >
                      {sub.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
