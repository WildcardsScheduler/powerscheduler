'use client';

import React, { useState, useEffect } from 'react';
import { Match, Team, Division, SetScore, MatchRules, DEFAULT_MATCH_RULES } from '@/types/league';
import { X, CheckCircle, Plus, Minus, Trophy, ShieldAlert, Info, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatTime } from '@/utils/formatUtils';

interface ScorekeeperModalProps {
  match: Match;
  homeTeam?: Team;
  awayTeam?: Team;
  workTeam?: Team;
  division?: Division;
  leagueRules?: MatchRules;
  isOpen: boolean;
  onClose: () => void;
  onSaveScore: (matchId: string, scores: SetScore[], winnerId: string) => void;
}

export const ScorekeeperModal: React.FC<ScorekeeperModalProps> = ({
  match,
  homeTeam,
  awayTeam,
  workTeam,
  division,
  leagueRules,
  isOpen,
  onClose,
  onSaveScore,
}) => {
  const activeRules: MatchRules = division?.matchRules || leagueRules || DEFAULT_MATCH_RULES;
  const totalSets = activeRules.totalSets || 3;

  const [sets, setSets] = useState<SetScore[]>(() => {
    if (match.scores && match.scores.length > 0) return match.scores;
    // Generate initial sets matching active rules
    return Array.from({ length: totalSets }, (_, i) => {
      const setNum = i + 1;
      const targetPts = setNum === totalSets && totalSets > 2 ? activeRules.pointsPerDecidingSet : activeRules.pointsPerSet;
      return {
        setNumber: setNum,
        homeScore: setNum === 1 ? targetPts : setNum === 2 ? targetPts - 3 : 0,
        awayScore: setNum === 1 ? targetPts - 4 : setNum === 2 ? targetPts : 0,
      };
    });
  });

  const [includeOptionalSet, setIncludeOptionalSet] = useState<boolean>(true);

  // Sync state if match or totalSets changes
  useEffect(() => {
    if (match.scores && match.scores.length > 0) {
      setSets(match.scores);
    } else {
      setSets(
        Array.from({ length: totalSets }, (_, i) => {
          const setNum = i + 1;
          const targetPts = setNum === totalSets && totalSets > 2 ? activeRules.pointsPerDecidingSet : activeRules.pointsPerSet;
          return {
            setNumber: setNum,
            homeScore: setNum === 1 ? targetPts : setNum === 2 ? targetPts - 3 : 0,
            awayScore: setNum === 1 ? targetPts - 4 : setNum === 2 ? targetPts : 0,
          };
        })
      );
    }
  }, [match.id, totalSets]);

  if (!isOpen || !homeTeam || !awayTeam) return null;

  const updateSetScore = (setIndex: number, isHome: boolean, delta: number) => {
    const updated = [...sets];
    const targetSet = { ...updated[setIndex] };

    if (isHome) {
      targetSet.homeScore = Math.max(0, targetSet.homeScore + delta);
    } else {
      targetSet.awayScore = Math.max(0, targetSet.awayScore + delta);
    }

    updated[setIndex] = targetSet;
    setSets(updated);
  };

  // Determine sets won up to deciding set
  let homeSetsWon = 0;
  let awaySetsWon = 0;

  // Check if Best of 3 / 5 format with play_if_tied condition
  const isBestOfFormat = activeRules.thirdSetRule === 'play_if_tied' && totalSets > 2;
  const setsNeededToWin = Math.ceil(totalSets / 2); // e.g. 2 for Best of 3, 3 for Best of 5

  // Calculate sets won for initial sets before deciding set
  const nonDecidingSetsCount = totalSets - 1;
  let homeEarlyWins = 0;
  let awayEarlyWins = 0;

  sets.slice(0, nonDecidingSetsCount).forEach((s) => {
    if (s.homeScore > s.awayScore) homeEarlyWins += 1;
    if (s.awayScore > s.awayScore || s.awayScore > s.homeScore) awayEarlyWins += 1;
  });

  const earlyWinnerReached = isBestOfFormat && (homeEarlyWins >= setsNeededToWin || awayEarlyWins >= setsNeededToWin);

  // Filter sets to save if 3rd set was skipped due to Best of format
  const activeSetsToEvaluate = (earlyWinnerReached && !includeOptionalSet)
    ? sets.slice(0, nonDecidingSetsCount)
    : sets;

  activeSetsToEvaluate.forEach((s) => {
    if (s.homeScore > s.awayScore) homeSetsWon += 1;
    else if (s.awayScore > s.homeScore) awaySetsWon += 1;
  });

  const calculatedWinnerId =
    homeSetsWon > awaySetsWon ? homeTeam.id : awaySetsWon > homeSetsWon ? awayTeam.id : undefined;

  const handleSave = () => {
    if (!calculatedWinnerId) return;

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onSaveScore(match.id, activeSetsToEvaluate, calculatedWinnerId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Court-side Scorekeeper</h3>
              <p className="text-xs text-slate-400">
                Week {match.weekNumber} • {formatTime(match.startTime)} • {division?.name || 'League Match'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Active Rules Info Banner */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
              <Info className="h-4 w-4 shrink-0" />
              <span>League Rules:</span>
            </div>
            <span className="font-bold text-white">
              {totalSets} Sets • {activeRules.pointsPerSet}pt reg / {activeRules.pointsPerDecidingSet}pt dec • {activeRules.thirdSetRule === 'play_if_tied' ? 'Best of 3 (Play 3rd if 1-1)' : activeRules.thirdSetRule === 'guaranteed_all' ? '3 Guaranteed Sets' : 'Timed Sets'}
            </span>
          </div>

          {/* Teams Header Bar */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-center">
            {/* Home Team */}
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: homeTeam.badgeColor }} />
                <span className="font-bold text-sm text-white truncate max-w-[130px]">{homeTeam.name}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Home</span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: awayTeam.badgeColor }} />
                <span className="font-bold text-sm text-white truncate max-w-[130px]">{awayTeam.name}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Away</span>
            </div>
          </div>

          {/* Work Team Banner */}
          {workTeam && (
            <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-300">
              <div className="flex items-center space-x-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Officiating Work Team:</span>
              </div>
              <span className="font-bold">{workTeam.name}</span>
            </div>
          )}

          {/* Best of 3 / 5 Condition Notice Banner */}
          {earlyWinnerReached && (
            <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-violet-300 font-bold">
                <AlertCircle className="h-4 w-4 text-violet-400 shrink-0" />
                <span>Best of Format Condition Met ({homeEarlyWins}-{awayEarlyWins})</span>
              </div>
              <p className="text-[11px] text-slate-300">
                {homeEarlyWins >= setsNeededToWin ? homeTeam.name : awayTeam.name} won the first {setsNeededToWin} sets. Under standard Best of 3 rules, set #{totalSets} is optional.
              </p>
              <label className="flex items-center space-x-2 text-amber-400 font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={includeOptionalSet}
                  onChange={(e) => setIncludeOptionalSet(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span>Include Set #{totalSets} score in match record</span>
              </label>
            </div>
          )}

          {/* Sets Score Input Controls */}
          <div className="space-y-3">
            {sets.map((set, setIdx) => {
              const isDecidingSet = set.setNumber === totalSets && totalSets > 2;
              const targetPoints = isDecidingSet ? activeRules.pointsPerDecidingSet : activeRules.pointsPerSet;
              const isOptionalSkipped = earlyWinnerReached && !includeOptionalSet && isDecidingSet;

              return (
                <div
                  key={set.setNumber}
                  className={`p-4 rounded-2xl border transition-all ${
                    isOptionalSkipped
                      ? 'bg-slate-950/40 border-slate-800/40 opacity-50'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      SET #{set.setNumber}
                      {isDecidingSet && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/30">
                          Tie-breaker
                        </span>
                      )}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Target: {targetPoints} pts {activeRules.winByTwo ? '(Win by 2)' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Home Score Counter */}
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <button
                        onClick={() => updateSetScore(setIdx, true, -1)}
                        disabled={isOptionalSkipped}
                        className="h-10 w-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-bold text-lg disabled:opacity-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-2xl font-extrabold font-mono text-amber-400">
                        {set.homeScore}
                      </span>
                      <button
                        onClick={() => updateSetScore(setIdx, true, 1)}
                        disabled={isOptionalSkipped}
                        className="h-10 w-10 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/20 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Away Score Counter */}
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <button
                        onClick={() => updateSetScore(setIdx, false, -1)}
                        disabled={isOptionalSkipped}
                        className="h-10 w-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-bold text-lg disabled:opacity-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-2xl font-extrabold font-mono text-emerald-400">
                        {set.awayScore}
                      </span>
                      <button
                        onClick={() => updateSetScore(setIdx, false, 1)}
                        disabled={isOptionalSkipped}
                        className="h-10 w-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Match Outcome Summary */}
          {calculatedWinnerId && (
            <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl text-center">
              <span className="text-xs text-slate-400">Projected Match Winner: </span>
              <span className="text-sm font-bold text-emerald-400 ml-1">
                {calculatedWinnerId === homeTeam.id ? homeTeam.name : awayTeam.name} ({homeSetsWon}-{awaySetsWon})
              </span>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!calculatedWinnerId}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Verify & Save Match Score</span>
          </button>
        </div>

      </div>
    </div>
  );
};
