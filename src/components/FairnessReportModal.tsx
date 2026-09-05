'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Match, Team, Division, Location, SubLocation } from '@/types/league';
import { X, Scale, CheckCircle2, Clock, MapPin, ShieldAlert, ArrowLeftRight, Users, Printer, Sparkles, Filter, Info } from 'lucide-react';
import { calculateScheduleFairnessReport, ScheduleFairnessReport } from '@/utils/schedulerEngine';
import { formatTimeRange } from '@/utils/formatUtils';

interface FairnessReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  teams: Team[];
  divisions: Division[];
  locations: Location[];
  selectedDivisionId?: string;
  isCaptainOrPublic?: boolean;
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
}) => {
  const [activeDivId, setActiveDivId] = useState<string>(
    selectedDivisionId || divisions[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'matrix' | 'h2h'>('matrix');

  // Re-sync active division whenever modal opens or division props change
  useEffect(() => {
    if (isOpen) {
      if (selectedDivisionId && divisions.some((d) => d.id === selectedDivisionId)) {
        setActiveDivId(selectedDivisionId);
      } else if (divisions.length > 0) {
        setActiveDivId(divisions[0].id);
      } else {
        setActiveDivId('');
      }
    }
  }, [isOpen, selectedDivisionId, divisions]);

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
    // If no teams match this division ID (e.g. legacy/orphaned IDs), fall back to all teams
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

  // Compute balance statistics
  const gameCounts = report.teamMetrics.map((m) => m.totalGames);
  const minGames = gameCounts.length > 0 ? Math.min(...gameCounts) : 0;
  const maxGames = gameCounts.length > 0 ? Math.max(...gameCounts) : 0;
  const isGamesEqual = minGames === maxGames;

  const refCounts = report.teamMetrics.map((m) => m.refDutyCount);
  const minRefs = refCounts.length > 0 ? Math.min(...refCounts) : 0;
  const maxRefs = refCounts.length > 0 ? Math.max(...refCounts) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">
                  Schedule Fairness & Equity Audit Report
                </h3>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {isCaptainOrPublic ? 'Public & Team View' : 'Admin Audit Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mathematical balance inspection for game volume, time slot fairness, court equity, and referee duty.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Division Selector & Tabs Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Division Selector */}
          {divisions.length > 1 ? (
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
              <span className="text-xs text-slate-400 font-semibold mr-1">Division:</span>
              {divisions.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDivId(d.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeDivId === d.id
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-300">
              {currentDiv?.name || 'Main Division'} ({divisionTeams.length} Teams)
            </div>
          )}

          {/* Sub Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'matrix'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Time Slots & Court Matrix
            </button>
            <button
              onClick={() => setActiveTab('h2h')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'h2h'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Head-to-Head Opponent Grid
            </button>
          </div>

        </div>

        {/* Scrollable Report Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* 1. Summary Fairness Health Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Game Count Balance */}
            <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Games per Team</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-lg font-black text-white">{minGames}</span>
                {!isGamesEqual && (
                  <span className="text-xs font-bold text-amber-400 font-mono">- {maxGames}</span>
                )}
              </div>
              <p className={`text-[10px] font-bold ${isGamesEqual ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isGamesEqual ? '✓ 100% Equal Games' : `±${maxGames - minGames} Game Variance`}
              </p>
            </div>

            {/* Total Fixtures */}
            <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Matches</span>
              <div className="text-lg font-black text-white">{report.totalMatches}</div>
              <p className="text-[10px] font-semibold text-slate-400">
                {report.officialMatchesCount} Official • {report.exhibitionMatchesCount} Exhibition
              </p>
            </div>

            {/* Double Headers */}
            <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Double Headers</span>
              <div className="text-lg font-black text-amber-400">
                {report.teamMetrics.reduce((sum, m) => sum + m.doubleHeaderCount, 0)}
              </div>
              <p className="text-[10px] font-semibold text-slate-400">Balanced across schedule</p>
            </div>

            {/* Referee Duty Balance */}
            <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Referee Assignments</span>
              <div className="text-lg font-black text-violet-400">
                {minRefs === maxRefs ? minRefs : `${minRefs}-${maxRefs}`}
              </div>
              <p className="text-[10px] font-semibold text-slate-400">Per-team ref balance</p>
            </div>

          </div>

          {/* 2. Main Matrix Tab View */}
          {activeTab === 'matrix' ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-2">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>Time Slot, Court & Home/Away Breakdown Matrix</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verifies each team receives an equitable distribution of prime-time slots and court assignments.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-3 text-center">Total</th>
                      <th className="py-3 px-3 text-center">H / A</th>
                      <th className="py-3 px-3 text-center">Dbl Hdr</th>
                      
                      {/* Dynamic Time Slot Columns */}
                      {report.effectiveTimeSlots.map((slot) => (
                        <th key={slot} className="py-3 px-3 text-center text-amber-300">
                          {formatTimeRange(slot)}
                        </th>
                      ))}

                      {/* Dynamic Court Columns */}
                      {courts.map((court) => (
                        <th key={court.id} className="py-3 px-3 text-center text-rose-300">
                          {court.name}
                        </th>
                      ))}

                      <th className="py-3 px-3 text-center text-violet-300">Refs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {report.teamMetrics.map((metric) => (
                      <tr key={metric.teamId} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-4 font-sans font-bold text-white whitespace-nowrap">
                          {metric.teamName}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                          {metric.totalGames}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-300 whitespace-nowrap">
                          <span className="text-emerald-400">{metric.homeGames || 0}H</span>
                          <span className="text-slate-500"> / </span>
                          <span className="text-rose-400">{metric.awayGames || 0}A</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-300">
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
                                  ? 'text-slate-600'
                                  : 'text-white font-bold bg-slate-900/40'
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
                                  ? 'text-slate-600'
                                  : 'text-white font-bold bg-slate-900/20'
                              }`}
                            >
                              {count}
                            </td>
                          );
                        })}

                        {/* Referee Duty Count */}
                        <td className="py-2.5 px-3 text-center text-violet-400 font-bold">
                          {metric.refDutyCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 3. Head-to-Head Opponent Grid */
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-2">
              <div className="p-4 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Users className="h-4 w-4 text-amber-400" />
                  <span>Head-to-Head Matchup Matrix</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Shows the exact number of times each team faces every opposing team during the season.
                </p>
              </div>

              <div className="overflow-x-auto p-2">
                <table className="w-full text-center text-xs">
                  <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Team</th>
                      {divisionTeams.map((t) => (
                        <th key={t.id} className="py-2.5 px-2 text-[10px] text-slate-300 font-bold">
                          {t.name.slice(0, 8)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {divisionTeams.map((t1) => (
                      <tr key={t1.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 text-left font-sans font-bold text-white whitespace-nowrap">
                          {t1.name}
                        </td>
                        {divisionTeams.map((t2) => {
                          if (t1.id === t2.id) {
                            return (
                              <td key={t2.id} className="py-2.5 px-2 text-slate-700 bg-slate-900/80">
                                —
                              </td>
                            );
                          }
                          const matchups = report.opponentMatrix[t1.id]?.[t2.id] || 0;
                          return (
                            <td
                              key={t2.id}
                              className={`py-2.5 px-2 font-bold ${
                                matchups === 0
                                  ? 'text-slate-600'
                                  : 'text-amber-400 bg-amber-500/10'
                              }`}
                            >
                              {matchups}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
