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
  BookOpen,
  ShieldCheck,
  ExternalLink,
  Scale,
  KeyRound,
  Eye,
  EyeOff,
  Share2,
  Sparkles,
  Shield,
  X,
} from 'lucide-react';
import { formatTimeRange } from '@/utils/formatUtils';
import { DEFAULT_LEAGUE_RULES } from '@/data/defaultRules';

interface TeamRepDashboardProps {
  teams: Team[];
  matches: Match[];
  locations: Location[];
  divisions: Division[];
  selectedTeamId: string;
  leagueRulesContent?: string;
  onOpenRulesModal?: () => void;
  onOpenFairnessReport?: () => void;
  showFairnessReport?: boolean;
  onSelectTeam: (teamId: string) => void;
  onUpdateRsvp: (teamId: string, playerId: string, status: 'Going' | 'Maybe' | 'Out') => void;
  onOpenScorekeeper: (match: Match) => void;
  onUpdateTeamPin?: (teamId: string, newPin: string) => void;
  currentRole?: 'public' | 'team_rep' | 'scheduler';
}

export const TeamRepDashboard: React.FC<TeamRepDashboardProps> = ({
  teams,
  matches,
  locations,
  divisions,
  selectedTeamId,
  leagueRulesContent,
  onOpenRulesModal,
  onOpenFairnessReport,
  showFairnessReport = true,
  onSelectTeam,
  onUpdateRsvp,
  onOpenScorekeeper,
  onUpdateTeamPin,
  currentRole,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'directory' | 'rules'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivFilter, setSelectedDivFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [rulesSearch, setRulesSearch] = useState('');
  const [copiedRules, setCopiedRules] = useState(false);

  // Captain PIN Management State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPinQuick, setCopiedPinQuick] = useState(false);

  const activeRulesText = leagueRulesContent || DEFAULT_LEAGUE_RULES;
  const activeTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  if (!activeTeam) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-500 dark:text-slate-400 space-y-3 shadow-sm">
        <Users className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Teams Registered Yet</h3>
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

  const getMatchLocation = (match: Match) => {
    const subLocId = match.subLocationId || match.courtId;
    const primaryLoc = locations.find(
      (l) => l.id === match.locationId || l.subLocations.some((s) => s.id === subLocId)
    );
    const subLoc = primaryLoc?.subLocations.find((s) => s.id === subLocId);
    return { primaryLoc, subLoc };
  };

  const { primaryLoc, subLoc } = nextMatch
    ? getMatchLocation(nextMatch)
    : { primaryLoc: undefined, subLoc: undefined };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAllEmails = (teamList: Team[]) => {
    const emails = teamList
      .map((t) => t.captainEmail)
      .filter(Boolean)
      .join(', ');
    navigator.clipboard.writeText(emails);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopyCaptainLink = () => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const directUrl = `${origin}${pathname}?team=${activeTeam.id}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCurrentPin = () => {
    const currentPin = activeTeam.accessPin || '1234';
    navigator.clipboard.writeText(currentPin);
    setCopiedPinQuick(true);
    setTimeout(() => setCopiedPinQuick(false), 2000);
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    const cleanPin = newPin.trim();
    if (!cleanPin) {
      setPinError('PIN cannot be empty.');
      return;
    }
    if (cleanPin.length < 4) {
      setPinError('PIN must be at least 4 digits/characters.');
      return;
    }
    if (cleanPin !== confirmPin.trim()) {
      setPinError('New PIN and Confirm PIN do not match.');
      return;
    }

    if (onUpdateTeamPin) {
      onUpdateTeamPin(activeTeam.id, cleanPin);
    }
    setPinSuccess(`Team PIN successfully updated!`);
    setTimeout(() => {
      setNewPin('');
      setConfirmPin('');
      setIsPinModalOpen(false);
      setPinSuccess('');
      setPinError('');
    }, 1200);
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm dark:shadow-xl transition-colors duration-150">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <span
            className="h-6 w-6 rounded-full shrink-0 shadow-md border border-slate-300 dark:border-white/20"
            style={{ backgroundColor: activeTeam.badgeColor }}
          />
          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-500 block">
              Active Team View
            </label>
            {currentRole === 'team_rep' ? (
              <div className="text-slate-900 dark:text-white font-bold text-lg flex items-center space-x-2">
                <span>{activeTeam.name}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Lock className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                  <span>My Authenticated Team</span>
                </span>
              </div>
            ) : (
              <select
                value={activeTeam.id}
                onChange={(e) => onSelectTeam(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-bold text-lg focus:outline-none cursor-pointer"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {t.name} ({divisions.find((d) => d.id === t.divisionId)?.name})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center flex-wrap gap-1.5 bg-white dark:bg-[#15171b] p-1.5 rounded-2xl border border-slate-200 dark:border-[#1c1f24] w-full md:w-auto shadow-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'overview'
                ? 'bg-[#101010] text-white dark:bg-[#007afc] dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c1f24]'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Schedule & Roster</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'directory'
                ? 'bg-[#101010] text-white dark:bg-[#007afc] dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c1f24]'
            }`}
          >
            <BookUser className="h-4 w-4" />
            <span>Captains Directory</span>
            <span className="bg-slate-200 dark:bg-[#23262d] text-slate-800 dark:text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              {teams.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'rules'
                ? 'bg-[#101010] text-white dark:bg-[#007afc] dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c1f24]'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>League Rules</span>
          </button>

          {showFairnessReport && onOpenFairnessReport && (
            <button
              onClick={onOpenFairnessReport}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all text-violet-700 dark:text-violet-400 hover:text-violet-900 dark:hover:text-violet-300 hover:bg-violet-500/10 border border-violet-500/30"
            >
              <Scale className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span>Fairness</span>
            </button>
          )}

          {onUpdateTeamPin && (
            <button
              onClick={() => {
                setNewPin('');
                setConfirmPin('');
                setPinError('');
                setPinSuccess('');
                setIsPinModalOpen(true);
              }}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 shadow-xs"
              title="Manage Team Captain PIN"
            >
              <KeyRound className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              <span>Captain PIN</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'directory' ? (
        /* ========================================================================= */
        /* CAPTAINS & TEAMS CONTACT DIRECTORY (CAPTAIN / ADMIN PRIVATE ACCESS ONLY)  */
        /* ========================================================================= */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Privacy & Info Banner */}
          <div className="bg-white dark:bg-[#15171b] border border-slate-200 dark:border-[#1c1f24] rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#1c1f24] text-slate-700 dark:text-[#a0aaba] border border-slate-200 dark:border-[#333943] shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-extrabold text-[#101010] dark:text-[#ffffff]">Private Captains Contact Directory</h3>
                  <span className="bg-slate-100 dark:bg-[#1c1f24] text-slate-700 dark:text-[#a0aaba] text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#333943]">
                    Captains & Admins Only
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#8b96aa] mt-1">
                  Use this directory to contact opposing captains for match coordination, notifications, or emergency updates. This data is hidden from public visitors.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleCopyAllEmails(filteredTeams)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#1c1f24] dark:hover:bg-[#23262d] text-slate-700 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#333943] font-bold text-xs flex items-center space-x-2 transition-all shrink-0 shadow-xs"
            >
              {copiedAll ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">All Emails Copied!</span>
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm dark:shadow-lg">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search team, captain, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>

            {divisions.length > 1 && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">Division:</span>
                <select
                  value={selectedDivFilter}
                  onChange={(e) => setSelectedDivFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer w-full sm:w-auto"
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-slate-400 space-y-2">
              <Search className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">No teams match your search</p>
              <p className="text-xs text-slate-500">Try clearing the search query or changing the division filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeams.map((team) => {
                const teamDiv = divisions.find((d) => d.id === team.divisionId);
                const isCurrentTeam = team.id === activeTeam.id;

                return (
                  <div
                    key={team.id}
                    className={`bg-white dark:bg-[#15171b] border rounded-3xl p-5 shadow-xs transition-all space-y-4 relative overflow-hidden ${
                      isCurrentTeam
                        ? 'border-slate-400 dark:border-[#007afc] ring-1 ring-slate-400 dark:ring-[#007afc]'
                        : 'border-slate-200 dark:border-[#1c1f24] hover:border-slate-300 dark:hover:border-[#333943]'
                    }`}
                  >
                    {/* Top Team Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <span
                          className="h-6 w-6 rounded-full shrink-0 shadow-md border border-slate-300 dark:border-white/20"
                          style={{ backgroundColor: team.badgeColor }}
                        />
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                            {team.name}
                          </h4>
                          {teamDiv && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                              {teamDiv.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {isCurrentTeam && (
                        <span className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                          Your Team
                        </span>
                      )}
                    </div>

                    {/* Captain Contact Details Box */}
                    <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                          Team Captain
                        </span>
                        <span className="text-slate-900 dark:text-white font-bold text-sm">{team.captainName || 'Not Listed'}</span>
                      </div>

                      {/* Phone Number Action */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 min-w-0">
                          <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <a
                            href={`tel:${team.captainPhone}`}
                            className="text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-mono font-medium truncate hover:underline"
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
                                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-800 text-[11px] font-bold flex items-center space-x-1"
                                title="Send SMS Text"
                              >
                                <MessageSquare className="h-3 w-3" />
                                <span className="hidden sm:inline">SMS</span>
                              </a>
                              <button
                                onClick={() => handleCopy(team.captainPhone, `phone-${team.id}`)}
                                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                                title="Copy Phone Number"
                              >
                                {copiedKey === `phone-${team.id}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Email Address Action */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 min-w-0">
                          <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <a
                            href={`mailto:${team.captainEmail}`}
                            className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-mono font-medium truncate hover:underline"
                            title="Click to Email"
                          >
                            {team.captainEmail || 'No email'}
                          </a>
                        </div>

                        {team.captainEmail && (
                          <button
                            onClick={() => handleCopy(team.captainEmail, `email-${team.id}`)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 shrink-0"
                            title="Copy Email Address"
                          >
                            {copiedKey === `email-${team.id}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Roster Count Footer */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Roster: <strong className="text-slate-800 dark:text-slate-200">{team.roster.length} Players</strong></span>
                      <span className="text-slate-400 dark:text-slate-500">ID: {team.id}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : activeTab === 'overview' ? (
        /* ========================================================================= */
        /* TEAM OVERVIEW & ROSTER TAB                                                */
        /* ========================================================================= */
        <>
          {/* Next Match & Ref Duty Highlight Card */}
          {nextMatch ? (
            <div className="relative overflow-hidden bg-white dark:bg-[#15171b] border border-slate-200 dark:border-[#1c1f24] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="bg-slate-100 dark:bg-[#1c1f24] text-slate-800 dark:text-white border border-slate-200 dark:border-[#333943] text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Next Upcoming Fixture
                </span>
                <span className="text-xs text-slate-500 dark:text-[#8b96aa] font-mono">Week #{nextMatch.weekNumber}</span>
              </div>

              {/* If Team is assigned to Officiate (Ref Duty) */}
              {isRefDutyNext && (
                <div className="p-4 bg-slate-50 dark:bg-[#1c1f24] border border-slate-200 dark:border-[#333943] rounded-2xl space-y-1">
                  <div className="flex items-center space-x-2 text-[#101010] dark:text-[#ffffff] font-bold text-sm">
                    <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                    <span>Ref Duty Mandatory Alert!</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#a0aaba]">
                    Your team <strong className="text-slate-900 dark:text-white">{activeTeam.name}</strong> is assigned to work/officiate this match! Please provide 1 Up-ref, 1 Down-ref, 1 Scorekeeper, and 2 Line judges.
                  </p>
                </div>
              )}

              {/* Match Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* Left: Time & Location */}
                <div className="space-y-3 bg-slate-50 dark:bg-[#0e1012] p-4 rounded-2xl border border-slate-200 dark:border-[#1c1f24]">
                  <div className="flex items-center space-x-3 text-slate-700 dark:text-[#a0aaba] text-sm">
                    <Calendar className="h-4 w-4 text-slate-500 dark:text-[#8b96aa] shrink-0" />
                    <span className="font-semibold">{nextMatch.date}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-700 dark:text-[#a0aaba] text-sm">
                    <Clock className="h-4 w-4 text-slate-500 dark:text-[#8b96aa] shrink-0" />
                    <span className="font-semibold font-mono">{formatTimeRange(nextMatch.startTime, nextMatch.endTime)}</span>
                  </div>
                  <div className="flex items-start space-x-3 text-slate-700 dark:text-[#a0aaba] text-sm">
                    <MapPin className="h-4 w-4 text-slate-500 dark:text-[#8b96aa] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {primaryLoc?.name || 'Main Facility'} • {subLoc?.name || 'Court 1'}
                      </span>
                      {primaryLoc?.address && (
                        <span className="text-xs text-slate-500 dark:text-[#8b96aa] block">{primaryLoc.address}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Opponent / Teams Involved */}
                <div className="bg-slate-50 dark:bg-[#0e1012] p-4 rounded-2xl border border-slate-200 dark:border-[#1c1f24] flex flex-col justify-between">
                  {isPlayingNext ? (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                        Opponent Matchup
                      </span>
                      <div className="flex items-center space-x-3">
                        <span
                          className="h-4 w-4 rounded-full shadow-sm"
                          style={{ backgroundColor: opponentTeam?.badgeColor || '#94a3b8' }}
                        />
                        <span className="text-base font-bold text-slate-900 dark:text-white">{opponentTeam?.name || 'TBD Opponent'}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-[#8b96aa] block mt-1">
                        {nextMatch.homeTeamId === activeTeam.id ? 'Home Match' : 'Away Match'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                        Teams Playing (You are Ref / Officiating)
                      </span>
                      <div className="text-xs space-y-1 font-semibold text-slate-700 dark:text-slate-200">
                        <div>Home: {teams.find((t) => t.id === nextMatch.homeTeamId)?.name}</div>
                        <div>Away: {teams.find((t) => t.id === nextMatch.awayTeamId)?.name}</div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3">
                    <button
                      onClick={() => onOpenScorekeeper(nextMatch)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] dark:text-white font-bold text-xs shadow-xs flex items-center justify-center space-x-2 transition-all"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>{nextMatch.status === 'Completed' ? 'View / Edit Score' : 'Open Scorekeeper'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Calendar className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Scheduled Matches Found</h4>
              <p className="text-xs">Schedule has not been generated for this team yet.</p>
            </div>
          )}

          {/* Full Season Fixtures List for this Team */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Season Schedule & Score Records</h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{teamMatches.length} Matches</span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
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
                          <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">Wk #{m.weekNumber}</span>
                          <span className="text-slate-400 dark:text-slate-500">•</span>
                          <span className="text-slate-900 dark:text-white font-semibold">{m.date}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono">({formatTimeRange(m.startTime, m.endTime)})</span>
                          {isRef && (
                            <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Ref Duty
                            </span>
                          )}
                        </div>

                        <div className="text-slate-700 dark:text-slate-300">
                          {isPlaying ? (
                            <span>
                              vs <strong className="text-slate-900 dark:text-white">{opp?.name || 'TBD'}</strong> (
                              {m.homeTeamId === activeTeam.id ? 'Home' : 'Away'})
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">
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
                                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                  : isLoss
                                  ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30'
                                  : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
                              }`}
                            >
                              {isPlaying && (
                                <span
                                  className={`text-[10px] uppercase font-black px-1.5 py-0.2 rounded ${
                                    isWin
                                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                      : isLoss
                                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
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
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs border border-amber-500/30 flex items-center space-x-1.5 transition-all shadow-sm"
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

          {/* Captain Access & PIN Security Banner Card */}
          <div className="bg-white dark:bg-[#15171b] border border-[#e5e7eb] dark:border-[#333943] rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#1c1f24] text-[#242424] dark:text-[#a0aaba] border border-[#e5e7eb] dark:border-[#333943] shrink-0">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-[#242424] dark:text-white">Captain Access PIN & Security</h3>
                    <span className="bg-slate-100 dark:bg-[#1c1f24] text-[#242424] dark:text-[#a0aaba] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#e5e7eb] dark:border-[#333943]">
                      Private
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#a0aaba] mt-0.5">
                    Your 4-digit PIN authenticates your team captain portal and scorekeeper access for <strong className="text-slate-900 dark:text-white">{activeTeam.name}</strong>.
                  </p>
                </div>
              </div>

              {onUpdateTeamPin && (
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setNewPin('');
                      setConfirmPin('');
                      setPinError('');
                      setPinSuccess('');
                      setIsPinModalOpen(true);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Change 4-Digit PIN</span>
                  </button>
                </div>
              )}
            </div>

            {/* Current PIN & Quick Actions Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Current Captain PIN</span>
                  <span className="text-base font-mono font-black text-amber-600 dark:text-amber-400">
                    {showCurrentPin ? (activeTeam.accessPin || '1234') : '••••'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors"
                    title={showCurrentPin ? 'Hide PIN' : 'Reveal PIN'}
                  >
                    {showCurrentPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCurrentPin}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors"
                    title="Copy PIN"
                  >
                    {copiedPinQuick ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Direct Captain Link</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate block">Instant sign-in URL with PIN</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCaptainLink}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Roster & Mobile RSVP Check-in Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Team Roster & Player RSVPs</h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {activeTeam.roster.filter((p) => p.rsvpStatus === 'Going').length} / {activeTeam.roster.length} Attending
              </span>
            </div>

            {/* Captain Card Header */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
              <div>
                <span className="text-slate-500">Team Captain: </span>
                <strong className="text-slate-900 dark:text-white font-bold">{activeTeam.captainName}</strong>
              </div>
              <div className="flex items-center flex-wrap gap-3 text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {activeTeam.captainEmail}</span>
                <span className="flex items-center gap-1 hidden sm:flex"><Phone className="h-3.5 w-3.5" /> {activeTeam.captainPhone}</span>
                {onUpdateTeamPin && (
                  <button
                    onClick={() => {
                      setNewPin('');
                      setConfirmPin('');
                      setPinError('');
                      setPinSuccess('');
                      setIsPinModalOpen(true);
                    }}
                    className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Change PIN</span>
                  </button>
                )}
              </div>
            </div>

            {/* Player Roster Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeTeam.roster.map((player) => (
                <div
                  key={player.id}
                  className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between space-x-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{player.name}</span>
                      {player.number && (
                        <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded">
                          #{player.number}
                        </span>
                      )}
                      {player.isCaptain && (
                        <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                          Captain
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">{player.position}</span>
                  </div>

                  {/* RSVP Mobile Buttons */}
                  <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => onUpdateRsvp(activeTeam.id, player.id, 'Going')}
                      title="Attending"
                      className={`p-1.5 rounded-lg transition-all ${
                        player.rsvpStatus === 'Going'
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onUpdateRsvp(activeTeam.id, player.id, 'Maybe')}
                      title="Maybe"
                      className={`p-1.5 rounded-lg transition-all ${
                        player.rsvpStatus === 'Maybe'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onUpdateRsvp(activeTeam.id, player.id, 'Out')}
                      title="Out"
                      className={`p-1.5 rounded-lg transition-all ${
                        player.rsvpStatus === 'Out'
                          ? 'bg-rose-500 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
      ) : (
        /* ========================================================================= */
        /* LEAGUE RULES & POLICIES TAB                                               */
        /* ========================================================================= */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Banner */}
          <div className="bg-white dark:bg-[#15171b] border border-[#e5e7eb] dark:border-[#1c1f24] rounded-3xl p-5 shadow-sm dark:shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#1c1f24] text-[#242424] dark:text-[#a0aaba] border border-[#e5e7eb] dark:border-[#333943] shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-extrabold text-[#242424] dark:text-white">Official League Rules & Guidelines</h3>
                  <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Captain & Player Reference
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Official gameplay rules, match timing, substitution rules, scoring, and sportsmanship policies.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeRulesText);
                  setCopiedRules(true);
                  setTimeout(() => setCopiedRules(false), 2000);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                {copiedRules ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copiedRules ? 'Rules Copied!' : 'Copy Rules'}</span>
              </button>

              {onOpenRulesModal && (
                <button
                  onClick={onOpenRulesModal}
                  className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/20 flex items-center space-x-1.5 transition-all"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>{currentRole === 'scheduler' ? 'Edit / Paste Rules' : 'Open Full Viewer'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Search bar for rules */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-sm dark:shadow-lg">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search rules (e.g. forfeit, net, scoring, subs)..."
                value={rulesSearch}
                onChange={(e) => setRulesSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Formatted Rules Document Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-2xl space-y-4">
            <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
              {activeRulesText.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} className="h-2" />;

                const isHighlighted =
                  rulesSearch.trim().length > 1 &&
                  trimmed.toLowerCase().includes(rulesSearch.toLowerCase().trim());

                if (trimmed.startsWith('# ')) {
                  return (
                    <h1
                      key={idx}
                      className={`text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-4 pb-2 border-b border-slate-200 dark:border-slate-800 tracking-tight ${
                        isHighlighted ? 'bg-amber-500/20 px-2 rounded' : ''
                      }`}
                    >
                      {trimmed.substring(2)}
                    </h1>
                  );
                }

                if (trimmed.startsWith('## ')) {
                  return (
                    <h2
                      key={idx}
                      className={`text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400 pt-3 pb-1 tracking-tight ${
                        isHighlighted ? 'bg-amber-500/20 px-2 rounded' : ''
                      }`}
                    >
                      {trimmed.substring(3)}
                    </h2>
                  );
                }

                if (trimmed.startsWith('### ')) {
                  return (
                    <h3
                      key={idx}
                      className={`text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 pt-2 pb-1 ${
                        isHighlighted ? 'bg-amber-500/20 px-2 rounded' : ''
                      }`}
                    >
                      {trimmed.substring(4)}
                    </h3>
                  );
                }

                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  const itemText = trimmed.substring(2);
                  const parts = itemText.split(/(\*\*.*?\*\*)/g);

                  return (
                    <div
                      key={idx}
                      className={`flex items-start space-x-2.5 ml-2 ${
                        isHighlighted ? 'bg-amber-500/20 p-1.5 rounded' : ''
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mt-2 shrink-0" />
                      <span className="text-slate-800 dark:text-slate-200">
                        {parts.map((p, i) =>
                          p.startsWith('**') && p.endsWith('**') ? (
                            <strong key={i} className="text-slate-900 dark:text-white font-bold">
                              {p.slice(2, -2)}
                            </strong>
                          ) : (
                            p
                          )
                        )}
                      </span>
                    </div>
                  );
                }

                if (/^\d+\.\s/.test(trimmed)) {
                  const match = trimmed.match(/^(\d+\.)\s(.*)/);
                  if (match) {
                    const parts = match[2].split(/(\*\*.*?\*\*)/g);
                    return (
                      <div
                        key={idx}
                        className={`flex items-start space-x-2 ml-2 ${
                          isHighlighted ? 'bg-amber-500/20 p-1.5 rounded' : ''
                        }`}
                      >
                        <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-xs shrink-0 mt-0.5">
                          {match[1]}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200">
                          {parts.map((p, i) =>
                            p.startsWith('**') && p.endsWith('**') ? (
                              <strong key={i} className="text-slate-900 dark:text-white font-bold">
                                {p.slice(2, -2)}
                              </strong>
                            ) : (
                              p
                            )
                          )}
                        </span>
                      </div>
                    );
                  }
                }

                const parts = trimmed.split(/(\*\*.*?\*\*)/g);
                return (
                  <p
                    key={idx}
                    className={`text-slate-700 dark:text-slate-300 ${
                      isHighlighted ? 'bg-amber-500/20 p-1 rounded' : ''
                    }`}
                  >
                    {parts.map((p, i) =>
                      p.startsWith('**') && p.endsWith('**') ? (
                        <strong key={i} className="text-slate-900 dark:text-white font-bold">
                          {p.slice(2, -2)}
                        </strong>
                      ) : (
                        p
                      )
                    )}
                  </p>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Change Captain PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 transition-colors duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Change Captain PIN
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeTeam.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPinModalOpen(false);
                  setPinError('');
                  setPinSuccess('');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNewPin} className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2.5">
                <Shield className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <span>Current PIN: </span>
                  <strong className="font-mono font-bold text-slate-900 dark:text-white">
                    {activeTeam.accessPin || '1234'}
                  </strong>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                    Setting a new PIN will immediately update login credentials for your team.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  New 4-Digit PIN
                </label>
                <div className="relative">
                  <input
                    id="new-captain-pin-input"
                    name="new-captain-pin-input"
                    type={showNewPin ? 'text' : 'password'}
                    maxLength={10}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    placeholder="Enter new 4-digit PIN (e.g. 5829)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-mono tracking-wider text-amber-600 dark:text-amber-400 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-3.5 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    {showNewPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Confirm New PIN
                </label>
                <input
                  id="confirm-captain-pin-input"
                  name="confirm-captain-pin-input"
                  type={showNewPin ? 'text' : 'password'}
                  maxLength={10}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  placeholder="Re-type new PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-wider text-amber-600 dark:text-amber-400 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {pinError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {pinSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPinModalOpen(false);
                    setPinError('');
                    setPinSuccess('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Save New PIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
