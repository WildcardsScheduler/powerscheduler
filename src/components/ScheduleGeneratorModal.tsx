'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Division, SubLocation, Location, Team, Match, DayOfWeek } from '@/types/league';
import { generateVolleyballSchedule, ScheduleFairnessReport, TeamFairnessMetric } from '@/utils/schedulerEngine';
import {
  getCanadianHolidaysForDateRange,
  getDayOfWeekName,
  PROVINCE_OPTIONS,
  CanadianProvince,
} from '@/utils/canadianHolidays';
import { formatTime, formatTimeRange } from '@/utils/formatUtils';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  ShieldAlert,
  Check,
  Plus,
  Sliders,
  Scale,
  Ban,
  Flag,
  AlertCircle,
  Building2,
  BarChart3,
  PieChart,
  ListFilter,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Printer,
} from 'lucide-react';
import { PrintScheduleModal } from './PrintScheduleModal';

interface ScheduleGeneratorModalProps {
  divisions: Division[];
  courts: SubLocation[];
  locations?: Location[];
  teams: Team[];
  isOpen: boolean;
  onClose: () => void;
  onApplySchedule: (newMatches: Match[], divisionId: string) => void;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

const ALL_DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const ScheduleGeneratorModal: React.FC<ScheduleGeneratorModalProps> = ({
  divisions,
  courts,
  locations,
  teams,
  isOpen,
  onClose,
  onApplySchedule,
  defaultStartDate = '2026-09-08',
  defaultEndDate = '2026-11-24',
}) => {
  const [selectedDivisionId, setSelectedDivisionId] = useState(divisions[0]?.id || '');
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [matchDuration, setMatchDuration] = useState(60);
  const [assignWorkTeams, setAssignWorkTeams] = useState(false);

  // Courts / Playing Surfaces confirmation state
  const [selectedCourtIds, setSelectedCourtIds] = useState<string[]>(() => courts.map((c) => c.id));

  const activeCourts = useMemo(() => {
    return courts.filter((c) => selectedCourtIds.includes(c.id));
  }, [courts, selectedCourtIds]);

  const toggleCourt = (courtId: string) => {
    if (selectedCourtIds.includes(courtId)) {
      if (selectedCourtIds.length > 1) {
        setSelectedCourtIds(selectedCourtIds.filter((id) => id !== courtId));
      }
    } else {
      setSelectedCourtIds([...selectedCourtIds, courtId]);
    }
    setGeneratedMatches(null);
  };

  // Compute weeksCount automatically from the date range
  const weeksCount = useMemo(() => {
    if (!startDate || !endDate) return 8;
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.round(diffDays / 7));
  }, [startDate, endDate]);

  // Reset state ONLY when reopening the modal or switching division context
  const firstDivisionId = divisions[0]?.id || '';

  useEffect(() => {
    if (isOpen) {
      setSelectedDivisionId(firstDivisionId);
      setSelectedCourtIds((prev) => {
        const valid = prev.filter((id) => courts.some((c) => c.id === id));
        return valid.length > 0 ? valid : courts.map((c) => c.id);
      });
      setStartDate(defaultStartDate);
      setEndDate(defaultEndDate);
      setGeneratedMatches(null);
      setGeneratedReport(null);
      setWarnings([]);
      setViewMode('config');
    }
  }, [isOpen, firstDivisionId]);

  // Days of Week Selection
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(['Tuesday']);

  // Custom Time Slots
  const [timeSlots, setTimeSlots] = useState<string[]>(['18:30', '19:30', '20:30']);
  const [newTimeSlot, setNewTimeSlot] = useState('');

  // Selected Province for Canadian Holidays
  const [selectedProvince, setSelectedProvince] = useState<CanadianProvince>('ALL');

  // Compute suggested Canadian Holidays during this season
  const suggestedHolidays = useMemo(() => {
    if (!startDate || !endDate) return [];
    return getCanadianHolidaysForDateRange(startDate, endDate, selectedProvince);
  }, [startDate, endDate, selectedProvince]);

  // Blackout Dates State initialized with Canadian holidays in the league's season window
  const [blackoutDates, setBlackoutDates] = useState<string[]>(() => {
    const initialHolidays = getCanadianHolidaysForDateRange(defaultStartDate, defaultEndDate, 'ALL');
    return initialHolidays.map((h) => h.date);
  });
  const [newBlackoutDate, setNewBlackoutDate] = useState('');

  // Advanced Rules & Priorities
  const [fillAllTimeslots, setFillAllTimeslots] = useState(true); // Default ON to maximize slot utilization
  const [enableDoubleHeaders, setEnableDoubleHeaders] = useState(false);
  const [doubleHeaderMode, setDoubleHeaderMode] = useState<'back_to_back' | 'spaced'>('back_to_back');
  const [markDoubleHeadersAsExhibition, setMarkDoubleHeadersAsExhibition] = useState(true); // Default ON: Extra double headers marked as Exhibition
  const [spaceOutOpponents, setSpaceOutOpponents] = useState(true);
  const [ensureEqualGames, setEnsureEqualGames] = useState(true);
  const [fairnessTimeSlots, setFairnessTimeSlots] = useState(true);
  const [fairnessCourts, setFairnessCourts] = useState(true);

  // Generated State & View Navigation
  const [generatedMatches, setGeneratedMatches] = useState<Match[] | null>(null);
  const [generatedReport, setGeneratedReport] = useState<ScheduleFairnessReport | null>(null);
  const [viewMode, setViewMode] = useState<'config' | 'report' | 'fixtures'>('config');
  const [previewWeek, setPreviewWeek] = useState<number>(1);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const divisionTeams = teams.filter((t) => t.divisionId === selectedDivisionId);

  const toggleDayOfWeek = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddTimeSlot = () => {
    if (newTimeSlot && !timeSlots.includes(newTimeSlot)) {
      setTimeSlots([...timeSlots, newTimeSlot].sort());
      setNewTimeSlot('');
    }
  };

  const handleRemoveTimeSlot = (slot: string) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((s) => s !== slot));
    }
  };

  const handleAddBlackoutDate = () => {
    if (newBlackoutDate && !blackoutDates.includes(newBlackoutDate)) {
      setBlackoutDates([...blackoutDates, newBlackoutDate].sort());
      setNewBlackoutDate('');
    }
  };

  const handleRemoveBlackoutDate = (date: string) => {
    setBlackoutDates(blackoutDates.filter((d) => d !== date));
  };

  const toggleHolidayBlackout = (holidayDate: string) => {
    if (blackoutDates.includes(holidayDate)) {
      setBlackoutDates(blackoutDates.filter((d) => d !== holidayDate));
    } else {
      setBlackoutDates([...blackoutDates, holidayDate].sort());
    }
  };

  const handleAddAllCanadianHolidays = () => {
    const holidayDates = suggestedHolidays.map((h) => h.date);
    const combined = Array.from(new Set([...blackoutDates, ...holidayDates])).sort();
    setBlackoutDates(combined);
  };

  const handleClearAllBlackouts = () => {
    setBlackoutDates([]);
  };

  const handleGeneratePreview = () => {
    if (activeCourts.length === 0) {
      setWarnings(['At least 1 court / playing surface must be selected to generate a schedule.']);
      setGeneratedMatches(null);
      setGeneratedReport(null);
      return;
    }

    const res = generateVolleyballSchedule({
      divisionId: selectedDivisionId,
      teams: divisionTeams,
      courts: activeCourts,
      startDate,
      matchDurationMinutes: Number(matchDuration),
      weeksCount: weeksCount,
      assignWorkTeams,
      daysOfWeek: selectedDays,
      timeSlots,
      blackoutDates,
      enableDoubleHeaders,
      doubleHeaderMode,
      fillAllTimeslots,
      markDoubleHeadersAsExhibition,
      spaceOutOpponents,
      ensureEqualGames,
      fairnessTimeSlots,
      fairnessCourts,
    });

    setGeneratedMatches(res.matches);
    setGeneratedReport(res.report);
    setWarnings(res.warnings);
    setViewMode('report');
  };

  const handleConfirmAndApply = () => {
    if (generatedMatches) {
      onApplySchedule(generatedMatches, selectedDivisionId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header with Navigation Tabs */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Advanced Auto-Schedule Generator</span>
              </h3>
              <p className="text-xs text-slate-400">Rule Priorities, Capacity Optimization & Fairness Report Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Tabs (Shown after generating schedule) */}
            {generatedMatches && (
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 space-x-1">
                <button
                  type="button"
                  onClick={() => setViewMode('config')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'config'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('report')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'report'
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Fairness Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('fixtures')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'fixtures'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Fixtures ({generatedMatches.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Studio</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          
          {/* VIEW MODE 1: CONFIGURATION & RULE PRIORITIES */}
          {viewMode === 'config' && (
            <>
              {/* Target Division & Season Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Target Division</label>
                  <select
                    value={selectedDivisionId}
                    onChange={(e) => {
                      setSelectedDivisionId(e.target.value);
                      setGeneratedMatches(null);
                      setGeneratedReport(null);
                      setWarnings([]);
                      setViewMode('config');
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({teams.filter((t) => t.divisionId === d.id).length} Teams)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Season Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setGeneratedMatches(null);
                      setGeneratedReport(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Season End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setGeneratedMatches(null);
                      setGeneratedReport(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold px-1.5 py-0.5 rounded">{weeksCount} weeks</span>
                    <span>calculated from date range</span>
                  </p>
                </div>
              </div>

              {/* Days of Week Selection */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-amber-400" /> Match Night Days of the Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDayOfWeek(day)}
                        className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots & Duration */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-violet-400" /> Time Slots & Slot Duration
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400">Slot Duration:</span>
                    <select
                      value={matchDuration}
                      onChange={(e) => setMatchDuration(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1 text-xs"
                    >
                      <option value={50}>50 min</option>
                      <option value={60}>60 min</option>
                      <option value={75}>75 min</option>
                    </select>
                  </div>
                </div>

                {/* Time Slot Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot}
                      className="bg-slate-900 text-white border border-slate-800 px-2.5 py-1 rounded-xl font-mono text-xs flex items-center space-x-1.5"
                    >
                      <span>{formatTime(slot)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(slot)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center space-x-1">
                    <input
                      type="time"
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddTimeSlot}
                      className="p-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Courts & Playing Surfaces Confirmation */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <label className="text-slate-100 font-extrabold text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-400" />
                      <span>Available Courts & Playing Surfaces</span>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {selectedCourtIds.length} of {courts.length} Active
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Confirm which courts to utilize for match fixture generation
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourtIds(courts.map((c) => c.id));
                        setGeneratedMatches(null);
                        setGeneratedReport(null);
                      }}
                      className="text-[11px] font-semibold text-emerald-400 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (courts.length > 0) {
                          setSelectedCourtIds([courts[0].id]);
                          setGeneratedMatches(null);
                          setGeneratedReport(null);
                        }
                      }}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-300 hover:underline"
                    >
                      Clear (Keep 1)
                    </button>
                  </div>
                </div>

                {courts.length === 0 ? (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-amber-400 flex items-center justify-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>No courts defined in facility location settings! Please add courts in Location Manager.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {courts.map((court) => {
                      const isSelected = selectedCourtIds.includes(court.id);
                      const parentLoc = locations?.find(
                        (l) => l.id === court.locationId || l.subLocations.some((s) => s.id === court.id)
                      );
                      return (
                        <button
                          type="button"
                          key={court.id}
                          onClick={() => toggleCourt(court.id)}
                          className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                            isSelected
                              ? 'bg-emerald-950/30 border-emerald-500/50 text-white shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs text-white">{court.name}</span>
                              {court.surface && (
                                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                                  {court.surface}
                                </span>
                              )}
                            </div>
                            {parentLoc && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <span>📍 {parentLoc.name}</span>
                              </p>
                            )}
                          </div>

                          <div
                            className={`h-4 w-4 rounded flex items-center justify-center border mt-0.5 transition-colors ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                : 'border-slate-700 bg-slate-900'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Canadian Holidays & Blackout Dates Suggestion Engine */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-rose-500/30 space-y-4 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <label className="text-slate-100 font-extrabold text-sm flex items-center gap-2">
                      <Flag className="h-4 w-4 text-rose-500 fill-rose-500/20" />
                      <span>Canadian Holiday Blackout Suggestions</span>
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        🍁 {suggestedHolidays.length} Detected in Season
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Season window: <span className="font-semibold text-slate-300">{startDate}</span> to{' '}
                      <span className="font-semibold text-slate-300">{endDate}</span>
                    </p>
                  </div>

                  {/* Province Selector Dropdown */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">Region:</span>
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value as CanadianProvince)}
                      className="bg-slate-900 border border-slate-800 text-white rounded-xl px-2.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-rose-500"
                    >
                      {PROVINCE_OPTIONS.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Suggested Canadian Holidays List */}
                {suggestedHolidays.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Detected Holidays in Season Window:
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleAddAllCanadianHolidays}
                          className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Select All Canadian Holidays
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {suggestedHolidays.map((holiday) => {
                        const isBlackedOut = blackoutDates.includes(holiday.date);
                        const dayName = getDayOfWeekName(holiday.date);
                        const isMatchNight = selectedDays.includes(dayName as DayOfWeek);

                        return (
                          <div
                            key={holiday.date}
                            onClick={() => toggleHolidayBlackout(holiday.date)}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between space-x-2 ${
                              isBlackedOut
                                ? 'bg-rose-500/10 border-rose-500/50 text-white shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-xs truncate">{holiday.name}</span>
                              </div>

                              <div className="flex items-center space-x-2 text-[11px]">
                                <span className="font-mono text-rose-300">{holiday.date}</span>
                                <span className="text-slate-400">({dayName})</span>
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                  {holiday.provinces}
                                </span>
                              </div>

                              {isMatchNight && (
                                <div className="flex items-center space-x-1 text-[10px] text-amber-400 font-bold pt-0.5">
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                  <span>Direct Match Night Impact ({dayName})</span>
                                </div>
                              )}
                            </div>

                            <div className="shrink-0 pt-0.5">
                              {isBlackedOut ? (
                                <span className="flex items-center space-x-1 text-[10px] font-extrabold bg-rose-500 text-slate-950 px-2 py-0.5 rounded-md">
                                  <Check className="h-3 w-3" /> Skipped
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md hover:text-white">
                                  + Skip Date
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                    No statutory Canadian holidays detected during this season window ({startDate} to {endDate}).
                  </div>
                )}

                {/* Active Blackout Dates Chips & Manual Add */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Ban className="h-3.5 w-3.5 text-rose-400" /> Active Blackout Dates List ({blackoutDates.length})
                    </span>
                    {blackoutDates.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllBlackouts}
                        className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {blackoutDates.map((date) => (
                      <div
                        key={date}
                        className="bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm"
                      >
                        <span className="font-mono">{date}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlackoutDate(date)}
                          className="text-rose-400 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center space-x-1">
                      <input
                        type="date"
                        value={newBlackoutDate}
                        onChange={(e) => setNewBlackoutDate(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddBlackoutDate}
                        className="p-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs"
                        title="Add Custom Blackout Date"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scheduling Rule Priorities & Capacity Options Card */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-extrabold text-amber-400 text-sm flex items-center gap-2">
                    <Sliders className="h-4 w-4" />
                    <span>Scheduling Rule Priorities & Capacity Options</span>
                  </h4>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    Customizable Optimization Matrix
                  </span>
                </div>

                {/* 1. CAPACITY BOOSTER: FILL ALL TIMESLOTS */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                        <span>Fill All Timeslots (100% Facility Utilization)</span>
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded">
                          HIGH PRIORITY
                        </span>
                      </span>
                      <p className="text-[11px] text-slate-300">
                        Schedules extra double-header matches whenever spare court time slots exist in a match night.
                        Perfect for 8 teams playing in facilities with 6 or 8 available court slots per night!
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={fillAllTimeslots}
                      onChange={(e) => setFillAllTimeslots(e.target.checked)}
                      className="h-5 w-5 rounded accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* END-OF-SEASON EXHIBITION MATCHES TOGGLE */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span>Flag End-of-Season Extra Matches as Exhibition</span>
                      <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        PRE-PLAYOFFS WARMUP
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Regular double headers count as Official Standings Matches until all teams reach equal league matches (e.g., 14 games = 2 round-robins). Extra matches at the end of the season before playoffs are flagged as Exhibition.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={markDoubleHeadersAsExhibition}
                    onChange={(e) => setMarkDoubleHeadersAsExhibition(e.target.checked)}
                    className="h-5 w-5 rounded accent-purple-500 cursor-pointer"
                  />
                </div>

                {/* 2. DOUBLE HEADER PREFERENCES */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">Allow Double-Header Matches</span>
                      <span className="text-[11px] text-slate-400">Permit teams to play 2 fixtures on the same night</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableDoubleHeaders}
                      onChange={(e) => setEnableDoubleHeaders(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-500"
                    />
                  </div>

                  {enableDoubleHeaders && (
                    <div className="flex items-center space-x-4 pl-3 pt-1 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400">Spacing Preference:</span>
                      <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="dhMode"
                          value="back_to_back"
                          checked={doubleHeaderMode === 'back_to_back'}
                          onChange={() => setDoubleHeaderMode('back_to_back')}
                          className="accent-emerald-500"
                        />
                        <span>Back-to-Back Slots</span>
                      </label>
                      <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="dhMode"
                          value="spaced"
                          checked={doubleHeaderMode === 'spaced'}
                          onChange={() => setDoubleHeaderMode('spaced')}
                          className="accent-emerald-500"
                        />
                        <span>Spaced Out Across Night</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 3. OPPONENT REMATCH SPACING */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div>
                    <span className="font-bold text-white block text-xs">Opponent Rotation Spacing</span>
                    <span className="text-[11px] text-slate-400">Prevent teams from facing the same opponent in consecutive weeks</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={spaceOutOpponents}
                    onChange={(e) => setSpaceOutOpponents(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                </div>

                {/* 4. EQUALIZE OFFICIAL GAMES */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div>
                    <span className="font-bold text-white block text-xs">Equalize Official Games Count</span>
                    <span className="text-[11px] text-slate-400">Ensure all teams have identical official games (flag extra double-headers as Exhibition)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={ensureEqualGames}
                    onChange={(e) => setEnsureEqualGames(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                </div>

                {/* 5. REF / WORK TEAM DUTY */}
                <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  assignWorkTeams ? 'bg-violet-500/10 border-violet-500/30' : 'bg-slate-900/80 border-slate-800'
                }`}>
                  <div>
                    <span className="font-bold text-white block text-xs flex items-center gap-1.5">
                      <span>Ref / Work Team Duty Assignment</span>
                      {!assignWorkTeams && (
                        <span className="bg-slate-800 text-slate-400 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-700">
                          Self-Reffed
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {assignWorkTeams
                        ? 'Automatically rotate non-playing teams to referee matches'
                        : 'Current mode: Self-Reffed (No work teams assigned)'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={assignWorkTeams}
                    onChange={(e) => setAssignWorkTeams(e.target.checked)}
                    className="h-4 w-4 rounded accent-violet-500 cursor-pointer"
                  />
                </div>

                {/* 6. FAIRNESS MATRIX TOGGLES */}
                <div className="space-y-2 pt-1">
                  <span className="font-bold text-amber-400 text-xs block flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5" /> Additional Fairness Balancing Toggles
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center space-x-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fairnessTimeSlots}
                        onChange={(e) => setFairnessTimeSlots(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>Equal Early / Late Time Slots</span>
                    </label>

                    <label className="flex items-center space-x-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fairnessCourts}
                        onChange={(e) => setFairnessCourts(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>Equal Court 1/2 Distribution</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Action Button to Generate Preview */}
              <div>
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 via-amber-500 to-violet-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 tracking-wide"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Schedule & View Fairness Report</span>
                </button>
              </div>

              {/* Warnings Display */}
              {warnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-xs">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Scheduling Generator Notices</span>
                  </div>
                  <ul className="list-disc list-inside text-amber-300/80 text-[11px] space-y-0.5">
                    {warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* VIEW MODE 2: PRE-CONFIRMATION FAIRNESS REPORT */}
          {viewMode === 'report' && generatedReport && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Header Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Fixtures</span>
                  <span className="text-xl font-black text-white">{generatedReport.totalMatches}</span>
                  <span className="text-[10px] text-slate-400 block">Across {weeksCount} Weeks</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 space-y-1">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Slot Utilization</span>
                  <span className="text-xl font-black text-amber-400">{generatedReport.slotUtilizationPercentage}%</span>
                  <span className="text-[10px] text-slate-400 block">
                    {generatedReport.totalSlotsFilled} / {generatedReport.totalSlotsAvailable} Slots Filled
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-purple-500/30 space-y-1">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">Game Classification</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xl font-black text-emerald-400">{generatedReport.officialMatchesCount ?? generatedReport.totalMatches}</span>
                    <span className="text-xs text-slate-400 font-bold">Official</span>
                    <span className="text-xs text-slate-500">/</span>
                    <span className="text-base font-black text-purple-400">{generatedReport.exhibitionMatchesCount}</span>
                    <span className="text-xs text-slate-400">Exhibition</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Standings vs Capacity Fillers</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ref Duty Duties</span>
                  <span className="text-xl font-black text-violet-400">
                    {assignWorkTeams ? generatedMatches?.filter((m) => m.workTeamId).length || 0 : '0'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {assignWorkTeams ? 'Assigned Work Teams' : 'Self-Reffed League'}
                  </span>
                </div>
              </div>

              {/* Slot Capacity Utilization Progress Bar */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-400" /> Facility Court-Slot Utilization Capacity
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {generatedReport.slotUtilizationPercentage}% Filled
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, generatedReport.slotUtilizationPercentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Total Available Slot Opportunities: {generatedReport.totalSlotsAvailable}</span>
                  <span>Used Slots: {generatedReport.totalSlotsFilled}</span>
                </div>
              </div>

              {/* Team Time Slot & Court Fairness Matrix Table */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <Scale className="h-4 w-4 text-rose-500" />
                    <span>Time Slot & Court Fairness Distribution Matrix</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {divisionTeams.length} Teams • Per-Time-Slot Fairness Breakdown
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="py-2 px-3 font-semibold">Team Name</th>
                        <th className="py-2 px-3 font-semibold text-center text-emerald-400">Official Games</th>
                        <th className="py-2 px-3 font-semibold text-center text-purple-400">Exhibition</th>
                        <th className="py-2 px-3 font-semibold text-center">Double Headers</th>
                        {/* Dynamic Time Slot Columns */}
                        {generatedReport.effectiveTimeSlots.map((slot) => (
                          <th key={slot} className="py-2 px-3 font-semibold text-center text-amber-400">
                            {formatTime(slot)}
                          </th>
                        ))}
                        <th className="py-2 px-3 font-semibold text-center">Court Distribution</th>
                        {assignWorkTeams && <th className="py-2 px-3 font-semibold text-center">Ref Duties</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {generatedReport.teamMetrics.map((tm) => (
                        <tr key={tm.teamId} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                            <span>{tm.teamName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-extrabold text-emerald-400">
                            {tm.officialGames ?? tm.totalGames}
                          </td>
                          <td className="py-2.5 px-3 text-center font-extrabold text-purple-400">
                            {tm.exhibitionGames ?? 0}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {tm.doubleHeaderCount > 0 ? (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                {tm.doubleHeaderCount} DH (Back-to-Back)
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">-</span>
                            )}
                          </td>
                          {/* Exact per-timeslot counts */}
                          {generatedReport.effectiveTimeSlots.map((slot) => (
                            <td key={slot} className="py-2.5 px-3 text-center font-mono font-bold text-slate-200">
                              {tm.timeSlotCounts?.[slot] ?? 0}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-center text-[11px]">
                            {Object.entries(tm.courtCounts).map(([cId, count]) => {
                              const cName = courts.find((c) => c.id === cId)?.name || 'Court';
                              return (
                                <span
                                  key={cId}
                                  className="inline-block bg-slate-900 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px] mr-1"
                                >
                                  {cName}: {count}
                                </span>
                              );
                            })}
                          </td>
                          {assignWorkTeams && (
                            <td className="py-2.5 px-3 text-center font-bold text-violet-400">
                              {tm.refDutyCount}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Head-to-Head Opponent Spacing & Matchup Matrix */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                    <span>Head-to-Head Opponent Matchup Matrix</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Exact Matchup Frequencies Per Opponent Pair
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="py-2 px-3 text-left font-semibold">Team</th>
                        {divisionTeams.map((t) => (
                          <th key={t.id} className="py-2 px-2 font-semibold text-slate-300 min-w-[70px]">
                            {t.name.length > 10 ? `${t.name.slice(0, 9)}…` : t.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {divisionTeams.map((teamA) => (
                        <tr key={teamA.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-2.5 px-3 text-left font-bold text-white whitespace-nowrap">
                            {teamA.name}
                          </td>
                          {divisionTeams.map((teamB) => {
                            if (teamA.id === teamB.id) {
                              return (
                                <td key={teamB.id} className="py-2.5 px-2 text-slate-700 bg-slate-900/40">
                                  -
                                </td>
                              );
                            }
                            const count = generatedReport.opponentMatrix[teamA.id]?.[teamB.id] ?? 0;
                            return (
                              <td
                                key={teamB.id}
                                className={`py-2.5 px-2 font-mono font-bold ${
                                  count > 0 ? 'text-amber-400' : 'text-slate-600'
                                }`}
                              >
                                {count > 0 ? `${count}x` : '0'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Priority Rules Compliance Checklist */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Rule Priorities Compliance Audit</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${fillAllTimeslots ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <div>
                      <span className="font-bold text-white block">Fill All Timeslots</span>
                      <span className="text-[11px] text-slate-400">
                        {fillAllTimeslots ? 'ACTIVE — Extra double header matches scheduled' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${spaceOutOpponents ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <div>
                      <span className="font-bold text-white block">Opponent Rematch Spacing</span>
                      <span className="text-[11px] text-slate-400">
                        {spaceOutOpponents ? 'ACTIVE — Rematches spaced out across season' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${fairnessTimeSlots ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <div>
                      <span className="font-bold text-white block">Early vs Late Time Slot Balance</span>
                      <span className="text-[11px] text-slate-400">
                        {fairnessTimeSlots ? 'ACTIVE — Fairness matrix applied' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${assignWorkTeams ? 'text-violet-400' : 'text-amber-400'}`} />
                    <div>
                      <span className="font-bold text-white block">Ref / Work Duty Mode</span>
                      <span className="text-[11px] text-slate-400">
                        {assignWorkTeams ? 'Work Teams Assigned' : 'Self-Reffed League'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* VIEW MODE 3: MATCH FIXTURES PREVIEW */}
          {viewMode === 'fixtures' && generatedMatches && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Week Selector Tabs */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                {Array.from({ length: weeksCount }, (_, i) => i + 1).map((wk) => (
                  <button
                    key={wk}
                    type="button"
                    onClick={() => setPreviewWeek(wk)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                      previewWeek === wk
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Week {wk}
                  </button>
                ))}
              </div>

              {/* Week Matches Table */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white text-xs">
                    Week {previewWeek} Generated Matches
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {generatedMatches.filter((m) => m.weekNumber === previewWeek).length} Matches
                  </span>
                </div>

                <div className="space-y-2">
                  {generatedMatches
                    .filter((m) => m.weekNumber === previewWeek)
                    .map((m) => {
                      const hTeam = teams.find((t) => t.id === m.homeTeamId)?.name || m.homeTeamId;
                      const aTeam = teams.find((t) => t.id === m.awayTeamId)?.name || m.awayTeamId;
                      const wTeam = teams.find((t) => t.id === m.workTeamId)?.name;
                      const courtName = courts.find((c) => c.id === m.courtId)?.name || 'Court';

                      return (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-amber-400 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              {formatTimeRange(m.startTime, m.endTime)}
                            </span>
                            <span className="text-slate-400 font-medium">📍 {courtName}</span>
                          </div>

                          <div className="font-bold text-white text-sm flex items-center space-x-2">
                            <span className="text-rose-300">{hTeam}</span>
                            <span className="text-slate-500 font-normal">vs</span>
                            <span className="text-amber-300">{aTeam}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {wTeam && (
                              <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                🏐 Ref: {wTeam}
                              </span>
                            )}
                            {m.notes?.includes('Double Header') && (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                Double Header
                              </span>
                            )}
                            {m.isExhibition && (
                              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                Exhibition
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div>
            {generatedMatches && viewMode !== 'config' && (
              <button
                type="button"
                onClick={() => setViewMode('config')}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1"
              >
                ← Adjust Rules & Settings
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>

            {generatedMatches && (
              <button
                onClick={handleConfirmAndApply}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg flex items-center space-x-1.5 transition-all tracking-wider"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Confirm & Apply Schedule to League</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Print Studio Modal */}
      <PrintScheduleModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        matches={generatedMatches || []}
        teams={teams}
        locations={locations || []}
        divisions={divisions}
        selectedDivisionId={selectedDivisionId}
      />
    </div>
  );
};
