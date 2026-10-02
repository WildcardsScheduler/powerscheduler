'use client';

import React from 'react';
import { TeamStanding, Division, MatchRules } from '@/types/league';
import { Trophy, Info, Users } from 'lucide-react';
import { formatMatchRulesDescription } from '@/utils/formatRules';

interface StandingsTableProps {
  standings: TeamStanding[];
  division: Division;
  leagueName?: string;
  hasMultipleDivisions?: boolean;
  matchRules?: MatchRules;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  division,
  leagueName,
  hasMultipleDivisions,
  matchRules,
}) => {
  const setFormatText = formatMatchRulesDescription(division.matchRules || matchRules, division.setFormat);

  // If single division or default "Main Division", display "[League Name] Standings"
  const isSingleDivision = hasMultipleDivisions === false || division.name === 'Main Division';

  const titleText = leagueName
    ? isSingleDivision
      ? `${leagueName} Standings`
      : `${leagueName} — ${division.name} Standings`
    : `${division.name} Standings`;

  const activeRules = division.matchRules || matchRules;
  const pointsSystem = activeRules?.standingsPointsSystem || 'fivb_3pt';

  const scoringBadgeMap: Record<string, string> = {
    fivb_3pt: 'FIVB 3-Pt Scoring',
    one_pt_per_set: '1 Pt / Set Won',
    win_loss_2pt: '2 Pts / Win',
    win_loss_3pt: '3 Pts / Win',
  };

  const scoringDescMap: Record<string, string> = {
    fivb_3pt: 'FIVB 3-Pt (Sweep = 3 pts / 0 pts, 3rd-set decider = 2 pts / 1 pt)',
    one_pt_per_set: '1 Point per set won',
    win_loss_2pt: 'Match Win = 2 pts, Loss = 0 pts',
    win_loss_3pt: 'Match Win = 3 pts, Loss = 0 pts',
  };

  return (
    <div className="bg-white dark:bg-[#15171b] border border-[#e5e7eb] dark:border-[#1c1f24] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 transition-colors duration-150">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e5e7eb] dark:border-[#1c1f24]">
        <div>
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-[#242424] dark:text-[#a0aaba]" />
            <h3 className="text-lg font-bold text-[#242424] dark:text-white tracking-tight">{titleText}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#8b96aa] mt-1">
            Format: <span className="text-[#242424] dark:text-slate-200 font-medium">{setFormatText}</span>
          </p>
        </div>

        {/* Division Rules Tags */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {division.minFemalesOnCourt && (
            <span className="bg-slate-100 text-[#242424] dark:bg-[#1c1f24] dark:text-[#a0aaba] border border-[#e5e7eb] dark:border-[#333943] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
              <Users className="h-3 w-3" /> Min {division.minFemalesOnCourt} F on Court
            </span>
          )}
          <span className="bg-slate-100 text-[#242424] dark:bg-[#1c1f24] dark:text-[#a0aaba] border border-[#e5e7eb] dark:border-[#333943] px-2 py-0.5 rounded-full font-medium">
            {scoringBadgeMap[pointsSystem] || scoringBadgeMap.fivb_3pt}
          </span>
          <span className="bg-slate-100 text-[#242424] dark:bg-[#1c1f24] dark:text-[#a0aaba] border border-[#e5e7eb] dark:border-[#333943] px-2 py-0.5 rounded-full font-medium">
            {division.capRule}
          </span>
        </div>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-[#0e1012] uppercase text-[11px] text-slate-500 dark:text-[#8b96aa] font-semibold border-b border-[#e5e7eb] dark:border-[#1c1f24]">
            <tr>
              <th className="py-3 px-2 w-8 text-center">#</th>
              <th className="py-3 px-2">Team</th>
              <th className="py-3 px-1.5 text-center">MP</th>
              <th className="py-3 px-1.5 text-center">W</th>
              <th className="py-3 px-1.5 text-center">L</th>
              <th className="py-3 px-2 text-center">Sets (W-L)</th>
              <th className="py-3 px-2 text-center hidden sm:table-cell">Set Ratio</th>
              <th className="py-3 px-2 text-center hidden md:table-cell">Pt Diff</th>
              <th className="py-3 px-2 text-right font-bold text-[#101010] dark:text-[#007afc]" title="League Points (Earned from match & set outcomes)">LP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#1c1f24] font-medium">
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
                  className="hover:bg-slate-50 dark:hover:bg-[#1c1f24]/50 transition-colors group"
                >
                  <td className="py-3 px-2 text-center">
                    {team.rank === 1 ? (
                      <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/30">
                        1
                      </span>
                    ) : team.rank === 2 ? (
                      <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-slate-200 dark:bg-slate-300/20 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-300/30">
                        2
                      </span>
                    ) : team.rank === 3 ? (
                      <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-amber-700/15 dark:bg-amber-700/20 text-amber-700 dark:text-amber-500 font-bold text-xs border border-amber-700/30">
                        3
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">{team.rank}</span>
                    )}
                  </td>

                  <td className="py-3 px-2">
                    <div className="flex items-center space-x-2 min-w-0 max-w-[100px] sm:max-w-none">
                      <div
                        className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: team.badgeColor }}
                      />
                      <span
                        className="font-semibold text-[#242424] dark:text-white group-hover:text-[#101010] dark:group-hover:text-white transition-colors truncate text-xs sm:text-sm"
                        title={team.teamName}
                      >
                        {team.teamName}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-1.5 text-center text-slate-600 dark:text-slate-300">{team.played}</td>
                  <td className="py-3 px-1.5 text-center font-bold text-emerald-600 dark:text-emerald-400">{team.wins}</td>
                  <td className="py-3 px-1.5 text-center text-rose-600 dark:text-rose-400">{team.losses}</td>

                  <td className="py-3 px-2 text-center font-mono text-xs whitespace-nowrap">
                    {team.setsWon}-{team.setsLost}
                  </td>

                  <td className="py-3 px-2 text-center font-mono text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                    {team.setRatio.toFixed(3)}
                  </td>

                  <td className="py-3 px-2 text-center font-mono text-xs hidden md:table-cell">
                    <span className={team.pointDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                      {team.pointDiff > 0 ? `+${team.pointDiff}` : team.pointDiff}
                    </span>
                  </td>

                  <td className="py-3 px-2 text-right">
                    <span className="text-sm sm:text-base font-extrabold text-[#101010] dark:text-white bg-slate-100 dark:bg-[#1c1f24] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-[#e5e7eb] dark:border-[#333943] shadow-xs">
                      {team.points}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tie-breaker & Scoring Rule Footer Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 dark:text-slate-500 pt-2 border-t border-[#e5e7eb] dark:border-[#1c1f24] gap-1.5">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>
            Standings scoring: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{scoringDescMap[pointsSystem] || scoringDescMap.fivb_3pt}</strong>
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span>
            Tie-breakers: <strong className="text-slate-700 dark:text-slate-300 font-semibold">LP → Wins → Set Ratio → +/- Diff → PF</strong>
          </span>
        </div>
        {(division.matchRules?.excludeThirdSetPointsFromDiff ?? matchRules?.excludeThirdSetPointsFromDiff ?? true) && (
          <span className="text-slate-600 dark:text-[#a0aaba] italic font-medium whitespace-nowrap">
            * Point Diff (+/-) counts regulation sets only
          </span>
        )}
      </div>
    </div>
  );
};
