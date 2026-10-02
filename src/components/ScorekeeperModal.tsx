'use client';

import React, { useState } from 'react';
import { Match, Team, Division, SetScore, MatchRules, DEFAULT_MATCH_RULES } from '@/types/league';
import { X, CheckCircle, Plus, Minus, Trophy, ShieldAlert, Info, Lock } from 'lucide-react';
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
  currentRole?: 'public' | 'team_rep' | 'scheduler';
  userTeamId?: string;
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
  currentRole,
  userTeamId,
}) => {
  const activeRules: MatchRules = division?.matchRules || leagueRules || DEFAULT_MATCH_RULES;
  const totalSets = activeRules.totalSets || 3;

  const isTeamInvolved = Boolean(
    userTeamId &&
      (match.homeTeamId === userTeamId ||
        match.awayTeamId === userTeamId ||
        match.workTeamId === userTeamId)
  );
  const canEdit =
    currentRole === 'scheduler' ||
    (currentRole === 'team_rep' && isTeamInvolved);

  const ensureThreeSets = (existingScores?: SetScore[], totalSetsCount: number = 3): SetScore[] => {
    const maxCount = Math.max(3, totalSetsCount);
    const result: SetScore[] = [];
    for (let i = 1; i <= maxCount; i++) {
      const existing = existingScores?.find((s) => s.setNumber === i);
      if (existing) {
        result.push({ ...existing });
      } else {
        result.push({ setNumber: i, homeScore: 0, awayScore: 0 });
      }
    }
    return result;
  };

  const [sets, setSets] = useState<SetScore[]>(() => {
    return ensureThreeSets(match.scores, totalSets);
  });

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

  const handleDirectScoreInput = (setIndex: number, isHome: boolean, valueStr: string) => {
    const score = valueStr === '' ? 0 : Math.max(0, Math.min(99, parseInt(valueStr, 10) || 0));
    const updated = [...sets];
    const targetSet = { ...updated[setIndex] };

    if (isHome) {
      targetSet.homeScore = score;
    } else {
      targetSet.awayScore = score;
    }

    updated[setIndex] = targetSet;
    setSets(updated);
  };

  // Determine sets won up to deciding set
  let homeSetsWon = 0;
  let awaySetsWon = 0;

  // Check if Best of format (only play 3rd set if tied 1-1)
  const isPlayIfTiedFormat = activeRules.thirdSetRule === 'play_if_tied' || activeRules.thirdSetRule === 'timed_sets' || totalSets === 2;
  const setsNeededToWin = Math.ceil(totalSets / 2); // e.g. 2 for Best of 3

  // Calculate sets won for initial sets before deciding set
  const nonDecidingSetsCount = totalSets > 2 ? 2 : totalSets;
  let homeEarlyWins = 0;
  let awayEarlyWins = 0;

  sets.slice(0, nonDecidingSetsCount).forEach((s) => {
    if (s.homeScore > s.awayScore) homeEarlyWins += 1;
    else if (s.awayScore > s.homeScore) awayEarlyWins += 1;
  });

  // If a team won 2-0 in a play_if_tied format, Set #3 is NOT played or offered
  const earlyWinnerReached = isPlayIfTiedFormat && (homeEarlyWins >= setsNeededToWin || awayEarlyWins >= setsNeededToWin);

  // Active sets: If early winner reached in a play_if_tied format, hide and exclude set #3!
  const activeSetsToEvaluate = earlyWinnerReached ? sets.slice(0, nonDecidingSetsCount) : sets;

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
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#15171b] border-0 sm:border border-[#e5e7eb] dark:border-[#1c1f24] rounded-none sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#0e1012] border-b border-[#e5e7eb] dark:border-[#1c1f24] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#1c1f24] text-[#242424] dark:text-[#a0aaba] border border-[#e5e7eb] dark:border-[#333943]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#242424] dark:text-white">Court-side Scorekeeper</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Week {match.weekNumber} • {formatTime(match.startTime)} • {match.isExhibition ? 'Exhibition' : division?.name || 'League Match'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">

          {!canEdit && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-center space-x-2.5 text-xs text-rose-600 dark:text-rose-400 font-semibold shadow-sm">
              <Lock className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>Access Restricted: Team Captains can only report scores for matches involving their team (Home, Away, or Ref Duty).</span>
            </div>
          )}
          
          {match.isExhibition && (
            <div className="p-3 bg-amber-500/10 border border-dashed border-amber-400 dark:border-amber-500/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold">Exhibition game:</span> the score is recorded but doesn&apos;t affect standings.
            </div>
          )}

          {/* Active Rules Info Banner */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 font-semibold">
              <Info className="h-4 w-4 shrink-0" />
              <span>League Rules:</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">
              {totalSets} Sets • {activeRules.pointsPerSet}pt reg / {activeRules.pointsPerDecidingSet}pt dec • {activeRules.thirdSetRule === 'play_if_tied' ? 'Best of 3 (Play 3rd if 1-1)' : activeRules.thirdSetRule === 'guaranteed_all' ? '3 Guaranteed Sets' : 'Timed Sets'}
            </span>
          </div>

          {/* Teams Header Bar */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-center">
            {/* Home Team */}
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: homeTeam.badgeColor }} />
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[130px]">{homeTeam.name}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Home</span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: awayTeam.badgeColor }} />
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[130px]">{awayTeam.name}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Away</span>
            </div>
          </div>

          {/* Work Team Banner */}
          {workTeam && (
            <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
              <div className="flex items-center space-x-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Officiating Work Team:</span>
              </div>
              <span className="font-bold">{workTeam.name}</span>
            </div>
          )}

          {/* Sets Score Input Controls */}
          <div className="space-y-3">
            {activeSetsToEvaluate.map((set, setIdx) => {
              const isDecidingSet = set.setNumber === totalSets && totalSets > 2;
              const targetPoints = isDecidingSet ? activeRules.pointsPerDecidingSet : activeRules.pointsPerSet;

              return (
                <div
                  key={set.setNumber}
                  className="p-4 rounded-2xl border transition-all bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      SET #{set.setNumber}
                      {isDecidingSet && (
                        <span className="text-[10px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/30 font-bold">
                          Tie-breaker
                        </span>
                      )}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      Target: {targetPoints} pts {activeRules.winByTwo ? '(Win by 2)' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Home Score Counter */}
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => updateSetScore(setIdx, true, -1)}
                        className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-white flex items-center justify-center font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        disabled={!canEdit}
                        value={set.homeScore}
                        onChange={(e) => handleDirectScoreInput(setIdx, true, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-16 text-center text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-amber-400 focus:outline-none py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-40"
                      />
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => updateSetScore(setIdx, true, 1)}
                        className="h-10 w-10 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Away Score Counter */}
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => updateSetScore(setIdx, false, -1)}
                        className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-white flex items-center justify-center font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        disabled={!canEdit}
                        value={set.awayScore}
                        onChange={(e) => handleDirectScoreInput(setIdx, false, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-16 text-center text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-emerald-400 focus:outline-none py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-40"
                      />
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => updateSetScore(setIdx, false, 1)}
                        className="h-10 w-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
            <div className="p-3 bg-slate-100 dark:bg-[#1c1f24] border border-[#e5e7eb] dark:border-[#333943] rounded-xl text-center">
              <span className="text-xs text-slate-600 dark:text-[#a0aaba]">Projected Match Winner: </span>
              <span className="text-sm font-bold text-[#101010] dark:text-[#007afc] ml-1">
                {calculatedWinnerId === homeTeam.id ? homeTeam.name : awayTeam.name} ({homeSetsWon}-{awaySetsWon})
              </span>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="mt-auto p-4 bg-slate-50 dark:bg-[#0e1012] border-t border-[#e5e7eb] dark:border-[#1c1f24] flex items-center space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#e5e7eb] dark:border-[#333943] text-[#242424] dark:text-[#a0aaba] font-semibold text-xs hover:bg-slate-100 dark:hover:bg-[#1c1f24] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!calculatedWinnerId || !canEdit}
            className="flex-1 py-3 rounded-xl bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] dark:text-white font-bold text-xs shadow-xs active:scale-98 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Verify & Save Match Score</span>
          </button>
        </div>

      </div>
    </div>
  );
};
