'use client';

import React, { useState } from 'react';
import { Match, Team, Location, Division } from '@/types/league';
import { Printer, X, Calendar, User, FileText, Check, Layers, MapPin } from 'lucide-react';
import { formatTime, formatTimeRange } from '@/utils/formatUtils';

interface PrintScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  teams: Team[];
  locations: Location[];
  divisions: Division[];
  selectedDivisionId: string;
  leagueName?: string;
}

export const PrintScheduleModal: React.FC<PrintScheduleModalProps> = ({
  isOpen,
  onClose,
  matches,
  teams,
  locations,
  divisions,
  selectedDivisionId,
  leagueName = 'PowerSchedule Volleyball League',
}) => {
  const [printMode, setPrintMode] = useState<'master' | 'team' | 'all_teams'>('master');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  if (!isOpen) return null;

  const divisionTeams = teams.filter((t) => t.divisionId === selectedDivisionId);
  const divisionMatches = matches.filter((m) => m.divisionId === selectedDivisionId);
  const currentDivision = divisions.find((d) => d.id === selectedDivisionId);

  // Set default selected team if not set
  const activeTeamId = selectedTeamId || (divisionTeams.length > 0 ? divisionTeams[0].id : '');

  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]));

  // Helper to dynamically resolve Location and Court
  const getMatchLocationName = (match: Match) => {
    const subLocId = match.subLocationId || match.courtId;
    const primaryLoc = locations.find(
      (l) => l.id === match.locationId || l.subLocations.some((s) => s.id === subLocId)
    );
    const subLoc = primaryLoc?.subLocations.find((s) => s.id === subLocId);

    const courtName = subLoc?.name || 'Court';
    const locName = primaryLoc?.name || '';

    return locName ? `${locName} (${courtName})` : courtName;
  };

  // Group division matches by week
  const matchesByWeek = new Map<number, Match[]>();
  divisionMatches.forEach((m) => {
    const list = matchesByWeek.get(m.weekNumber) || [];
    list.push(m);
    matchesByWeek.set(m.weekNumber, list);
  });

  const weeksList = Array.from(matchesByWeek.keys()).sort((a, b) => a - b);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* CSS Print Overrides */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-schedule-area, #printable-schedule-area * {
            visibility: visible !important;
          }
          #printable-schedule-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            color: #0f172a !important;
            background: #ffffff !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-after {
            page-break-after: always !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header Controls (Screen only) */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Printable Schedule Studio</h3>
              <p className="text-xs text-slate-400">Export master schedules & team highlighted schedule sheets</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg flex items-center space-x-1.5 transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Option Selector Bar (Screen only) */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPrintMode('master')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                printMode === 'master'
                  ? 'bg-rose-500 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Master Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintMode('team')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                printMode === 'team'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Single Team Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintMode('all_teams')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                printMode === 'all_teams'
                  ? 'bg-violet-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Teams Batch Packet ({divisionTeams.length})</span>
            </button>
          </div>

          {/* Team Dropdown Selector (Active when 'team' mode is selected) */}
          {printMode === 'team' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Highlight Team:</span>
              <select
                value={activeTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {divisionTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Printable Document Preview Area */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-900 text-slate-100 flex-1">
          <div
            id="printable-schedule-area"
            className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6"
          >

            {/* MODE 1: MASTER SCHEDULE */}
            {printMode === 'master' && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="border-b-2 border-slate-700 pb-4 flex items-between justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-white print:text-black">
                      {leagueName}
                    </h1>
                    <h2 className="text-base font-bold text-rose-400 print:text-slate-800">
                      Official Master Schedule — {currentDivision?.name || 'Main Division'}
                    </h2>
                    <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                      Total Fixtures: {divisionMatches.length} | Teams: {divisionTeams.length} | Generated by PowerSchedule
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1 rounded-xl text-xs font-mono font-bold print:border-black print:text-black print:bg-white">
                      MASTER LIST
                    </span>
                  </div>
                </div>

                {/* Matches Grouped by Week */}
                {weeksList.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No matches scheduled in this division yet.</p>
                ) : (
                  weeksList.map((weekNum) => {
                    const weekMatches = matchesByWeek.get(weekNum) || [];
                    const weekDate = weekMatches[0]?.date || '';

                    return (
                      <div key={weekNum} className="space-y-2">
                        <div className="bg-slate-900 print:bg-slate-200 p-2.5 rounded-xl border border-slate-800 print:border-slate-400 flex items-center justify-between">
                          <span className="font-extrabold text-xs text-amber-400 print:text-slate-900 uppercase tracking-wider">
                            Week {weekNum} • {weekDate}
                          </span>
                          <span className="text-[11px] text-slate-400 print:text-slate-700 font-medium">
                            {weekMatches.length} Matches
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 print:border-slate-400 text-slate-400 print:text-slate-700 uppercase text-[10px] tracking-wider">
                                <th className="py-2 px-2 font-semibold">Time</th>
                                <th className="py-2 px-2 font-semibold">Court / Location</th>
                                <th className="py-2 px-2 font-semibold text-right">Home Team</th>
                                <th className="py-2 px-2 font-semibold text-center">vs</th>
                                <th className="py-2 px-2 font-semibold text-left">Away Team</th>
                                <th className="py-2 px-2 font-semibold text-center">Ref Duty</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
                              {weekMatches.map((m) => {
                                const homeTeam = teamMap.get(m.homeTeamId)?.name || m.homeTeamId;
                                const awayTeam = teamMap.get(m.awayTeamId)?.name || m.awayTeamId;
                                const refTeam = teamMap.get(m.workTeamId || '')?.name;
                                const locationLabel = getMatchLocationName(m);

                                return (
                                  <tr key={m.id} className="hover:bg-slate-900/40 print:hover:bg-transparent">
                                    <td className="py-2 px-2 font-mono font-bold text-amber-300 print:text-black">
                                      {formatTime(m.startTime)}
                                    </td>
                                    <td className="py-2 px-2 text-slate-300 print:text-slate-800 font-medium">
                                      {locationLabel}
                                    </td>
                                    <td className="py-2 px-2 text-right font-bold text-white print:text-black">
                                      {homeTeam}
                                    </td>
                                    <td className="py-2 px-2 text-center text-slate-500 font-semibold">vs</td>
                                    <td className="py-2 px-2 text-left font-bold text-white print:text-black">
                                      {awayTeam}
                                    </td>
                                    <td className="py-2 px-2 text-center text-violet-400 print:text-slate-800 font-semibold text-[11px]">
                                      {refTeam ? `🏐 ${refTeam}` : '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* MODE 2: SINGLE TEAM SCHEDULE (TARGET TEAM HIGHLIGHTED) */}
            {printMode === 'team' && (
              <TeamPrintSheet
                teamId={activeTeamId}
                matches={divisionMatches}
                teams={teams}
                locations={locations}
                currentDivisionName={currentDivision?.name}
                leagueName={leagueName}
                getMatchLocationName={getMatchLocationName}
              />
            )}

            {/* MODE 3: ALL TEAMS BATCH PRINT PACKET */}
            {printMode === 'all_teams' && (
              <div className="space-y-12">
                {divisionTeams.map((team, idx) => (
                  <div key={team.id} className={idx < divisionTeams.length - 1 ? 'page-break-after pb-8 border-b-2 border-dashed border-slate-800 print:border-slate-400' : ''}>
                    <TeamPrintSheet
                      teamId={team.id}
                      matches={divisionMatches}
                      teams={teams}
                      locations={locations}
                      currentDivisionName={currentDivision?.name}
                      leagueName={leagueName}
                      getMatchLocationName={getMatchLocationName}
                    />
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Footer (Screen only) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 no-print">
          <p className="text-xs text-slate-400">
            Tip: Select "Save as PDF" in your browser print window to create a PDF file.
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              Close Preview
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center space-x-1.5 transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// Reusable Printable Sheet Component for a single team with highlighted styling
interface TeamPrintSheetProps {
  teamId: string;
  matches: Match[];
  teams: Team[];
  locations: Location[];
  currentDivisionName?: string;
  leagueName: string;
  getMatchLocationName: (match: Match) => string;
}

const TeamPrintSheet: React.FC<TeamPrintSheetProps> = ({
  teamId,
  matches,
  teams,
  currentDivisionName,
  leagueName,
  getMatchLocationName,
}) => {
  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]));
  const targetTeam = teamMap.get(teamId);

  if (!targetTeam) {
    return <div className="text-slate-400 p-4">Select a team to view schedule.</div>;
  }

  // Filter matches involving this team (as Home, Away, or Work Team)
  const teamMatches = matches
    .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId || m.workTeamId === teamId)
    .sort((a, b) => a.weekNumber - b.weekNumber || a.startTime.localeCompare(b.startTime));

  const totalPlayingGames = teamMatches.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId).length;
  const totalRefDuties = teamMatches.filter((m) => m.workTeamId === teamId).length;

  return (
    <div className="space-y-6 bg-slate-950 print:bg-white p-4 rounded-xl border border-slate-800 print:border-none">
      
      {/* Team Header Banner */}
      <div className="border-b-2 border-amber-500 pb-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 print:text-slate-800 block">
            {leagueName} • {currentDivisionName || 'Main Division'}
          </span>
          <h1 className="text-2xl font-black text-white print:text-black mt-0.5">
            Team Schedule: <span className="text-amber-400 print:text-black underline decoration-amber-500">{targetTeam.name}</span>
          </h1>
          <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
            Season Summary: <strong className="text-white print:text-black">{totalPlayingGames} Matches</strong> Scheduled
            {totalRefDuties > 0 && <span> • <strong>{totalRefDuties} Referee Duties</strong></span>}
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 print:border-slate-800 print:bg-slate-100 text-center">
            <span className="block text-xs font-bold text-amber-400 print:text-black">TEAM SCHEDULE</span>
            <span className="block text-[10px] text-slate-400 print:text-slate-600 font-mono">HIGHLIGHTED</span>
          </div>
        </div>
      </div>

      {/* Team Matches Table */}
      {teamMatches.length === 0 ? (
        <div className="text-center py-8 text-slate-400">No scheduled matches found for team {targetTeam.name}.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 print:border-slate-400 text-slate-400 print:text-slate-800 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 font-bold">Week / Date</th>
                <th className="py-2.5 px-3 font-bold">Time</th>
                <th className="py-2.5 px-3 font-bold">Court / Location</th>
                <th className="py-2.5 px-3 font-bold">Fixture Matchup</th>
                <th className="py-2.5 px-3 font-bold text-center">Role / Duty</th>
                <th className="py-2.5 px-3 font-bold text-right">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 print:divide-slate-300">
              {teamMatches.map((m) => {
                const isHome = m.homeTeamId === teamId;
                const isAway = m.awayTeamId === teamId;
                const isRef = m.workTeamId === teamId;

                const opponentId = isHome ? m.awayTeamId : isAway ? m.homeTeamId : '';
                const opponentName = opponentId ? teamMap.get(opponentId)?.name || opponentId : '';
                const locationLabel = getMatchLocationName(m);

                return (
                  <tr
                    key={m.id}
                    className={`transition-colors ${
                      isRef
                        ? 'bg-violet-500/10 print:bg-slate-100'
                        : 'bg-slate-900/40 print:bg-white'
                    }`}
                  >
                    {/* Date */}
                    <td className="py-3 px-3 font-bold text-white print:text-black">
                      <span className="text-amber-400 print:text-black mr-1">W{m.weekNumber}</span>
                      <span className="font-mono text-slate-300 print:text-slate-800">• {m.date}</span>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-3 font-mono font-bold text-amber-300 print:text-black">
                      {formatTimeRange(m.startTime, m.endTime)}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 text-slate-300 print:text-slate-800 font-medium">
                      {locationLabel}
                    </td>

                    {/* Fixture Matchup with Target Team HIGHLIGHTED */}
                    <td className="py-3 px-3 text-sm font-bold">
                      {isRef ? (
                        <span className="text-violet-300 print:text-slate-800">
                          Ref Officiating: {teamMap.get(m.homeTeamId)?.name} vs {teamMap.get(m.awayTeamId)?.name}
                        </span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-lg border font-black ${
                              isHome
                                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm print:bg-amber-200 print:border-black print:text-black'
                                : 'text-slate-300 print:text-slate-700 border-slate-700'
                            }`}
                          >
                            {teamMap.get(m.homeTeamId)?.name}
                            {isHome && ' (Home)'}
                          </span>
                          <span className="text-slate-500 text-xs">vs</span>
                          <span
                            className={`px-2 py-0.5 rounded-lg border font-black ${
                              isAway
                                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm print:bg-amber-200 print:border-black print:text-black'
                                : 'text-slate-300 print:text-slate-700 border-slate-700'
                            }`}
                          >
                            {teamMap.get(m.awayTeamId)?.name}
                            {isAway && ' (Away)'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Role / Duty */}
                    <td className="py-3 px-3 text-center">
                      {isRef ? (
                        <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 print:border-slate-800 print:text-slate-950 px-2 py-0.5 rounded-md font-extrabold text-[11px]">
                          🏐 REFEREE
                        </span>
                      ) : isHome ? (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:border-slate-800 print:text-slate-950 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          HOME TEAM
                        </span>
                      ) : (
                        <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 print:border-slate-800 print:text-slate-950 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          AWAY TEAM
                        </span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-3 text-right font-medium text-[11px] text-slate-400 print:text-slate-700">
                      {m.isExhibition && <span className="text-amber-400 print:text-black font-bold">[Exhibition] </span>}
                      {m.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
