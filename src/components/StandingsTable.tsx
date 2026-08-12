'use client';

import React from 'react';
import { TeamStanding, Division } from '@/types/league';
import { Trophy, Info, Users, ShieldAlert, Award } from 'lucide-react';

interface StandingsTableProps {
  standings: TeamStanding[];
  division: Division;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, division }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">{division.name} Standings</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Format: <span className="text-slate-200">{division.setFormat}</span>
          </p>
        </div>

        {/* Division Rules Tags */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {division.minFemalesOnCourt && (
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Users className="h-3 w-3" /> Min {division.minFemalesOnCourt} F on Court
            </span>
          )}
          {division.workTeamRequired && (
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Work Teams Active
            </span>
          )}
          <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">
            {division.capRule}
          </span>
        </div>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[11px] text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-3">Team</th>
              <th className="py-3 px-2 text-center">MP</th>
              <th className="py-3 px-2 text-center">W</th>
              <th className="py-3 px-2 text-center">L</th>
              <th className="py-3 px-2 text-center">Sets (W-L)</th>
              <th className="py-3 px-2 text-center">Set Ratio</th>
              <th className="py-3 px-2 text-center hidden md:table-cell">Pt Diff</th>
              <th className="py-3 px-3 text-right font-bold text-amber-400">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {standings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                  No completed matches recorded yet for this division.
                </td>
              </tr>
            ) : (
              standings.map((team) => (
                <tr
                  key={team.teamId}
                  className="hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="py-3.5 px-3 text-center">
                    {team.rank === 1 ? (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
                        1
                      </span>
                    ) : team.rank === 2 ? (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-300/20 text-slate-200 font-bold text-xs border border-slate-300/30">
                        2
                      </span>
                    ) : team.rank === 3 ? (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-700/20 text-amber-500 font-bold text-xs border border-amber-700/30">
                        3
                      </span>
                    ) : (
                      <span className="text-slate-400">{team.rank}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: team.badgeColor }}
                      />
                      <span className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                        {team.teamName}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-2 text-center text-slate-300">{team.played}</td>
                  <td className="py-3.5 px-2 text-center font-bold text-emerald-400">{team.wins}</td>
                  <td className="py-3.5 px-2 text-center text-rose-400">{team.losses}</td>

                  <td className="py-3.5 px-2 text-center font-mono text-xs">
                    {team.setsWon}-{team.setsLost}
                  </td>

                  <td className="py-3.5 px-2 text-center font-mono text-xs text-slate-400">
                    {team.setRatio.toFixed(3)}
                  </td>

                  <td className="py-3.5 px-2 text-center font-mono text-xs hidden md:table-cell">
                    <span className={team.pointDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {team.pointDiff > 0 ? `+${team.pointDiff}` : team.pointDiff}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <span className="text-base font-extrabold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                      {team.points}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tie-breaker Rule Footer Note */}
      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>
          Tie-breaker order: <strong className="text-slate-400">Points → Match Wins → Set Ratio → Point Differential → Points For</strong>
        </span>
      </div>
    </div>
  );
};
