'use client';

import React from 'react';
import { ArrowDown, ArrowUp, ListOrdered, Lock, RotateCcw } from 'lucide-react';
import {
  DEFAULT_PRIORITIES,
  PRIORITY_RULES,
  PriorityMode,
  RuleScores,
  SchedulerPriority,
} from '@/utils/schedulePriorities';

interface PriorityRankingPanelProps {
  priorities: SchedulerPriority[];
  onChange: (priorities: SchedulerPriority[]) => void;
  /** Rule ids that don't apply right now (e.g. referee duty in a self-reffed league), shown greyed out */
  notApplicable?: Partial<Record<string, string>>;
  /** Scores from the last generated schedule, shown under each rule */
  lastScores?: RuleScores | null;
}

const MODES: { mode: PriorityMode; label: string }[] = [
  { mode: 'must', label: 'Must' },
  { mode: 'ranked', label: 'Ranked' },
  { mode: 'off', label: 'Off' },
];

/**
 * Lets the scheduler rank the fairness rules from most to least important and mark
 * rules as mandatory. The list order is the ranking.
 */
export const PriorityRankingPanel: React.FC<PriorityRankingPanelProps> = ({
  priorities,
  onChange,
  notApplicable = {},
  lastScores,
}) => {
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= priorities.length) return;
    const next = [...priorities];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const setMode = (index: number, mode: PriorityMode) => {
    onChange(priorities.map((p, i) => (i === index ? { ...p, mode } : p)));
  };

  const isDefault = JSON.stringify(priorities) === JSON.stringify(DEFAULT_PRIORITIES);
  let rank = 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
            <ListOrdered className="h-4 w-4" />
            <span>Scheduling Priorities</span>
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Put the most important rule at the top. <strong>Must</strong> rules are never traded away; the rest are
            balanced in the order shown. Saved for this league.
          </p>
        </div>
        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_PRIORITIES.map((p) => ({ ...p })))}
            className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      <ol className="space-y-2">
        {priorities.map((p, index) => {
          const info = PRIORITY_RULES[p.id];
          const naReason = notApplicable[p.id];
          const isOff = p.mode === 'off' || Boolean(naReason);
          if (!isOff) rank++;
          const score = lastScores?.[p.id];
          const failsMust = p.mode === 'must' && !naReason && score !== undefined && score > info.mustLimit;

          return (
            <li
              key={p.id}
              className={`rounded-xl border p-3 space-y-2 transition-colors ${
                p.mode === 'must' && !naReason
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400/60 dark:border-emerald-500/40'
                  : isOff
                    ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`h-6 w-6 shrink-0 rounded-full text-[11px] font-black flex items-center justify-center ${
                    isOff
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      : p.mode === 'must'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900'
                  }`}
                  aria-label={isOff ? 'Not ranked' : `Priority ${rank}${p.mode === 'must' ? ' (must)' : ''}`}
                >
                  {isOff ? '–' : rank}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {info.label}
                    {p.mode === 'must' && !naReason && <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden />}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {naReason || (p.mode === 'must' ? `Must: ${info.mustMeans.toLowerCase()}` : info.description)}
                  </div>
                  {score !== undefined && !isOff && (
                    <div
                      className={`mt-1 text-[11px] font-semibold ${
                        failsMust ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Last schedule: {info.describe(score)}
                      {failsMust && ' (must not met)'}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${info.label} up`}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === priorities.length - 1}
                    aria-label={`Move ${info.label} down`}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {!naReason && (
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  {MODES.map(({ mode, label }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setMode(index, mode)}
                      aria-pressed={p.mode === mode}
                      className={`py-1.5 rounded-md text-[11px] font-bold transition-colors ${
                        p.mode === mode
                          ? mode === 'must'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : mode === 'ranked'
                              ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 shadow-sm'
                              : 'bg-slate-400 dark:bg-slate-700 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
