'use client';

import React, { useState } from 'react';
import { Match, Team, Location, Division, SubLocation } from '@/types/league';
import { Calendar, Clock, MapPin, ShieldAlert, Edit3, CheckCircle2, Building2, Filter, Printer, Lock, Plus, Scale, Wrench } from 'lucide-react';
import { PrintScheduleModal } from './PrintScheduleModal';
import { formatTimeRange } from '@/utils/formatUtils';

interface ScheduleGridProps {
  matches: Match[];
  teams: Team[];
  locations: Location[];
  divisions: Division[];
  selectedDivisionId: string;
  onOpenScorekeeper: (match: Match) => void;
  onEditMatch?: (match: Match) => void;
  onAddMatch?: () => void;
  onOpenFairnessReport?: () => void;
  showFairnessReport?: boolean;
  readOnly?: boolean;
  currentRole?: 'public' | 'team_rep' | 'scheduler';
  userTeamId?: string;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  matches,
  teams,
  locations,
  divisions,
  selectedDivisionId,
  onOpenScorekeeper,
  onEditMatch,
  onAddMatch,
  onOpenFairnessReport,
  showFairnessReport = true,
  readOnly = false,
  currentRole,
  userTeamId,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('ALL');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]));

  // Helper to dynamically resolve Primary Location and Sub-Location for any match
  const getMatchLocation = (match: Match) => {
    const subLocId = match.subLocationId || match.courtId;
    const primaryLoc = locations.find(
      (l) => l.id === match.locationId || l.subLocations.some((s) => s.id === subLocId)
    );
    const subLoc = primaryLoc?.subLocations.find((s) => s.id === subLocId);
    return { primaryLoc, subLoc };
  };

  // Filter matches by division, week, and location
  const filteredMatches = matches.filter((m) => {
    if (m.divisionId !== selectedDivisionId) return false;
    if (m.weekNumber !== selectedWeek) return false;
    
    if (selectedLocationFilter !== 'ALL') {
      const { primaryLoc } = getMatchLocation(m);
      if (primaryLoc?.id !== selectedLocationFilter) return false;
    }

    return true;
  });

  const availableWeeks = Array.from(
    new Set(matches.filter((m) => m.divisionId === selectedDivisionId).map((m) => m.weekNumber))
  ).sort((a, b) => a - b);

  // Map each week number to the actual date of its first match
  const weekDateMap = new Map<number, string>();
  matches
    .filter((m) => m.divisionId === selectedDivisionId)
    .forEach((m) => {
      if (!weekDateMap.has(m.weekNumber)) {
        weekDateMap.set(m.weekNumber, m.date);
      }
    });

  return (
    <div className="bg-white dark:bg-[#15171b] border border-[#e5e7eb] dark:border-[#1c1f24] rounded-2xl p-4 sm:p-6 shadow-xs space-y-5 transition-colors duration-150">
      
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e5e7eb] dark:border-[#1c1f24]">
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-[#242424] dark:text-[#a0aaba]" />
            <h3 className="text-lg font-bold text-[#242424] dark:text-white tracking-tight">League Match Schedule</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {showFairnessReport && onOpenFairnessReport && (
              <button
                type="button"
                onClick={onOpenFairnessReport}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#242424] border border-[#e5e7eb] dark:bg-[#1c1f24] dark:hover:bg-[#23262d] dark:text-[#a0aaba] dark:hover:text-white dark:border-[#333943] text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
              >
                <Scale className="h-4 w-4" />
                <span>Fairness Report</span>
              </button>
            )}

            {currentRole === 'scheduler' && onAddMatch && (
              <button
                type="button"
                onClick={onAddMatch}
                className="px-3 py-1.5 rounded-xl bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] dark:text-white font-black text-xs flex items-center space-x-1.5 shadow-xs transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Match</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#242424] border border-[#e5e7eb] dark:bg-[#1c1f24] dark:hover:bg-[#23262d] dark:text-[#a0aaba] dark:hover:text-white dark:border-[#333943] text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Printer className="h-4 w-4" />
              <span>Print Schedules</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Location Filter Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <Filter className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            <select
              value={selectedLocationFilter}
              onChange={(e) => setSelectedLocationFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Week Selector Tabs */}
          {availableWeeks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-w-full">
              {availableWeeks.map((week) => {
                const dateStr = weekDateMap.get(week);
                const label = dateStr
                  ? new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-CA', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : null;
                return (
                  <button
                    key={week}
                    onClick={() => setSelectedWeek(week)}
                    className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all leading-tight ${
                      selectedWeek === week
                        ? 'bg-[#101010] text-white dark:bg-[#007afc] dark:text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1f24] text-slate-600 dark:text-[#a0aaba] hover:text-[#242424] dark:hover:text-white dark:hover:bg-[#23262d] border border-[#e5e7eb] dark:border-[#333943]'
                    }`}
                  >
                    <span>Wk {week}</span>
                    {label && (
                      <span className={`text-[10px] font-normal mt-0.5 ${
                        selectedWeek === week ? 'text-slate-300 dark:text-slate-200' : 'text-slate-500 dark:text-[#8b96aa]'
                      }`}>
                        {label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Matches Grid List */}
      {filteredMatches.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-400">
            No matches scheduled for Week {selectedWeek}
            {weekDateMap.get(selectedWeek) && (
              <span className="text-slate-500 dark:text-slate-400 font-normal text-xs ml-1">
                ({new Date(weekDateMap.get(selectedWeek)! + 'T12:00:00Z').toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })})
              </span>
            )}.
          </p>
          <p className="text-xs text-slate-500">Use the Auto-Schedule Generator to populate match fixtures.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => {
            const home = teamMap.get(match.homeTeamId);
            const away = teamMap.get(match.awayTeamId);
            const work = match.workTeamId ? teamMap.get(match.workTeamId) : undefined;
            const { primaryLoc, subLoc } = getMatchLocation(match);

            return (
              <div
                key={match.id}
                className="bg-slate-50 dark:bg-[#0e1012] border border-[#e5e7eb] dark:border-[#1c1f24] rounded-2xl p-4 space-y-3 hover:border-slate-300 dark:hover:border-[#333943] transition-all group relative overflow-hidden shadow-xs"
              >
                {/* Status & Location Bar Top */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#a0aaba]">
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <Clock className="h-3.5 w-3.5 text-slate-600 dark:text-[#a0aaba]" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatTimeRange(match.startTime, match.endTime)}</span>
                  </div>

                  {/* Primary Location + Sub-location Name */}
                  <div className="flex items-center space-x-1 text-slate-600 dark:text-[#a0aaba] bg-white dark:bg-[#15171b] px-2 py-0.5 rounded-lg border border-[#e5e7eb] dark:border-[#1c1f24] min-w-0 max-w-[55%] shadow-xs">
                    <Building2 className="h-3.5 w-3.5 text-[#242424] dark:text-[#a0aaba] shrink-0" />
                    <span
                      className="font-bold text-slate-800 dark:text-slate-200 truncate"
                      title={
                        primaryLoc && subLoc
                          ? `${primaryLoc.name} — ${subLoc.name}`
                          : primaryLoc
                          ? primaryLoc.name
                          : subLoc
                          ? subLoc.name
                          : `Court ${match.subLocationId || match.courtId}`
                      }
                    >
                      {primaryLoc && subLoc
                        ? `${primaryLoc.name} — ${subLoc.name}`
                        : primaryLoc
                        ? primaryLoc.name
                        : subLoc
                        ? subLoc.name
                        : `Court ${match.subLocationId || match.courtId}`}
                    </span>
                  </div>
                </div>

                {/* Match Teams Banner */}
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-2 px-3 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  {/* Home Team */}
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: home?.badgeColor || '#94a3b8' }}
                    />
                    <span
                      className={`text-xs font-bold truncate ${
                        match.winnerId === match.homeTeamId
                          ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                          : 'text-slate-900 dark:text-white'
                      }`}
                      title={home?.name || 'TBD'}
                    >
                      {home?.name || 'TBD'}
                    </span>
                  </div>

                  {/* Score / VS Badge */}
                  <div className="px-2.5 py-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-center shrink-0">
                    {match.status === 'Completed' && match.scores.length > 0 ? (
                      <div className="font-mono font-extrabold text-xs text-amber-600 dark:text-amber-400">
                        {match.scores.map((s) => `${s.homeScore}-${s.awayScore}`).join(' | ')}
                      </div>
                    ) : (
                      <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 tracking-widest">
                        VS
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center justify-end space-x-2 min-w-0">
                    <span
                      className={`text-xs font-bold truncate ${
                        match.winnerId === match.awayTeamId
                          ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                          : 'text-slate-900 dark:text-white'
                      }`}
                      title={away?.name || 'TBD'}
                    >
                      {away?.name || 'TBD'}
                    </span>
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: away?.badgeColor || '#94a3b8' }}
                    />
                  </div>
                </div>

                {/* Bottom Row: Work Team Ref & Scorekeeper Button */}
                <div className={`flex items-center ${work ? 'justify-between' : 'justify-end'} gap-2 text-xs pt-1`}>
                  {work && (
                    <div
                      className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-500/20 dark:border-amber-400/20 text-[11px] min-w-0 max-w-[65%]"
                      title={`Ref Duty: ${work.name}`}
                    >
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Ref Duty: <strong className="text-slate-900 dark:text-white">{work.name}</strong></span>
                    </div>
                  )}

                  {(() => {
                    const isTeamInvolved = Boolean(
                      userTeamId &&
                        (match.homeTeamId === userTeamId ||
                          match.awayTeamId === userTeamId ||
                          match.workTeamId === userTeamId)
                    );
                    const canReportScore =
                      currentRole === 'scheduler' ||
                      (currentRole === 'team_rep' && isTeamInvolved);

                    if (readOnly) {
                      return match.status === 'Completed' ? (
                        <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Official Final</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-medium">Scheduled</span>
                      );
                    }

                    if (!canReportScore) {
                      return (
                        <span
                          className="flex items-center space-x-1 text-slate-500 text-[11px] font-medium bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800"
                          title="Score reporting restricted to team captains playing in or refereeing this match"
                        >
                          <Lock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                          <span>Score Locked</span>
                        </span>
                      );
                    }

                    return (
                      <div className="flex items-center space-x-2">
                        {currentRole === 'scheduler' && onEditMatch && (
                          <button
                            type="button"
                            onClick={() => onEditMatch(match)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1f24] dark:hover:bg-[#23262d] text-[#242424] dark:text-[#a0aaba] font-medium text-xs transition-colors border border-[#e5e7eb] dark:border-[#333943] shadow-xs"
                            title="Edit & Reschedule Match Fixture"
                          >
                            <Wrench className="h-3.5 w-3.5 text-[#242424] dark:text-[#a0aaba]" />
                            <span>Edit Game</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenScorekeeper(match)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] dark:text-white font-semibold text-xs transition-colors shadow-xs"
                        >
                          {match.status === 'Completed' ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Edit Score</span>
                            </>
                          ) : (
                            <>
                              <Edit3 className="h-3.5 w-3.5 text-white" />
                              <span>Record Score</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Schedule Modal */}
      <PrintScheduleModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        matches={matches}
        teams={teams}
        locations={locations}
        divisions={divisions}
        selectedDivisionId={selectedDivisionId}
      />
    </div>
  );
};
