'use client';

import React, { useMemo, useState } from 'react';
import { Match, Team } from '@/types/league';
import { formatShortDate, formatTimeRange } from '@/utils/formatUtils';
import { AlertTriangle, CalendarRange, CheckCircle2 } from 'lucide-react';

interface OpponentTimelineProps {
  teams: Team[];
  matches: Match[];
}

interface TimelineEntry {
  match: Match;
  opponentId: string;
  isQuickRematch: boolean;
  weeksSinceLastMeeting?: number;
}

// Golden-angle hue steps keep neighbouring teams visually distinct
const opponentColor = (index: number) => `hsl(${Math.round((index * 137.508) % 360)}, 62%, 44%)`;

const shortName = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.map((w) => w[0]).join('').slice(0, 3).toUpperCase();
  return name.trim().slice(0, 3).toUpperCase();
};

/**
 * Week-by-week grid of each team's opponents, one colour per opponent, flagging
 * pairs that meet again within a short window so the admin can spot clustering.
 */
export const OpponentTimeline: React.FC<OpponentTimelineProps> = ({ teams, matches }) => {
  const [rematchWindow, setRematchWindow] = useState(3);
  const [includeExhibitions, setIncludeExhibitions] = useState(true);
  const [focusTeamId, setFocusTeamId] = useState<string | null>(null);

  const colorByTeam = useMemo(() => new Map(teams.map((t, i) => [t.id, opponentColor(i)])), [teams]);
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const { weeks, weekDates, cells, quickRematchCount } = useMemo(() => {
    const relevant = matches
      .filter((m) => includeExhibitions || !m.isExhibition)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

    const weekDates = new Map<number, string>();
    relevant.forEach((m) => {
      const existing = weekDates.get(m.weekNumber);
      if (!existing || m.date < existing) weekDates.set(m.weekNumber, m.date);
    });
    const weeks = Array.from(weekDates.keys()).sort((a, b) => a - b);

    const cells = new Map<string, Map<number, TimelineEntry[]>>();
    let flagged = 0;
    teams.forEach((team) => {
      const byWeek = new Map<number, TimelineEntry[]>();
      const lastMetWeek = new Map<string, number>();
      relevant
        .filter((m) => m.homeTeamId === team.id || m.awayTeamId === team.id)
        .forEach((m) => {
          const opponentId = m.homeTeamId === team.id ? m.awayTeamId : m.homeTeamId;
          const last = lastMetWeek.get(opponentId);
          const weeksSince = last === undefined ? undefined : m.weekNumber - last;
          const isQuickRematch = weeksSince !== undefined && weeksSince <= rematchWindow;
          if (isQuickRematch) flagged++;
          lastMetWeek.set(opponentId, m.weekNumber);
          const list = byWeek.get(m.weekNumber) || [];
          list.push({ match: m, opponentId, isQuickRematch, weeksSinceLastMeeting: weeksSince });
          byWeek.set(m.weekNumber, list);
        });
      cells.set(team.id, byWeek);
    });

    // Each rematch is flagged once in each team's row
    return { weeks, weekDates, cells, quickRematchCount: Math.round(flagged / 2) };
  }, [matches, teams, includeExhibitions, rematchWindow]);

  if (weeks.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
        No matches scheduled yet for this division.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CalendarRange className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <span>Opponent Timeline</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Each opponent has its own colour. Click a team below to highlight its games everywhere.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
            Flag rematches within
            <select
              value={rematchWindow}
              onChange={(e) => setRematchWindow(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'week' : 'weeks'}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={includeExhibitions}
              onChange={(e) => setIncludeExhibitions(e.target.checked)}
              className="accent-amber-500"
            />
            Include exhibitions
          </label>
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border ${
              quickRematchCount > 0
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
            }`}
          >
            {quickRematchCount > 0 ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {quickRematchCount === 0
              ? 'No quick rematches'
              : `${quickRematchCount} quick ${quickRematchCount === 1 ? 'rematch' : 'rematches'}`}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900/80 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-3 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 min-w-[120px]">Team</th>
              {weeks.map((week) => (
                <th key={week} className="py-2 px-1.5 text-center whitespace-nowrap">
                  <div>Wk {week}</div>
                  <div className="font-normal normal-case text-slate-400 dark:text-slate-500">
                    {formatShortDate(weekDates.get(week)).replace(/^\w+,\s*/, '')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                <td className="py-2 px-3 sticky left-0 bg-white dark:bg-slate-950 z-10 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: colorByTeam.get(team.id) }} />
                  {team.name}
                </td>
                {weeks.map((week) => {
                  const entries = cells.get(team.id)?.get(week) || [];
                  return (
                    <td key={week} className="py-1.5 px-1 text-center align-middle">
                      {entries.length === 0 ? (
                        <span className="text-slate-300 dark:text-slate-700 text-[10px]">bye</span>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          {entries.map(({ match, opponentId, isQuickRematch, weeksSinceLastMeeting }) => {
                            const opponent = teamById.get(opponentId);
                            const dimmed = focusTeamId !== null && focusTeamId !== opponentId && focusTeamId !== team.id;
                            const title = [
                              `vs ${opponent?.name || opponentId}`,
                              `${formatShortDate(match.date)} ${formatTimeRange(match.startTime, match.endTime)}`,
                              match.isExhibition ? 'Exhibition' : null,
                              isQuickRematch
                                ? weeksSinceLastMeeting === 0
                                  ? 'Rematch in the same week'
                                  : `Rematch ${weeksSinceLastMeeting} week(s) after last meeting`
                                : null,
                            ]
                              .filter(Boolean)
                              .join('\n');
                            return (
                              <span
                                key={match.id}
                                title={title}
                                className={`relative inline-flex items-center justify-center min-w-[38px] px-1.5 py-1 rounded-md text-[10px] font-black text-white transition-opacity ${
                                  match.isExhibition ? 'opacity-60 border border-dashed border-white/70' : ''
                                } ${isQuickRematch ? 'ring-2 ring-rose-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-950' : ''} ${
                                  dimmed ? 'opacity-15' : ''
                                }`}
                                style={{ backgroundColor: colorByTeam.get(opponentId) || '#64748b' }}
                              >
                                {opponent ? shortName(opponent.name) : '?'}
                                {isQuickRematch && (
                                  <AlertTriangle className="absolute -top-1.5 -right-1.5 h-3 w-3 text-rose-500 fill-white dark:fill-slate-950" />
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Colour key (click to highlight) */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px]">
        {teams.map((team) => {
          const active = focusTeamId === team.id;
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => setFocusTeamId(active ? null : team.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ${
                active
                  ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 font-bold'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
              } text-slate-700 dark:text-slate-300`}
            >
              <span
                className="inline-flex items-center justify-center min-w-[30px] px-1 py-0.5 rounded text-[9px] font-black text-white"
                style={{ backgroundColor: colorByTeam.get(team.id) }}
              >
                {shortName(team.name)}
              </span>
              {team.name}
            </button>
          );
        })}
        <span className="flex items-center gap-1 ml-auto text-slate-500 dark:text-slate-400">
          <span className="inline-block w-3 h-3 rounded ring-2 ring-rose-500" /> quick rematch
          <span className="inline-block w-3 h-3 rounded border border-dashed border-slate-400 ml-2" /> exhibition
        </span>
      </div>
    </div>
  );
};
