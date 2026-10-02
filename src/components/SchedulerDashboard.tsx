'use client';

import React from 'react';
import { LeagueSeason, Division, Team, Match, Location } from '@/types/league';
import { ShieldCheck, Sparkles, Building2, Layers, MapPin, Users, Settings2, BookOpen, Scale, DatabaseBackup } from 'lucide-react';

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
  onOpenRulesModal?: () => void;
  onOpenFairnessReport?: () => void;
  onOpenBackups?: () => void;
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
  onOpenRulesModal,
  onOpenFairnessReport,
  onOpenBackups,
}) => {
  const refDutiesAssigned = matches.filter((m) => !!m.workTeamId).length;
  const totalSubLocations = locations.reduce((sum, loc) => sum + loc.subLocations.length, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Actions */}
      <div className="bg-white dark:bg-[#15171b] border border-slate-200 dark:border-[#1c1f24] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors duration-150">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-[#101010] dark:text-[#ffffff]" />
            <h2 className="text-xl font-extrabold text-[#101010] dark:text-[#ffffff] tracking-tight">League Scheduler Portal</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#8b96aa] mt-1">
            Configure single vs multi-division structures, edit team rosters & captains, and run automated schedule generators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {onOpenFairnessReport && (
            <button
              onClick={onOpenFairnessReport}
              className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#1c1f24] dark:hover:bg-[#23262d] text-slate-700 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#333943] font-semibold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5"
            >
              <Scale className="h-4 w-4 text-slate-600 dark:text-[#a0aaba]" />
              <span>Fairness Report</span>
            </button>
          )}

          {onOpenRulesModal && (
            <button
              onClick={onOpenRulesModal}
              className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#1c1f24] dark:hover:bg-[#23262d] text-slate-700 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#333943] font-semibold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5"
            >
              <BookOpen className="h-4 w-4 text-slate-600 dark:text-[#a0aaba]" />
              <span>Edit League Rules</span>
            </button>
          )}

          {onOpenBackups && (
            <button
              onClick={onOpenBackups}
              className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#1c1f24] dark:hover:bg-[#23262d] text-slate-700 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#333943] font-semibold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5"
            >
              <DatabaseBackup className="h-4 w-4 text-slate-600 dark:text-[#a0aaba]" />
              <span>Backups</span>
            </button>
          )}

          <button
            onClick={onOpenLeagueManager}
            className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#1c1f24] dark:hover:bg-[#23262d] text-slate-700 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#333943] font-semibold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5"
          >
            <Settings2 className="h-4 w-4 text-slate-600 dark:text-[#a0aaba]" />
            <span>League Settings</span>
          </button>

          <button
            onClick={onOpenTeamManager}
            className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#1c1f24] dark:hover:bg-[#23262d] text-slate-700 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#333943] font-semibold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5"
          >
            <Users className="h-4 w-4 text-slate-600 dark:text-[#a0aaba]" />
            <span>Manage Teams & Rosters</span>
          </button>

          <button
            onClick={onOpenDivisionManager}
            className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#1c1f24] dark:hover:bg-[#23262d] text-slate-700 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#333943] font-semibold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5"
          >
            <Layers className="h-4 w-4 text-slate-600 dark:text-[#a0aaba]" />
            <span>Manage Divisions</span>
          </button>

          <button
            onClick={onOpenLocationManager}
            className="flex-1 lg:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#1c1f24] dark:hover:bg-[#23262d] text-slate-700 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#333943] font-semibold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5"
          >
            <Building2 className="h-4 w-4 text-slate-600 dark:text-[#a0aaba]" />
            <span>Manage Venues</span>
          </button>

          <button
            onClick={onOpenGenerator}
            className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] dark:text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Auto-Generate Schedule</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#15171b] border border-slate-200 dark:border-[#1c1f24] rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-[#8b96aa] uppercase tracking-wider block">Division Structure</span>
          <span className="text-xl font-extrabold text-[#101010] dark:text-[#ffffff]">
            {league.hasDivisions === false ? 'Single Division' : `${divisions.length} Divisions`}
          </span>
        </div>

        <div className="bg-white dark:bg-[#15171b] border border-slate-200 dark:border-[#1c1f24] rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-[#8b96aa] uppercase tracking-wider block">Locations / Sub-Locations</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-extrabold text-[#101010] dark:text-[#ffffff] font-mono">{locations.length}</span>
            <span className="text-xs text-slate-500 dark:text-[#8b96aa]">({totalSubLocations} Courts)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#15171b] border border-slate-200 dark:border-[#1c1f24] rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-[#8b96aa] uppercase tracking-wider block">Registered Teams</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#101010] dark:text-[#ffffff] font-mono">{teams.length}</span>
            <button
              onClick={onOpenTeamManager}
              className="text-[11px] text-[#0099ff] dark:text-[#007afc] hover:underline font-semibold"
            >
              + Edit
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#15171b] border border-slate-200 dark:border-[#1c1f24] rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-[#8b96aa] uppercase tracking-wider block">Ref Matrix Assigned</span>
          <span className="text-2xl font-extrabold text-[#101010] dark:text-[#ffffff] font-mono">{refDutiesAssigned}</span>
        </div>
      </div>

      {/* Locations & Sub-locations Overview Summary Cards */}
      <div className="bg-white dark:bg-[#15171b] border border-slate-200 dark:border-[#1c1f24] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 transition-colors duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1c1f24]">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-slate-600 dark:text-[#a0aaba]" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Venues & Sub-Location Courts</h3>
          </div>
          <button
            onClick={onOpenLocationManager}
            className="text-xs font-semibold text-[#0099ff] dark:text-[#007afc] hover:underline flex items-center space-x-1"
          >
            <span>+ Edit Venues</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
            >
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{loc.name}</h4>
                <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span className="truncate">{loc.address}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                  Courts ({loc.subLocations.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {loc.subLocations.map((sub) => (
                    <span
                      key={sub.id}
                      className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-lg text-xs font-medium shadow-2xs"
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
