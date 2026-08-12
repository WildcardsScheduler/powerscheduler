'use client';

import React, { useState } from 'react';
import { Match, Team, Location, Division, SubLocation } from '@/types/league';
import { Calendar, Clock, MapPin, ShieldAlert, Edit3, CheckCircle2, Building2, Filter, Printer, Lock } from 'lucide-react';
import { PrintScheduleModal } from './PrintScheduleModal';
import { formatTimeRange } from '@/utils/formatUtils';

interface ScheduleGridProps {
  matches: Match[];
  teams: Team[];
  locations: Location[];
  divisions: Division[];
  selectedDivisionId: string;
  onOpenScorekeeper: (match: Match) => void;
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
      
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-rose-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">League Match Schedule</h3>
          </div>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Print Schedules</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Location Filter Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="h-3.5 w-3.5 text-amber-400" />
            <select
              value={selectedLocationFilter}
              onChange={(e) => setSelectedLocationFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-slate-900 text-white">
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Week Selector Tabs — wraps to multiple rows, never stretches the page */}
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
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>Wk {week}</span>
                    {label && (
                      <span className={`text-[10px] font-normal mt-0.5 ${
                        selectedWeek === week ? 'text-rose-100' : 'text-slate-500'
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
          <p className="text-sm font-medium">
            No matches scheduled for Week {selectedWeek}
            {weekDateMap.get(selectedWeek) && (
              <span className="text-slate-400 font-normal text-xs ml-1">
                ({new Date(weekDateMap.get(selectedWeek)! + 'T12:00:00Z').toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })})
              </span>
            )}.
          </p>
          <p className="text-xs">Use the Auto-Schedule Generator to populate match fixtures.</p>
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
                className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-all group relative overflow-hidden"
              >
                {/* Status & Location Bar Top */}
                {/* Status & Location Bar Top */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>{formatTimeRange(match.startTime, match.endTime)}</span>
                  </div>

                  {/* Primary Location + Sub-location Name */}
                  <div className="flex items-center space-x-1 text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 min-w-0 max-w-[55%]">
                    <Building2 className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    <span
                      className="font-bold text-slate-200 truncate"
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
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-2 px-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  {/* Home Team */}
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: home?.badgeColor || '#94a3b8' }}
                    />
                    <span
                      className={`text-xs font-bold truncate ${
                        match.winnerId === match.homeTeamId
                          ? 'text-emerald-400 font-extrabold'
                          : 'text-white'
                      }`}
                      title={home?.name || 'TBD'}
                    >
                      {home?.name || 'TBD'}
                    </span>
                  </div>

                  {/* Score / VS Badge */}
                  <div className="px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-center shrink-0">
                    {match.status === 'Completed' && match.scores.length > 0 ? (
                      <div className="font-mono font-extrabold text-xs text-amber-400">
                        {match.scores.map((s) => `${s.homeScore}-${s.awayScore}`).join(' | ')}
                      </div>
                    ) : (
                      <span className="text-[11px] font-extrabold text-slate-500 tracking-widest">
                        VS
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center justify-end space-x-2 min-w-0">
                    <span
                      className={`text-xs font-bold truncate ${
                        match.winnerId === match.awayTeamId
                          ? 'text-emerald-400 font-extrabold'
                          : 'text-white'
                      }`}
                      title={away?.name || 'TBD'}
                    >
                      {away?.name || 'TBD'}
                    </span>
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: away?.badgeColor || '#94a3b8' }}
                    />
                  </div>
                </div>

                {/* Bottom Row: Work Team Ref & Scorekeeper Button */}
                <div className="flex items-center justify-between gap-2 text-xs pt-1">
                  {work ? (
                    <div
                      className="flex items-center space-x-1.5 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 text-[11px] min-w-0 max-w-[65%]"
                      title={`Ref Duty: ${work.name}`}
                    >
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Ref Duty: <strong className="text-white">{work.name}</strong></span>
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[11px] shrink-0">No Ref Assigned</span>
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
                        <span className="flex items-center space-x-1 text-emerald-400 text-[11px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
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
                          className="flex items-center space-x-1 text-slate-500 text-[11px] font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800"
                          title="Score reporting restricted to team captains playing in or refereeing this match"
                        >
                          <Lock className="h-3 w-3 text-slate-500" />
                          <span>Score Locked</span>
                        </span>
                      );
                    }

                    return (
                      <button
                        onClick={() => onOpenScorekeeper(match)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors border border-slate-700"
                      >
                        {match.status === 'Completed' ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Edit Score</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="h-3.5 w-3.5 text-amber-400" />
                            <span>Record Score</span>
                          </>
                        )}
                      </button>
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
