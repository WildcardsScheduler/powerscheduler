'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Match, Team, Location, Division, SubLocation, SetScore } from '@/types/league';
import { X, Calendar, Clock, MapPin, Building2, ShieldAlert, ArrowLeftRight, Trash2, CheckCircle2, AlertTriangle, Scale, Plus, Check, Sun, Moon } from 'lucide-react';
import { calculateScheduleFairnessReport } from '@/utils/schedulerEngine';
import { formatTime, formatTimeRange } from '@/utils/formatUtils';

const COMMON_TIMES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45',
  '21:00', '21:15', '21:30', '21:45', '22:00', '22:15', '22:30', '23:00'
];

interface MatchEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null; // Null means creating a new manual match
  teams: Team[];
  divisions: Division[];
  locations: Location[];
  allMatches: Match[];
  selectedDivisionId?: string;
  onSaveMatch: (match: Match) => void;
  onDeleteMatch?: (matchId: string) => void;
}

export const MatchEditorModal: React.FC<MatchEditorModalProps> = ({
  isOpen,
  onClose,
  match,
  teams,
  divisions,
  locations,
  allMatches,
  selectedDivisionId,
  onSaveMatch,
  onDeleteMatch,
}) => {
  // Form State
  const [divisionId, setDivisionId] = useState<string>('');
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('18:30');
  const [endTime, setEndTime] = useState<string>('19:30');
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [workTeamId, setWorkTeamId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [subLocationId, setSubLocationId] = useState<string>('');
  const [status, setStatus] = useState<Match['status']>('Scheduled');
  const [isExhibition, setIsExhibition] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Initial population ONLY on open transition or match switch (prevents background sync from wiping state)
  const prevOpenRef = useRef(false);
  const prevMatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    const isOpening = isOpen && !prevOpenRef.current;
    const matchChanged = isOpen && match?.id !== prevMatchIdRef.current;

    prevOpenRef.current = isOpen;
    prevMatchIdRef.current = match?.id || null;

    if (!isOpen) return;
    if (!isOpening && !matchChanged) return;

    if (match) {
      setDivisionId(match.divisionId || selectedDivisionId || divisions[0]?.id || '');
      setWeekNumber(match.weekNumber || 1);
      setDate(match.date || new Date().toISOString().split('T')[0]);
      setStartTime(match.startTime || '18:30');
      setEndTime(match.endTime || '19:30');
      setHomeTeamId(match.homeTeamId || '');
      setAwayTeamId(match.awayTeamId || '');
      setWorkTeamId(match.workTeamId || '');
      setLocationId(match.locationId || locations[0]?.id || '');
      setSubLocationId(match.subLocationId || match.courtId || '');
      setStatus(match.status || 'Scheduled');
      setIsExhibition(match.isExhibition || false);
      setNotes(match.notes || '');
    } else {
      const activeDiv = selectedDivisionId || divisions[0]?.id || '';
      const divTeams = teams.filter((t) => t.divisionId === activeDiv);
      setDivisionId(activeDiv);
      setWeekNumber(1);
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('18:30');
      setEndTime('19:30');
      setHomeTeamId(divTeams[0]?.id || teams[0]?.id || '');
      setAwayTeamId(divTeams[1]?.id || teams[1]?.id || '');
      setWorkTeamId('');
      setLocationId(locations[0]?.id || '');
      setSubLocationId(locations[0]?.subLocations[0]?.id || '1');
      setStatus('Scheduled');
      setIsExhibition(false);
      setNotes('');
    }
  }, [isOpen, match?.id]);

  const currentDivTeams = useMemo(() => {
    if (divisions.length <= 1) return teams;
    const filtered = teams.filter((t) => !divisionId || t.divisionId === divisionId);
    return filtered.length > 0 ? filtered : teams;
  }, [teams, divisions, divisionId]);

  if (!isOpen) return null;

  const selectedLocation = locations.find((l) => l.id === locationId) || locations[0];
  const subLocations = selectedLocation?.subLocations || [];

  // Swap Home & Away Teams helper
  const handleSwapTeams = () => {
    const temp = homeTeamId;
    setHomeTeamId(awayTeamId);
    setAwayTeamId(temp);
  };

  // Auto calculate 1 hour match duration when Start Time is selected
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const parts = newStart.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      if (!isNaN(h)) {
        const endH = (h + 1) % 24;
        const endHStr = endH < 10 ? `0${endH}` : `${endH}`;
        setEndTime(`${endHStr}:${parts[1]}`);
      }
    }
  };

  // Construct draft match object
  const draftMatch: Match = {
    id: match?.id || `match-manual-${Date.now()}`,
    divisionId,
    weekNumber,
    date,
    startTime,
    endTime,
    courtId: subLocationId,
    subLocationId,
    locationId,
    homeTeamId,
    awayTeamId,
    workTeamId: workTeamId || undefined,
    status,
    scores: match?.scores || [],
    winnerId: match?.winnerId,
    isExhibition,
    notes,
  };

  // Calculate live fairness metrics before and after this match edit
  const courtsList: SubLocation[] = locations.flatMap((l) => l.subLocations);

  const beforeMatches = allMatches;
  const afterMatches = match
    ? allMatches.map((m) => (m.id === match.id ? draftMatch : m))
    : [...allMatches, draftMatch];

  const beforeReport = calculateScheduleFairnessReport(currentDivTeams, beforeMatches, courtsList);
  const afterReport = calculateScheduleFairnessReport(currentDivTeams, afterMatches, courtsList);

  const homeTeamBefore = beforeReport.teamMetrics.find((m) => m.teamId === homeTeamId);
  const homeTeamAfter = afterReport.teamMetrics.find((m) => m.teamId === homeTeamId);

  const awayTeamBefore = beforeReport.teamMetrics.find((m) => m.teamId === awayTeamId);
  const awayTeamAfter = afterReport.teamMetrics.find((m) => m.teamId === awayTeamId);

  // Check for same-day conflict / double header alert
  const homeOtherMatchesOnDate = afterMatches.filter(
    (m) => m.date === date && (m.homeTeamId === homeTeamId || m.awayTeamId === homeTeamId)
  );
  const awayOtherMatchesOnDate = afterMatches.filter(
    (m) => m.date === date && (m.homeTeamId === awayTeamId || m.awayTeamId === awayTeamId)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
      alert('Home team and Away team must be different teams.');
      return;
    }
    onSaveMatch(draftMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {match ? 'Edit Match Fixture & Reschedule' : 'Add Manual Match'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modify teams, court assignments, time slots, or match status during the season.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          
          {/* 1. TEAMS SELECTION & SWAP */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Teams Matchup
              </label>
              <button
                type="button"
                onClick={handleSwapTeams}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                title="Swap Home and Away Teams"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>Swap Home / Away</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Home Team */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                  Home Team
                </label>
                <select
                  value={homeTeamId}
                  onChange={(e) => setHomeTeamId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                  required
                >
                  <option value="">Select Home Team</option>
                  {currentDivTeams.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === awayTeamId}>
                      {t.name} {t.id === awayTeamId ? '(Already Away)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Away Team */}
              <div>
                <label className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block mb-1">
                  Away Team
                </label>
                <select
                  value={awayTeamId}
                  onChange={(e) => setAwayTeamId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                  required
                >
                  <option value="">Select Away Team</option>
                  {currentDivTeams.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === homeTeamId}>
                      {t.name} {t.id === homeTeamId ? '(Already Home)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Referee Work Team (Optional) */}
            <div>
              <label className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center space-x-1 mb-1">
                <ShieldAlert className="h-3 w-3" />
                <span>Assigned Referee (Work Team) — Optional</span>
              </label>
              <select
                value={workTeamId}
                onChange={(e) => setWorkTeamId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                <option value="">No Referee Assigned (None)</option>
                {currentDivTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.id === homeTeamId || t.id === awayTeamId ? '(Playing in this match)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. DATE, TIME & COURT ASSIGNMENT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Week Number</label>
              <input
                type="number"
                min={1}
                max={50}
                value={weekNumber}
                onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Match Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Postponed">Postponed</option>
                <option value="Forfeit">Forfeit</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Start Time */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1 mb-1">
                <Clock className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                <span>Start Time (AM / PM)</span>
              </label>
              <select
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
                required
              >
                {!COMMON_TIMES.includes(startTime) && startTime && (
                  <option value={startTime}>{formatTime(startTime)}</option>
                )}
                {COMMON_TIMES.map((t) => (
                  <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">
                    {formatTime(t)}
                  </option>
                ))}
              </select>
            </div>

            {/* End Time */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1 mb-1">
                <Clock className="h-3 w-3 text-rose-500 dark:text-rose-400" />
                <span>End Time (AM / PM)</span>
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
              >
                {!COMMON_TIMES.includes(endTime) && endTime && (
                  <option value={endTime}>{formatTime(endTime)}</option>
                )}
                {COMMON_TIMES.map((t) => (
                  <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">
                    {formatTime(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Location Facility */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1 mb-1">
                <Building2 className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                <span>Facility / Location</span>
              </label>
              <select
                value={locationId}
                onChange={(e) => {
                  const newLocId = e.target.value;
                  setLocationId(newLocId);
                  const loc = locations.find((l) => l.id === newLocId);
                  if (loc && loc.subLocations.length > 0) {
                    setSubLocationId(loc.subLocations[0].id);
                  }
                }}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-Location / Court */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1 mb-1">
                <MapPin className="h-3 w-3 text-rose-500 dark:text-rose-400" />
                <span>Court Assignment</span>
              </label>
              <select
                value={subLocationId}
                onChange={(e) => setSubLocationId(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
              >
                {subLocations.length > 0 ? (
                  subLocations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                ) : (
                  <option value="1">Court 1</option>
                )}
              </select>
            </div>
          </div>

          {/* 3. LIVE FAIRNESS IMPACT PREVIEW */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-amber-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center space-x-1.5">
                <Scale className="h-4 w-4" />
                <span>Live Fairness & Schedule Impact Analysis</span>
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Real-time matrix preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Home Team Impact */}
              {homeTeamAfter && (
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3 rounded-xl space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="truncate">{homeTeamAfter.teamName} (Home)</span>
                    <span>{homeTeamAfter.totalGames} Games</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                    <span>Home/Away Split:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {homeTeamAfter.homeGames}H / {homeTeamAfter.awayGames}A
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                    <span>Double Headers:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {homeTeamAfter.doubleHeaderCount}
                    </strong>
                  </div>
                  {homeOtherMatchesOnDate.length > 1 && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 flex items-center gap-1 font-semibold pt-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Double header on {date} ({homeOtherMatchesOnDate.length} matches)
                    </p>
                  )}
                </div>
              )}

              {/* Away Team Impact */}
              {awayTeamAfter && (
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3 rounded-xl space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between font-bold text-rose-600 dark:text-rose-400">
                    <span className="truncate">{awayTeamAfter.teamName} (Away)</span>
                    <span>{awayTeamAfter.totalGames} Games</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                    <span>Home/Away Split:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {awayTeamAfter.homeGames}H / {awayTeamAfter.awayGames}A
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                    <span>Double Headers:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {awayTeamAfter.doubleHeaderCount}
                    </strong>
                  </div>
                  {awayOtherMatchesOnDate.length > 1 && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 flex items-center gap-1 font-semibold pt-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Double header on {date} ({awayOtherMatchesOnDate.length} matches)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 gap-3">
            {match && onDeleteMatch ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this match fixture?')) {
                    onDeleteMatch(match.id);
                    onClose();
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Match</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center space-x-1.5"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                <span>{match ? 'Save Match Changes' : 'Create Match'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
