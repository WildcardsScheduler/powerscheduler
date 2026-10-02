'use client';

import React, { useState } from 'react';
import { DayOfWeek, SubLocation } from '@/types/league';
import { courtTimeKey } from '@/utils/schedulerEngine';
import { formatTime } from '@/utils/formatUtils';
import { ChevronDown, ChevronRight, Clock, RotateCcw } from 'lucide-react';

const WEEK_ORDER: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface CourtAvailabilityPanelProps {
  courts: SubLocation[];
  days: DayOfWeek[];
  timeSlots: string[];
  /** Court times switched off, keyed with courtTimeKey(courtId, day, startTime) */
  unavailable: string[];
  onChange: (unavailable: string[]) => void;
}

/**
 * Optional per-court, per-night time slot availability for the schedule generator.
 * Everything is available by default; switch off any court time that can't be used.
 */
export const CourtAvailabilityPanel: React.FC<CourtAvailabilityPanelProps> = ({
  courts,
  days,
  timeSlots,
  unavailable,
  onChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const orderedDays = WEEK_ORDER.filter((d) => days.includes(d));
  const sortedSlots = [...timeSlots].sort();
  const off = new Set(unavailable);

  // Only count switched-off times that still apply to the current courts, nights and slots
  const activeOffCount = courts.reduce(
    (n, c) =>
      n +
      orderedDays.reduce(
        (m, d) => m + sortedSlots.filter((t) => off.has(courtTimeKey(c.id, d, t))).length,
        0
      ),
    0
  );

  const toggle = (key: string) => {
    const next = new Set(off);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(Array.from(next));
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Court availability by night (optional)
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
            activeOffCount > 0
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          {activeOffCount > 0
            ? `${activeOffCount} court ${activeOffCount === 1 ? 'time' : 'times'} unavailable`
            : 'All court times available'}
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click a time to switch it off for that court on that night (for example, Court 2 has no 8:30 slot on
              Tuesdays). The generator will not schedule games there.
            </p>
            {activeOffCount > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>

          {courts.map((court) => (
            <div key={court.id} className="space-y-1.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white">{court.name}</div>
              {orderedDays.map((day) => (
                <div key={day} className="flex flex-wrap items-center gap-1.5">
                  <span className="w-20 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{day}</span>
                  {sortedSlots.map((slot) => {
                    const key = courtTimeKey(court.id, day, slot);
                    const isOff = off.has(key);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggle(key)}
                        title={isOff ? 'Unavailable: click to make available' : 'Available: click to switch off'}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          isOff
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 line-through'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                        }`}
                      >
                        {formatTime(slot)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
