'use client';

import React, { useState } from 'react';
import { Team, Match, Location, Division, Player } from '@/types/league';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Phone,
  Mail,
  Building2,
  Edit3,
  Trophy,
  Lock,
  Search,
  Copy,
  Check,
  MessageSquare,
  BookUser,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
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
  currentRole?: 'public' | 'team_rep' | 'scheduler';
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
  currentRole,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'directory'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivFilter, setSelectedDivFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

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

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Copy all emails
  const handleCopyAllEmails = (teamList: Team[]) => {
    const emails = teamList
      .map((t) => t.captainEmail)
      .filter(Boolean)
      .join(', ');
    navigator.clipboard.writeText(emails);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Filtered teams for directory
  const filteredTeams = teams.filter((t) => {
    const matchesDiv = selectedDivFilter === 'ALL' || t.divisionId === selectedDivFilter;
    const divName = divisions.find((d) => d.id === t.divisionId)?.name || '';
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.captainName.toLowerCase().includes(q) ||
      t.captainEmail.toLowerCase().includes(q) ||
      t.captainPhone.toLowerCase().includes(q) ||
      divName.toLowerCase().includes(q);
    return matchesDiv && matchesQuery;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Tab Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <span
            className="h-6 w-6 rounded-full shrink-0 shadow-md border border-white/20"
            style={{ backgroundColor: activeTeam.badgeColor }}
          />
          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">
              Active Team View
            </label>
            {currentRole === 'team_rep' ? (
              <div className="text-white font-bold text-lg flex items-center space-x-2">
                <span>{activeTeam.name}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Lock className="h-3 w-3 text-amber-400" />
                  <span>My Authenticated Team</span>
                </span>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Schedule & Roster</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'directory'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookUser className="h-4 w-4" />
            <span>Captains Directory</span>
            <span className="bg-slate-800 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              {teams.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'directory' ? (
        /* ========================================================================= */
        /* CAPTAINS & TEAMS CONTACT DIRECTORY (CAPTAIN / ADMIN PRIVATE ACCESS ONLY)  */
        /* ========================================================================= */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Privacy & Info Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-extrabold text-white">Private Captains Contact Directory</h3>
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    Captains & Admins Only
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Use this directory to contact opposing captains for match coordination, notifications, or emergency updates. This data is hidden from public visitors.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleCopyAllEmails(filteredTeams)}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-white border border-amber-500/30 font-bold text-xs flex items-center space-x-2 transition-all shrink-0 shadow-md"
            >
              {copiedAll ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">All Emails Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy All Captain Emails ({filteredTeams.length})</span>
                </>
              )}
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search team, captain, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>

            {divisions.length > 1 && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Division:</span>
                <select
                  value={selectedDivFilter}
                  onChange={(e) => setSelectedDivFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer w-full sm:w-auto"
                >
                  <option value="ALL">All Divisions ({teams.length})</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({teams.filter((t) => t.divisionId === d.id).length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Teams Directory Cards Grid */}
          {filteredTeams.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-400 space-y-2">
              <Search className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">No teams match your search</p>
              <p className="text-xs">Try clearing the search query or changing the division filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeams.map((team) => {
                const teamDiv = divisions.find((d) => d.id === team.divisionId);
                const isCurrentTeam = team.id === activeTeam.id;

                return (
                  <div
                    key={team.id}
                    className={`bg-slate-900 border rounded-3xl p-5 shadow-xl transition-all space-y-4 relative overflow-hidden ${
                      isCurrentTeam
                        ? 'border-amber-500/50 bg-gradient-to-b from-slate-900 to-amber-950/10 ring-1 ring-amber-500/30'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Team Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <span
                          className="h-6 w-6 rounded-full shrink-0 shadow-md border border-white/20"
                          style={{ backgroundColor: team.badgeColor }}
                        />
                        <div>
                          <h4 className="text-base font-extrabold text-white leading-tight">
                            {team.name}
                          </h4>
                          {teamDiv && (
                            <span className="text-[11px] text-amber-400 font-semibold block mt-0.5">
                              {teamDiv.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {isCurrentTeam && (
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                          Your Team
                        </span>
                      )}
                    </div>

                    {/* Captain Contact Details Box */}
                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                          Team Captain
                        </span>
                        <span className="text-white font-bold text-sm">{team.captainName || 'Not Listed'}</span>
                      </div>

                      {/* Phone Number Action */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                        <div className="flex items-center space-x-2 text-slate-300 min-w-0">
                          <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <a
                            href={`tel:${team.captainPhone}`}
                            className="text-slate-200 hover:text-emerald-400 font-mono font-medium truncate hover:underline"
                            title="Click to Call"
                          >
                            {team.captainPhone || 'No phone'}
                          </a>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {team.captainPhone && (
                            <>
                              <a
                                href={`sms:${team.captainPhone}`}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 text-[11px] font-bold flex items-center space-x-1"
                                title="Send SMS Text"
                              >
                                <MessageSquare className="h-3 w-3" />
                                <span className="hidden sm:inline">SMS</span>
                              </a>
                              <button
                                onClick={() => handleCopy(team.captainPhone, `phone-${team.id}`)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                                title="Copy Phone Number"
                              >
                                {copiedKey === `phone-${team.id}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Email Address Action */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                        <div className="flex items-center space-x-2 text-slate-300 min-w-0">
                          <Mail className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          <a
                            href={`mailto:${team.captainEmail}`}
                            className="text-slate-200 hover:text-blue-400 font-mono font-medium truncate hover:underline"
                            title="Click to Email"
                          >
                            {team.captainEmail || 'No email'}
                          </a>
                        </div>

                        {team.captainEmail && (
                          <button
                            onClick={() => handleCopy(team.captainEmail, `email-${team.id}`)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 shrink-0"
                            title="Copy Email Address"
                          >
                            {copiedKey === `email-${team.id}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Roster Count Footer */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Roster: <strong className="text-slate-200">{team.roster.length} Players</strong></span>
                      <span className="text-slate-500">ID: {team.id}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
        /* ========================================================================= */
        /* TEAM OVERVIEW & ROSTER TAB                                                */
        /* ========================================================================= */
        <>
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
                    <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="font-semibold">{nextMatch.date}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-300 text-sm">
                    <Clock className="h-4 w-4 text-rose-400 shrink-0" />
                    <span className="font-semibold font-mono">{formatTimeRange(nextMatch.startTime, nextMatch.endTime)}</span>
                  </div>
                  <div className="flex items-start space-x-3 text-slate-300 text-sm">
                    <MapPin className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">
                        {primaryLoc?.name || 'Main Facility'} • {subLoc?.name || 'Court 1'}
                      </span>
                      {primaryLoc?.address && (
                        <span className="text-xs text-slate-400 block">{primaryLoc.address}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Opponent / Teams Involved */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  {isPlayingNext ? (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                        Opponent Matchup
                      </span>
                      <div className="flex items-center space-x-3">
                        <span
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: opponentTeam?.badgeColor || '#94a3b8' }}
                        />
                        <span className="text-base font-bold text-white">{opponentTeam?.name || 'TBD Opponent'}</span>
                      </div>
                      <span className="text-xs text-slate-400 block mt-1">
                        {nextMatch.homeTeamId === activeTeam.id ? 'Home Match' : 'Away Match'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                        Teams Playing (You are Ref / Officiating)
                      </span>
                      <div className="text-xs space-y-1 font-semibold text-slate-200">
                        <div>Home: {teams.find((t) => t.id === nextMatch.homeTeamId)?.name}</div>
                        <div>Away: {teams.find((t) => t.id === nextMatch.awayTeamId)?.name}</div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3">
                    <button
                      onClick={() => onOpenScorekeeper(nextMatch)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs shadow-lg shadow-rose-500/20 flex items-center justify-center space-x-2 transition-all"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>{nextMatch.status === 'Completed' ? 'View / Edit Score' : 'Open Scorekeeper'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 space-y-2">
              <Calendar className="h-8 w-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Scheduled Matches Found</h4>
              <p className="text-xs">Schedule has not been generated for this team yet.</p>
            </div>
          )}

          {/* Full Season Fixtures List for this Team */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Season Schedule & Score Records</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">{teamMatches.length} Matches</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {teamMatches.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No fixtures found.</p>
              ) : (
                teamMatches.map((m) => {
                  const isPlaying = m.homeTeamId === activeTeam.id || m.awayTeamId === activeTeam.id;
                  const isRef = m.workTeamId === activeTeam.id;
                  const oppId = isPlaying ? (m.homeTeamId === activeTeam.id ? m.awayTeamId : m.homeTeamId) : undefined;
                  const opp = teams.find((t) => t.id === oppId);
                  const locInfo = getMatchLocation(m);

                  return (
                    <div
                      key={m.id}
                      className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-slate-400 font-bold">Wk #{m.weekNumber}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-white font-semibold">{m.date}</span>
                          <span className="text-slate-400 font-mono">({formatTimeRange(m.startTime, m.endTime)})</span>
                          {isRef && (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Ref Duty
                            </span>
                          )}
                        </div>

                        <div className="text-slate-300">
                          {isPlaying ? (
                            <span>
                              vs <strong className="text-white">{opp?.name || 'TBD'}</strong> (
                              {m.homeTeamId === activeTeam.id ? 'Home' : 'Away'})
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              Officiating: {teams.find((t) => t.id === m.homeTeamId)?.name} vs{' '}
                              {teams.find((t) => t.id === m.awayTeamId)?.name}
                            </span>
                          )}
                          <span className="text-slate-500 ml-2">
                            • {locInfo.primaryLoc?.name} ({locInfo.subLoc?.name})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        {m.status === 'Completed' && m.scores.length > 0 ? (() => {
                          const isHome = m.homeTeamId === activeTeam.id;
                          let myWonSets = 0;
                          let oppWonSets = 0;
                          m.scores.forEach((s) => {
                            const myScore = isHome ? s.homeScore : s.awayScore;
                            const oppScore = isHome ? s.awayScore : s.homeScore;
                            if (myScore > oppScore) myWonSets++;
                            else if (oppScore > myScore) oppWonSets++;
                          });
                          const isWin = isPlaying && myWonSets > oppWonSets;
                          const isLoss = isPlaying && oppWonSets > myWonSets;

                          return (
                            <span
                              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 border ${
                                isWin
                                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                  : isLoss
                                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                              }`}
                            >
                              {isPlaying && (
                                <span
                                  className={`text-[10px] uppercase font-black px-1.5 py-0.2 rounded ${
                                    isWin
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : isLoss
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}
                                >
                                  {isWin ? 'W' : isLoss ? 'L' : 'T'}
                                </span>
                              )}
                              <span>{m.scores.map((s) => `${s.homeScore}-${s.awayScore}`).join(' | ')}</span>
                            </span>
                          );
                        })() : (
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
        </>
      )}

    </div>
  );
};
