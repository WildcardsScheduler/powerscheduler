'use client';

import React, { useState, useMemo } from 'react';
import { Match, Team, Division, Location, SubLocation } from '@/types/league';
import { X, Scale, Clock, Users, Eye, EyeOff } from 'lucide-react';
import { calculateScheduleFairnessReport, ScheduleFairnessReport } from '@/utils/schedulerEngine';
import { formatTimeRange } from '@/utils/formatUtils';
import { OpponentTimeline } from './OpponentTimeline';

interface FairnessReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  teams: Team[];
  divisions: Division[];
  locations: Location[];
  selectedDivisionId?: string;
  isCaptainOrPublic?: boolean;
  publicFairnessReport?: boolean;
  onTogglePublicFairnessReport?: (enabled: boolean) => void;
}

export const FairnessReportModal: React.FC<FairnessReportModalProps> = ({
  isOpen,
  onClose,
  matches,
  teams,
  divisions,
  locations,
  selectedDivisionId,
  isCaptainOrPublic = false,
  publicFairnessReport = true,
  onTogglePublicFairnessReport,
}) => {
  const [activeDivId, setActiveDivId] = useState<string>(
    selectedDivisionId || divisions[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'matrix' | 'h2h' | 'timeline'>('matrix');
  const [h2hFilter, setH2hFilter] = useState<'breakdown' | 'official' | 'exhibition' | 'all'>('breakdown');

  // Start on the currently selected division each time the modal opens
  // (state adjusted during render, per React's "reset state when a prop changes" pattern)
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setActiveDivId(
        selectedDivisionId && divisions.some((d) => d.id === selectedDivisionId)
          ? selectedDivisionId
          : divisions[0]?.id || ''
      );
    }
  }

  // Courts flat list
  const courts: SubLocation[] = useMemo(() => {
    return locations.flatMap((l) => l.subLocations);
  }, [locations]);

  // Resolve current active division
  const currentDiv = divisions.find((d) => d.id === activeDivId) || divisions[0];
  const effectiveDivId = currentDiv?.id || activeDivId;

  // Filter division teams & matches safely
  const divisionTeams = useMemo(() => {
    // If only 1 division (or single-division mode), show all teams
    if (divisions.length <= 1) {
      return teams;
    }
    const filtered = teams.filter((t) => !effectiveDivId || t.divisionId === effectiveDivId);
    return filtered.length > 0 ? filtered : teams;
  }, [teams, divisions, effectiveDivId]);

  const divisionMatches = useMemo(() => {
    if (divisions.length <= 1) {
      return matches;
    }
    const filtered = matches.filter((m) => !effectiveDivId || m.divisionId === effectiveDivId);
    return filtered.length > 0 ? filtered : matches;
  }, [matches, divisions, effectiveDivId]);

  // Calculate live fairness report
  const report: ScheduleFairnessReport = useMemo(() => {
    return calculateScheduleFairnessReport(divisionTeams, divisionMatches, courts);
  }, [divisionTeams, divisionMatches, courts]);

  if (!isOpen) return null;

  // Compute balance statistics. Game balance is judged on official games (the ones in the
  // standings); exhibition games are shown separately when the league has any.
  const gameCounts = report.teamMetrics.map((m) => m.officialGames);
  const minGames = gameCounts.length > 0 ? Math.min(...gameCounts) : 0;
  const maxGames = gameCounts.length > 0 ? Math.max(...gameCounts) : 0;
  const isGamesEqual = minGames === maxGames;
  const hasExhibitions = report.exhibitionMatchesCount > 0;
  const exhibitionCounts = report.teamMetrics.map((m) => m.exhibitionGames);
  const minExhibitions = exhibitionCounts.length > 0 ? Math.min(...exhibitionCounts) : 0;
  const maxExhibitions = exhibitionCounts.length > 0 ? Math.max(...exhibitionCounts) : 0;

  const refCounts = report.teamMetrics.map((m) => m.refDutyCount);
  const minRefs = refCounts.length > 0 ? Math.min(...refCounts) : 0;
  const maxRefs = refCounts.length > 0 ? Math.max(...refCounts) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#15171b] border-0 sm:border border-[#e5e7eb] dark:border-[#1c1f24] rounded-none sm:rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl sm:my-6 flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 transition-colors duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#0e1012] border-b border-[#e5e7eb] dark:border-[#1c1f24] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="hidden sm:block p-2.5 rounded-2xl bg-slate-100 dark:bg-[#1c1f24] text-[#242424] dark:text-[#a0aaba] border border-[#e5e7eb] dark:border-[#333943]">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-base font-extrabold text-[#242424] dark:text-white">
                  <span className="sm:hidden">Fairness Report</span>
                  <span className="hidden sm:inline">Schedule Fairness & Equity Audit Report</span>
                </h3>
                <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {isCaptainOrPublic ? 'Public & Team View' : 'Admin Audit Engine'}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                Mathematical balance inspection for game volume, time slot fairness, court equity, and referee duty.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!isCaptainOrPublic && onTogglePublicFairnessReport && (
              <button
                type="button"
                onClick={() => onTogglePublicFairnessReport(!publicFairnessReport)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  publicFairnessReport
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white shadow-xs'
                }`}
                title="Click to toggle whether teams and the public can view the fairness report"
              >
                {publicFairnessReport ? (
                  <>
                    <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Teams Access: <strong>Enabled</strong></span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <span>Teams Access: <strong>Hidden</strong></span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Division Selector & Tabs Bar */}
        <div className="p-4 bg-slate-100/70 dark:bg-[#0e1012] border-b border-[#e5e7eb] dark:border-[#1c1f24] flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Division Selector */}
          {divisions.length > 1 ? (
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mr-1">Division:</span>
              {divisions.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDivId(d.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeDivId === d.id
                      ? 'bg-[#101010] text-white dark:bg-[#007afc] dark:text-white shadow-xs font-black'
                      : 'bg-white hover:bg-slate-50 dark:bg-[#1c1f24] text-slate-600 dark:text-[#a0aaba] hover:text-[#242424] dark:hover:text-white border border-[#e5e7eb] dark:border-[#333943] shadow-xs'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-800 dark:text-slate-300">
              {currentDiv?.name || 'Main Division'} ({divisionTeams.length} Teams)
            </div>
          )}

          {/* Sub Tabs */}
          <div className="flex items-center space-x-1.5 bg-white dark:bg-[#1c1f24] p-1 rounded-xl border border-[#e5e7eb] dark:border-[#333943] shadow-xs">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'matrix'
                  ? 'bg-[#101010] text-white dark:bg-[#007afc] dark:text-white font-black shadow-xs'
                  : 'text-slate-600 dark:text-[#a0aaba] hover:text-[#242424] dark:hover:text-white'
              }`}
            >
              Time Slots & Court Matrix
            </button>
            <button
              onClick={() => setActiveTab('h2h')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'h2h'
                  ? 'bg-[#101010] text-white dark:bg-[#007afc] dark:text-white font-black shadow-xs'
                  : 'text-slate-600 dark:text-[#a0aaba] hover:text-[#242424] dark:hover:text-white'
              }`}
            >
              Head-to-Head Opponent Grid
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-[#101010] text-white dark:bg-[#007afc] dark:text-white font-black shadow-xs'
                  : 'text-slate-600 dark:text-[#a0aaba] hover:text-[#242424] dark:hover:text-white'
              }`}
            >
              Opponent Timeline
            </button>
          </div>

        </div>

        {/* Scrollable Report Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* 1. Summary Fairness Health Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Game Count Balance */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-3.5 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                {hasExhibitions ? 'Official Games per Team' : 'Games per Team'}
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-lg font-black text-slate-900 dark:text-white">{minGames}</span>
                {!isGamesEqual && (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">- {maxGames}</span>
                )}
              </div>
              <p className={`text-[10px] font-bold ${isGamesEqual ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isGamesEqual ? '✓ 100% Equal Games' : `±${maxGames - minGames} Game Variance`}
              </p>
              {hasExhibitions && (
                <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                  + {minExhibitions === maxExhibitions ? maxExhibitions : `${minExhibitions}–${maxExhibitions}`} exhibition
                  {maxExhibitions === 1 ? '' : 's'}
                </p>
              )}
            </div>

            {/* Total Fixtures */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-3.5 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Total Matches</span>
              <div className="text-lg font-black text-slate-900 dark:text-white">{report.totalMatches}</div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {report.officialMatchesCount} Official • {report.exhibitionMatchesCount} Exhibition
              </p>
            </div>

            {/* Double Headers */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-3.5 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Double Headers</span>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                {report.teamMetrics.reduce((sum, m) => sum + m.doubleHeaderCount, 0)}
              </div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Balanced across schedule</p>
            </div>

            {/* Referee Duty Balance */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-3.5 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Referee Assignments</span>
              <div className="text-lg font-black text-violet-600 dark:text-violet-400">
                {minRefs === maxRefs ? minRefs : `${minRefs}-${maxRefs}`}
              </div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Per-team ref balance</p>
            </div>

          </div>

          {/* 2. Main Matrix Tab View */}
          {activeTab === 'matrix' ? (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl space-y-2">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    <span>Time Slot, Court & Home/Away Breakdown Matrix</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Verifies each team receives an equitable distribution of prime-time slots and court assignments.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Team</th>
                      {hasExhibitions ? (
                        <>
                          <th className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400">Official</th>
                          <th className="py-3 px-3 text-center text-purple-600 dark:text-purple-400">Exhibition</th>
                        </>
                      ) : (
                        <th className="py-3 px-3 text-center">Total</th>
                      )}
                      <th className="py-3 px-3 text-center">H / A</th>
                      <th className="py-3 px-3 text-center">Dbl Hdr</th>
                      
                      {/* Dynamic Time Slot Columns */}
                      {report.effectiveTimeSlots.map((slot) => (
                        <th key={slot} className="py-3 px-3 text-center text-amber-600 dark:text-amber-300">
                          {formatTimeRange(slot)}
                        </th>
                      ))}

                      {/* Dynamic Court Columns */}
                      {courts.map((court) => (
                        <th key={court.id} className="py-3 px-3 text-center text-rose-600 dark:text-rose-300">
                          {court.name}
                        </th>
                      ))}

                      <th className="py-3 px-3 text-center text-violet-600 dark:text-violet-300">Refs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                    {report.teamMetrics.map((metric) => (
                      <tr key={metric.teamId} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {metric.teamName}
                        </td>
                        {hasExhibitions ? (
                          <>
                            <td className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {metric.officialGames}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-purple-600 dark:text-purple-400">
                              {metric.exhibitionGames || <span className="text-slate-300 dark:text-slate-600">0</span>}
                            </td>
                          </>
                        ) : (
                          <td className="py-2.5 px-3 text-center font-bold text-amber-600 dark:text-amber-400">
                            {metric.totalGames}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{metric.homeGames || 0}H</span>
                          <span className="text-slate-400 dark:text-slate-500"> / </span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">{metric.awayGames || 0}A</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300">
                          {metric.doubleHeaderCount}
                        </td>

                        {/* Time Slots Breakdown */}
                        {report.effectiveTimeSlots.map((slot) => {
                          const count = metric.timeSlotCounts[slot] || 0;
                          return (
                            <td
                              key={slot}
                              className={`py-2.5 px-3 text-center ${
                                count === 0
                                  ? 'text-slate-400 dark:text-slate-600'
                                  : 'text-slate-900 dark:text-white font-bold bg-slate-50 dark:bg-slate-900/40'
                              }`}
                            >
                              {count}
                            </td>
                          );
                        })}

                        {/* Court Breakdown */}
                        {courts.map((court) => {
                          const count = metric.courtCounts[court.id] || 0;
                          return (
                            <td
                              key={court.id}
                              className={`py-2.5 px-3 text-center ${
                                count === 0
                                  ? 'text-slate-400 dark:text-slate-600'
                                  : 'text-slate-900 dark:text-white font-bold bg-slate-50 dark:bg-slate-900/20'
                              }`}
                            >
                              {count}
                            </td>
                          );
                        })}

                        {/* Referee Duty Count */}
                        <td className="py-2.5 px-3 text-center text-violet-600 dark:text-violet-400 font-bold">
                          {metric.refDutyCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'timeline' ? (
            <OpponentTimeline teams={divisionTeams} matches={divisionMatches} />
          ) : (
            /* 3. Head-to-Head Opponent Grid */
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl space-y-2">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Users className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    <span>Head-to-Head Matchup Matrix</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {h2hFilter === 'breakdown' && 'Showing breakdown: Official League (L) + Exhibition Filler (E)'}
                    {h2hFilter === 'official' && 'Showing Official Standings Matches only (counts toward league rankings)'}
                    {h2hFilter === 'exhibition' && 'Showing Exhibition / Capacity Filler Matches only (does not affect standings)'}
                    {h2hFilter === 'all' && 'Showing Total Combined Matchups (Official + Exhibition)'}
                  </p>
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setH2hFilter('breakdown')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      h2hFilter === 'breakdown'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Breakdown (L + E)
                  </button>
                  <button
                    type="button"
                    onClick={() => setH2hFilter('official')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      h2hFilter === 'official'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Official Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setH2hFilter('exhibition')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      h2hFilter === 'exhibition'
                        ? 'bg-purple-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Exhibition Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setH2hFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      h2hFilter === 'all'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All Combined
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto p-3">
                <table className="w-full text-center text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Team</th>
                      {divisionTeams.map((t) => (
                        <th key={t.id} className="py-2.5 px-2 text-[10px] text-slate-700 dark:text-slate-300 font-bold min-w-[70px]">
                          {t.name.slice(0, 10)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                    {divisionTeams.map((t1) => (
                      <tr key={t1.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 text-left font-sans font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {t1.name}
                        </td>
                        {divisionTeams.map((t2) => {
                          if (t1.id === t2.id) {
                            return (
                              <td key={t2.id} className="py-2.5 px-2 text-slate-400 dark:text-slate-700 bg-slate-100 dark:bg-slate-900/80">
                                —
                              </td>
                            );
                          }
                          const totalCount = report.opponentMatrix[t1.id]?.[t2.id] || 0;
                          const offCount = report.officialOpponentMatrix?.[t1.id]?.[t2.id] ?? 0;
                          const exhCount = report.exhibitionOpponentMatrix?.[t1.id]?.[t2.id] ?? 0;

                          return (
                            <td key={t2.id} className="py-2.5 px-2">
                              {h2hFilter === 'breakdown' && (
                                <div>
                                  {totalCount === 0 ? (
                                    <span className="text-slate-400 dark:text-slate-600">0</span>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1 text-[11px]">
                                      {offCount > 0 && (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20" title={`${offCount} Official League Game(s)`}>
                                          {offCount}L
                                        </span>
                                      )}
                                      {offCount > 0 && exhCount > 0 && (
                                        <span className="text-slate-400 dark:text-slate-600 text-[10px]">+</span>
                                      )}
                                      {exhCount > 0 && (
                                        <span className="text-purple-600 dark:text-purple-400 font-bold bg-purple-500/10 px-1 py-0.5 rounded border border-purple-500/20" title={`${exhCount} Exhibition Game(s)`}>
                                          {exhCount}E
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {h2hFilter === 'official' && (
                                <span
                                  className={`font-bold ${
                                    offCount > 0
                                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20'
                                      : 'text-slate-400 dark:text-slate-600'
                                  }`}
                                >
                                  {offCount > 0 ? `${offCount}x` : '0'}
                                </span>
                              )}
                              {h2hFilter === 'exhibition' && (
                                <span
                                  className={`font-bold ${
                                    exhCount > 0
                                      ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20'
                                      : 'text-slate-400 dark:text-slate-600'
                                  }`}
                                >
                                  {exhCount > 0 ? `${exhCount}x` : '0'}
                                </span>
                              )}
                              {h2hFilter === 'all' && (
                                <span
                                  className={`font-bold ${
                                    totalCount > 0
                                      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20'
                                      : 'text-slate-400 dark:text-slate-600'
                                  }`}
                                >
                                  {totalCount > 0 ? `${totalCount}x` : '0'}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/40 inline-flex items-center justify-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">L</span>
                  <span><strong>Official League Matches</strong> (Standings & Rankings)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-purple-500/20 border border-purple-500/40 inline-flex items-center justify-center text-[9px] font-bold text-purple-600 dark:text-purple-400">E</span>
                  <span><strong>Exhibition Matches</strong> (Capacity Fillers)</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
