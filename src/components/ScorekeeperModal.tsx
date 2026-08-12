'use client';

import React, { useState } from 'react';
import { Match, Team, Division, SetScore } from '@/types/league';
import { X, CheckCircle, Plus, Minus, Trophy, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatTime } from '@/utils/formatUtils';

interface ScorekeeperModalProps {
  match: Match;
  homeTeam?: Team;
  awayTeam?: Team;
  workTeam?: Team;
  division?: Division;
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
  isOpen,
  onClose,
  onSaveScore,
}) => {
  const [sets, setSets] = useState<SetScore[]>(() => {
    if (match.scores.length > 0) return match.scores;
    return [
      { setNumber: 1, homeScore: 25, awayScore: 20 },
      { setNumber: 2, homeScore: 20, awayScore: 25 },
      { setNumber: 3, homeScore: 15, awayScore: 12 },
    ];
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

  // Determine winner
  let homeSetsWon = 0;
  let awaySetsWon = 0;
  sets.forEach((s) => {
    if (s.homeScore > s.awayScore) homeSetsWon += 1;
    if (s.awayScore > s.homeScore) awaySetsWon += 1;
  });

  const calculatedWinnerId =
    homeSetsWon > awaySetsWon ? homeTeam.id : awaySetsWon > homeSetsWon ? awayTeam.id : undefined;

  const handleSave = () => {
    if (!calculatedWinnerId) return;

    // Trigger confetti celebrating match record
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onSaveScore(match.id, sets, calculatedWinnerId);
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
                Week {match.weekNumber} • {formatTime(match.startTime)} • Court #{match.courtId}
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Teams Header Bar */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-center">
            {/* Home Team */}
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: homeTeam.badgeColor }} />
                <span className="font-bold text-sm text-white truncate max-w-[130px]">{homeTeam.name}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Home</span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: awayTeam.badgeColor }} />
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

          {/* Sets Score Input Controls */}
          <div className="space-y-4">
            {sets.map((set, setIdx) => (
              <div
                key={set.setNumber}
                className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>SET #{set.setNumber}</span>
                  <span className="text-slate-500">
                    {setIdx === 2 ? 'Tie-break set (to 15)' : 'Set (to 25)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Home Score Counter */}
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <button
                      onClick={() => updateSetScore(setIdx, true, -1)}
                      className="h-10 w-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-bold text-lg"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-2xl font-extrabold font-mono text-amber-400">
                      {set.homeScore}
                    </span>
                    <button
                      onClick={() => updateSetScore(setIdx, true, 1)}
                      className="h-10 w-10 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/20"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Away Score Counter */}
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <button
                      onClick={() => updateSetScore(setIdx, false, -1)}
                      className="h-10 w-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-bold text-lg"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-2xl font-extrabold font-mono text-emerald-400">
                      {set.awayScore}
                    </span>
                    <button
                      onClick={() => updateSetScore(setIdx, false, 1)}
                      className="h-10 w-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
