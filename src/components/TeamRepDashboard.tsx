'use client';

import React, { useState } from 'react';
import { Team, Match, Location, Division, Player } from '@/types/league';
import { Users, Calendar, Clock, MapPin, ShieldAlert, CheckCircle2, XCircle, HelpCircle, Phone, Mail, Building2, Edit3, Trophy } from 'lucide-react';
import { formatTimeRange } from '@/utils/formatUtils';

interface TeamRepDashboardProps {
  teams: Team[];
  matches: Match[];
  locations: Location[];
  divisions: Division[];
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
  onUpdateRsvp: (teamId: string, playerId: string, status: 'Going' | 'Maybe' | 'Out') => void;
  onOpenScorekeeper: (match: Match) => void;
}

export const TeamRepDashboard: React.FC<TeamRepDashboardProps> = ({
  teams,
  matches,
  locations,
  divisions,
  selectedTeamId,
  onSelectTeam,
  onUpdateRsvp,
  onOpenScorekeeper,
}) => {
  const activeTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  if (!activeTeam) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-3">
        <Users className="h-10 w-10 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">No Teams Registered Yet</h3>
        <p className="text-xs">Select a team or register new teams in the administrative dashboard.</p>
      </div>
    );
  }

  const activeDivision = divisions.find((d) => d.id === activeTeam.divisionId);

  // Find next upcoming match for this team (as home, away, OR work team!)
  const teamMatches = matches.filter(
    (m) => m.homeTeamId === activeTeam.id || m.awayTeamId === activeTeam.id || m.workTeamId === activeTeam.id
  );

  const nextMatch = teamMatches.find((m) => m.status === 'Scheduled') || teamMatches[0];

  const isPlayingNext = nextMatch && (nextMatch.homeTeamId === activeTeam.id || nextMatch.awayTeamId === activeTeam.id);
  const isRefDutyNext = nextMatch && nextMatch.workTeamId === activeTeam.id;

  const opponentId = isPlayingNext
    ? nextMatch.homeTeamId === activeTeam.id
      ? nextMatch.awayTeamId
      : nextMatch.homeTeamId
    : undefined;

  const opponentTeam = teams.find((t) => t.id === opponentId);

  // Helper to resolve match location
  const getMatchLocation = (m: Match) => {
    const sId = m.subLocationId || m.courtId;
    const pLoc = locations.find(
      (l) => l.id === m.locationId || l.subLocations.some((s) => s.id === sId)
    );
    const sLoc = pLoc?.subLocations.find((s) => s.id === sId);
    return { primaryLoc: pLoc, subLoc: sLoc };
  };

  const { primaryLoc, subLoc } = nextMatch ? getMatchLocation(nextMatch) : { primaryLoc: undefined, subLoc: undefined };

  return (
    <div className="space-y-6">
      
      {/* Team Selection Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span
            className="h-5 w-5 rounded-full shrink-0 shadow-md"
            style={{ backgroundColor: activeTeam.badgeColor }}
          />
          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">
              Active Team View
            </label>
            <select
              value={activeTeam.id}
              onChange={(e) => onSelectTeam(e.target.value)}
              className="bg-transparent text-white font-bold text-lg focus:outline-none cursor-pointer"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.name} ({divisions.find((d) => d.id === t.divisionId)?.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeDivision && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-slate-950 text-slate-300 px-3 py-1 rounded-xl border border-slate-800">
              Division: <strong className="text-amber-400">{activeDivision.name}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Next Match & Ref Duty Highlight Card */}
      {nextMatch ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Next Upcoming Fixture
            </span>
            <span className="text-xs text-slate-400 font-mono">Week #{nextMatch.weekNumber}</span>
          </div>

          {/* If Team is assigned to Officiate (Ref Duty) */}
          {isRefDutyNext && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <span>Ref Duty Mandatory Alert!</span>
              </div>
              <p className="text-xs text-amber-200/90">
                Your team <strong className="text-white">{activeTeam.name}</strong> is assigned to work/officiate this match! Please provide 1 Up-ref, 1 Down-ref, 1 Scorekeeper, and 2 Line judges.
              </p>
            </div>
          )}

          {/* Match Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            {/* Left: Time & Location */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-3 text-slate-300 text-sm">
                <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">{formatTimeRange(nextMatch.startTime, nextMatch.endTime)}</div>
                  <div className="text-xs text-slate-400">{nextMatch.date}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-300 text-sm">
                <MapPin className="h-5 w-5 text-rose-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">
                    {primaryLoc && subLoc
                      ? `${primaryLoc.name} — ${subLoc.name}`
                      : primaryLoc
                      ? primaryLoc.name
                      : subLoc
                      ? subLoc.name
                      : `Court ${nextMatch.subLocationId || nextMatch.courtId || 'TBD'}`}
                  </div>
                  <div className="text-xs text-slate-400">
                    {primaryLoc?.address || 'Location Address TBD'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Opponent Card */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">
                  Opponent
                </span>
                {opponentTeam ? (
                  <div className="flex items-center space-x-2 mt-1 min-w-0">
                    <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: opponentTeam.badgeColor }} />
                    <span className="font-extrabold text-white text-lg truncate" title={opponentTeam.name}>{opponentTeam.name}</span>
                  </div>
                ) : (
                  <span className="font-semibold text-slate-400">Officiating Duty</span>
                )}
                <p className="text-xs text-slate-400 mt-1 truncate">
                  Captain: {opponentTeam?.captainName || 'N/A'}
                </p>
              </div>

              <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 font-extrabold text-sm">
                VS
              </div>
            </div>

          </div>

          {/* Captain Score Entry Quick Action */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {nextMatch.status === 'Completed' ? 'Match completed & score verified.' : 'Captain / Referee Scorekeeper Action:'}
            </span>
            <button
              onClick={() => onOpenScorekeeper(nextMatch)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center space-x-1.5"
            >
              <Edit3 className="h-4 w-4" />
              <span>{nextMatch.status === 'Completed' ? 'Edit Match Score' : 'Report Match Score'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400">
          No scheduled matches found for this team.
        </div>
      )}

      {/* All Team Fixtures & Score Reporting */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">{activeTeam.name} Season Schedule & Scores</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{teamMatches.length} Total Matches</span>
        </div>

        <div className="space-y-3">
          {teamMatches.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No matches scheduled for this team yet.</p>
          ) : (
            teamMatches.map((m) => {
              const isPlaying = m.homeTeamId === activeTeam.id || m.awayTeamId === activeTeam.id;
              const isRef = m.workTeamId === activeTeam.id;
              const oppId = m.homeTeamId === activeTeam.id ? m.awayTeamId : m.homeTeamId;
              const opp = teams.find((t) => t.id === oppId);
              const { primaryLoc: pLoc, subLoc: sLoc } = getMatchLocation(m);

              return (
                <div
                  key={m.id}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-bold">Wk #{m.weekNumber}</span>
                      <span>{m.date} • {formatTimeRange(m.startTime, m.endTime)}</span>
                      {pLoc && (
                        <span className="text-slate-400 font-medium">
                          ({pLoc.name} {sLoc ? `— ${sLoc.name}` : ''})
                        </span>
                      )}
                    </div>

                    {isPlaying ? (
                      <div className="flex items-center space-x-2 text-sm font-bold text-white">
                        <span>vs {opp?.name || 'TBD'}</span>
                        {m.isExhibition && (
                          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                            Exhibition
                          </span>
                        )}
                      </div>
                    ) : isRef ? (
                      <div className="text-xs text-amber-400 font-semibold flex items-center space-x-1">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Ref Duty (Officiating Match)</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    {m.status === 'Completed' && m.scores.length > 0 ? (
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        {m.scores.map((s) => `${s.homeScore}-${s.awayScore}`).join(' | ')}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Scheduled</span>
                    )}

                    <button
                      onClick={() => onOpenScorekeeper(m)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 hover:from-amber-500/20 hover:to-rose-500/20 text-amber-400 hover:text-white font-bold text-xs border border-amber-500/30 flex items-center space-x-1.5 transition-all shadow-sm"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>{m.status === 'Completed' ? 'Edit Score' : 'Report Score'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Roster & Mobile RSVP Check-in Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Team Roster & Player RSVPs</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {activeTeam.roster.filter((p) => p.rsvpStatus === 'Going').length} / {activeTeam.roster.length} Attending
          </span>
        </div>

        {/* Captain Card Header */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div>
            <span className="text-slate-400">Team Captain: </span>
            <strong className="text-white font-bold">{activeTeam.captainName}</strong>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {activeTeam.captainEmail}</span>
            <span className="flex items-center gap-1 hidden sm:flex"><Phone className="h-3.5 w-3.5" /> {activeTeam.captainPhone}</span>
          </div>
        </div>

        {/* Player Roster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeTeam.roster.map((player) => (
            <div
              key={player.id}
              className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between space-x-3"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-sm">{player.name}</span>
                  {player.number && (
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded">
                      #{player.number}
                    </span>
                  )}
                  {player.isCaptain && (
                    <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                      Captain
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 block mt-0.5">{player.position}</span>
              </div>

              {/* RSVP Mobile Buttons */}
              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => onUpdateRsvp(activeTeam.id, player.id, 'Going')}
                  title="Attending"
                  className={`p-1.5 rounded-lg transition-all ${
                    player.rsvpStatus === 'Going'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onUpdateRsvp(activeTeam.id, player.id, 'Maybe')}
                  title="Maybe"
                  className={`p-1.5 rounded-lg transition-all ${
                    player.rsvpStatus === 'Maybe'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onUpdateRsvp(activeTeam.id, player.id, 'Out')}
                  title="Out"
                  className={`p-1.5 rounded-lg transition-all ${
                    player.rsvpStatus === 'Out'
                      ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
