'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Match, Team, Location, Division } from '@/types/league';
import { Printer, X, User, FileText, Layers } from 'lucide-react';
import { formatTime, formatShortDate } from '@/utils/formatUtils';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only render on the client (the print view uses browser-only APIs)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 print-modal-container">
      {/* CSS Print Overrides */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 10mm 10mm 10mm 10mm;
            size: portrait;
          }

          /* Hide all main site content outside print modal from layout flow to eliminate blank pages */
          body > *:not(.print-modal-container) {
            display: none !important;
          }

          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-modal-container {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          .print-modal-content {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          #printable-schedule-area {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Prevent individual table rows and week headers from splitting in half across page margins */
          /* Keep subtle fills (zebra weeks, role pills) on team sheets */
          .team-print-sheet, .team-print-sheet * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          tr, .print-week-block, .team-print-sheet tbody {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          thead {
            display: table-header-group !important;
          }

          tbody {
            display: table-row-group !important;
          }

          .page-break-after {
            break-after: page !important;
            page-break-after: always !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh] print-modal-content">
        
        {/* Header Controls (Screen only) */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Printable Schedule Studio</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Export master schedules & team highlighted schedule sheets</p>
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Option Selector Bar (Screen only) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPrintMode('master')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                printMode === 'master'
                  ? 'bg-rose-500 text-white font-bold shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Teams Batch Packet ({divisionTeams.length})</span>
            </button>
          </div>

          {/* Team Dropdown Selector (Active when 'team' mode is selected) */}
          {printMode === 'team' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Highlight Team:</span>
              <select
                value={activeTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
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
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex-1">
          <div
            id="printable-schedule-area"
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6"
          >

            {/* MODE 1: MASTER SCHEDULE */}
            {printMode === 'master' && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="border-b-2 border-slate-300 dark:border-slate-700 pb-4 flex items-between justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                      {leagueName}
                    </h1>
                    <h2 className="text-base font-bold text-rose-600 dark:text-rose-400 print:text-slate-800">
                      Official Master Schedule — {currentDivision?.name || 'Main Division'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
                      Total Fixtures: {divisionMatches.length} | Teams: {divisionTeams.length} | Generated by PowerSchedule
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-xl text-xs font-mono font-bold print:border-black print:text-black print:bg-white shadow-sm">
                      MASTER LIST
                    </span>
                  </div>
                </div>

                {/* Matches Grouped by Week */}
                {weeksList.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">No matches scheduled in this division yet.</p>
                ) : (
                  weeksList.map((weekNum) => {
                    const weekMatches = matchesByWeek.get(weekNum) || [];
                    const weekDate = weekMatches[0]?.date || '';

                    return (
                      <div key={weekNum} className="space-y-2 print-week-block print:mb-4">
                        <div className="bg-slate-50 dark:bg-slate-900 print:bg-slate-200 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 print:border-slate-400 flex items-center justify-between shadow-sm">
                          <span className="font-extrabold text-xs text-amber-600 dark:text-amber-400 print:text-slate-900 uppercase tracking-wider">
                            Week {weekNum} • {weekDate}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-700 font-medium">
                            {weekMatches.length} Matches
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 print:border-slate-400 text-slate-500 dark:text-slate-400 print:text-slate-700 uppercase text-[10px] tracking-wider">
                                <th className="py-2 px-2 font-semibold">Time</th>
                                <th className="py-2 px-2 font-semibold">Court / Location</th>
                                <th className="py-2 px-2 font-semibold text-right">Home Team</th>
                                <th className="py-2 px-2 font-semibold text-center">vs</th>
                                <th className="py-2 px-2 font-semibold text-left">Away Team</th>
                                {divisionMatches.some((m) => !!m.workTeamId) && (
                                  <th className="py-2 px-2 font-semibold text-center">Ref Duty</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 print:divide-slate-300">
                              {weekMatches.map((m) => {
                                const homeTeam = teamMap.get(m.homeTeamId)?.name || m.homeTeamId;
                                const awayTeam = teamMap.get(m.awayTeamId)?.name || m.awayTeamId;
                                const refTeam = teamMap.get(m.workTeamId || '')?.name;
                                const locationLabel = getMatchLocationName(m);
                                const showRefCol = divisionMatches.some((matchItem) => !!matchItem.workTeamId);

                                return (
                                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 print:hover:bg-transparent">
                                    <td className="py-2 px-2 font-mono font-bold text-amber-600 dark:text-amber-300 print:text-black">
                                      {formatTime(m.startTime)}
                                    </td>
                                    <td className="py-2 px-2 text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                                      {locationLabel}
                                    </td>
                                    <td className="py-2 px-2 text-right font-bold text-slate-900 dark:text-white print:text-black">
                                      {homeTeam}
                                    </td>
                                    <td className="py-2 px-2 text-center text-slate-400 dark:text-slate-500 font-semibold">vs</td>
                                    <td className="py-2 px-2 text-left font-bold text-slate-900 dark:text-white print:text-black">
                                      {awayTeam}
                                    </td>
                                    {showRefCol && (
                                      <td className="py-2 px-2 text-center text-violet-600 dark:text-violet-400 print:text-slate-800 font-semibold text-[11px]">
                                        {refTeam ? `🏐 ${refTeam}` : '-'}
                                      </td>
                                    )}
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
                  <div key={team.id} className={idx < divisionTeams.length - 1 ? 'page-break-after pb-8 border-b-2 border-dashed border-slate-200 dark:border-slate-800 print:border-slate-400' : ''}>
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
        <div className="mt-auto p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 no-print">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tip: Select &quot;Save as PDF&quot; in your browser print window to create a PDF file.
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-semibold"
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
    </div>,
    document.body
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
    return <div className="text-slate-500 dark:text-slate-400 p-4">Select a team to view schedule.</div>;
  }

  const teamName = (id: string) => teamMap.get(id)?.name || id;

  // Matches involving this team (as Home, Away, or Work Team)
  const teamMatches = matches
    .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId || m.workTeamId === teamId)
    .sort((a, b) => a.weekNumber - b.weekNumber || a.startTime.localeCompare(b.startTime));

  const playing = teamMatches.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId);
  const homeCount = playing.filter((m) => m.homeTeamId === teamId).length;
  const awayCount = playing.length - homeCount;
  const refCount = teamMatches.length - playing.length;

  // Every week the division plays, so weeks without a game for this team show as byes
  const divisionWeekDates = new Map<number, string>();
  matches.forEach((m) => {
    if (!divisionWeekDates.has(m.weekNumber)) divisionWeekDates.set(m.weekNumber, m.date);
  });
  const allWeeks = Array.from(divisionWeekDates.keys()).sort((a, b) => a - b);
  const teamMatchesByWeek = new Map<number, Match[]>();
  teamMatches.forEach((m) => {
    const list = teamMatchesByWeek.get(m.weekNumber) || [];
    list.push(m);
    teamMatchesByWeek.set(m.weekNumber, list);
  });
  const byeCount = allWeeks.filter((w) => !teamMatchesByWeek.has(w)).length;

  const firstDate = divisionWeekDates.get(allWeeks[0]);
  const lastDate = divisionWeekDates.get(allWeeks[allWeeks.length - 1]);
  const showNotes = teamMatches.some((m) => m.notes || m.isExhibition);

  const stats: { label: string; value: number }[] = [
    { label: 'Games', value: playing.length },
    { label: 'Home', value: homeCount },
    { label: 'Away', value: awayCount },
    ...(refCount > 0 ? [{ label: 'Ref Duties', value: refCount }] : []),
    ...(byeCount > 0 ? [{ label: 'Byes', value: byeCount }] : []),
  ];

  const pill = 'inline-block whitespace-nowrap rounded px-1.5 py-px text-[10px] font-extrabold tracking-wider border';

  return (
    <div className="team-print-sheet bg-white dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100 print:text-slate-900">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 pb-3 border-b-[3px] border-slate-900 dark:border-slate-200 print:border-slate-900">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 print:text-slate-600">
            {leagueName} · {currentDivisionName || 'Main Division'}
          </p>
          <h1 className="mt-1 text-3xl font-black leading-tight tracking-tight">{targetTeam.name}</h1>
          <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300 print:text-slate-700">
            Team Schedule
            {firstDate && lastDate && (
              <span className="font-normal"> · {formatShortDate(firstDate)} – {formatShortDate(lastDate)}</span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 divide-x divide-slate-200 dark:divide-slate-700 print:divide-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 print:border-slate-300">
          {stats.map((s) => (
            <div key={s.label} className="px-3 py-1.5 text-center">
              <div className="text-lg font-black leading-none">{s.value}</div>
              <div className="mt-1 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap text-slate-500 dark:text-slate-400 print:text-slate-600">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Table */}
      {teamMatches.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">No scheduled matches found for team {targetTeam.name}.</div>
      ) : (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="mt-3 w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 print:text-slate-600 border-b border-slate-300 dark:border-slate-700 print:border-slate-400">
                <th className="py-1.5 px-2 font-bold w-10">Wk</th>
                <th className="py-1.5 px-2 font-bold">Date</th>
                <th className="py-1.5 px-2 font-bold">Time</th>
                <th className="py-1.5 px-2 font-bold">Opponent</th>
                <th className="py-1.5 px-2 font-bold text-center">Role</th>
                <th className="py-1.5 px-2 font-bold">Court</th>
                {showNotes && <th className="py-1.5 px-2 font-bold">Notes</th>}
              </tr>
            </thead>

            {allWeeks.map((week, weekIdx) => {
              const weekMatches = teamMatchesByWeek.get(week) || [];
              const zebra = weekIdx % 2 === 1 ? 'bg-slate-50 dark:bg-slate-900/50 print:bg-slate-50' : '';
              const weekCells = (rowSpan: number, date: string) => (
                <>
                  <td rowSpan={rowSpan} className="py-2 px-2 align-top leading-5 font-black text-sm tabular-nums">
                    {week}
                  </td>
                  <td rowSpan={rowSpan} className="py-2 px-2 align-top leading-5 whitespace-nowrap font-semibold">
                    {formatShortDate(date)}
                  </td>
                </>
              );

              if (weekMatches.length === 0) {
                return (
                  <tbody key={week} className={`border-b border-slate-200 dark:border-slate-800 print:border-slate-300 ${zebra}`}>
                    <tr className="text-slate-400 dark:text-slate-500 print:text-slate-500">
                      {weekCells(1, divisionWeekDates.get(week) || '')}
                      <td colSpan={showNotes ? 5 : 4} className="py-2 px-2 align-top leading-5 italic">
                        Bye — no game this week
                      </td>
                    </tr>
                  </tbody>
                );
              }

              return (
                <tbody key={week} className={`border-b border-slate-200 dark:border-slate-800 print:border-slate-300 ${zebra}`}>
                  {weekMatches.map((m, i) => {
                    const isHome = m.homeTeamId === teamId;
                    const isRef = !isHome && m.awayTeamId !== teamId;
                    const opponent = isHome ? teamName(m.awayTeamId) : teamName(m.homeTeamId);

                    return (
                      <tr key={m.id} className={isRef ? 'text-slate-600 dark:text-slate-400 print:text-slate-600' : ''}>
                        {i === 0 && weekCells(weekMatches.length, m.date)}
                        <td className="py-2 px-2 align-top leading-5 whitespace-nowrap font-bold tabular-nums">{formatTime(m.startTime)}</td>
                        <td className="py-2 px-2 align-top leading-5">
                          {isRef ? (
                            <span className="italic">
                              {teamName(m.homeTeamId)} vs {teamName(m.awayTeamId)}
                            </span>
                          ) : (
                            <span className="text-[13px] font-bold">
                              <span className="font-medium text-slate-400 dark:text-slate-500 print:text-slate-500 mr-1">
                                {isHome ? 'vs' : '@'}
                              </span>
                              {opponent}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 align-top leading-5 text-center">
                          {isRef ? (
                            <span className={`${pill} bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/40`}>
                              REF
                            </span>
                          ) : isHome ? (
                            <span className={`${pill} bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40`}>
                              HOME
                            </span>
                          ) : (
                            <span className={`${pill} bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/40`}>
                              AWAY
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 align-top leading-5 whitespace-nowrap text-slate-600 dark:text-slate-300 print:text-slate-700">{getMatchLocationName(m)}</td>
                        {showNotes && (
                          <td className="py-2 px-2 align-top leading-5 text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-600">
                            {m.isExhibition && <span className="font-bold text-amber-700 dark:text-amber-400">Exhibition </span>}
                            {m.notes}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-4 text-[9px] text-slate-400 dark:text-slate-500 print:text-slate-500">
        <span>vs = home game · @ = away game</span>
        <span>Generated {new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })} · PowerSchedule</span>
      </div>
    </div>
  );
};
