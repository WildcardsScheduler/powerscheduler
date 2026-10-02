import { Match } from '@/types/league';
import {
  GeneratedScheduleResult,
  ScheduleGeneratorOptions,
  SchedulerWeights,
  generateVolleyballSchedule,
} from '@/utils/schedulerEngine';

/**
 * Scheduler priorities: the human scheduler ranks the fairness rules from most to least
 * important and marks some as mandatory ("must"). The optimizer generates many variations
 * of the schedule, throws out any that break a must-have rule, and keeps the one that
 * does best on the rules in ranked order.
 */

export type PriorityRuleId = 'weeklyPlay' | 'equalGames' | 'spacing' | 'timeSlots' | 'courts' | 'homeAway' | 'refDuty';
export type PriorityMode = 'must' | 'ranked' | 'off';

/** One rule's setting. The array order of SchedulerPriority[] is the ranking (index 0 = most important). */
export interface SchedulerPriority {
  id: PriorityRuleId;
  mode: PriorityMode;
}

interface PriorityRuleInfo {
  label: string;
  description: string;
  /** What "must" guarantees, shown next to the rule */
  mustMeans: string;
  /** Highest acceptable score when the rule is a must (scores are "lower is better") */
  mustLimit: number;
  /** Plain-language result for a score */
  describe: (score: number) => string;
}

export const PRIORITY_RULES: Record<PriorityRuleId, PriorityRuleInfo> = {
  equalGames: {
    label: 'Equal official games',
    description: 'Every team plays the same number of games that count in the standings.',
    mustMeans: 'All teams have exactly the same number of official games',
    mustLimit: 0,
    describe: (n) => (n === 0 ? 'Every team has the same number of official games' : `Official games differ by up to ${n} between teams`),
  },
  weeklyPlay: {
    label: 'Every team plays every night',
    description: 'No bye or sit-out nights for any team.',
    mustMeans: 'No team ever sits out a league night',
    mustLimit: 0,
    describe: (n) => (n === 0 ? 'No team sits out a night' : `${n} team-night${n === 1 ? '' : 's'} without a game`),
  },
  spacing: {
    label: 'Space out rematches',
    description: 'Avoid playing the same opponent again within 2 weeks.',
    mustMeans: 'No team plays the same opponent twice within 2 weeks',
    mustLimit: 0,
    describe: (n) => (n === 0 ? 'No rematches within 2 weeks' : `${n} rematch${n === 1 ? '' : 'es'} within 2 weeks`),
  },
  timeSlots: {
    label: 'Balance early and late games',
    description: 'Each team gets a fair share of every time slot.',
    mustMeans: "Each team's time-slot counts are within 2 of each other",
    mustLimit: 2,
    describe: (n) => (n <= 1 ? 'Time slots evenly shared' : `A team's time-slot counts differ by up to ${n}`),
  },
  courts: {
    label: 'Balance courts',
    description: 'Each team plays on every court about equally.',
    mustMeans: "Each team's court counts are within 2 of each other",
    mustLimit: 2,
    describe: (n) => (n <= 1 ? 'Courts evenly shared' : `A team's court counts differ by up to ${n}`),
  },
  homeAway: {
    label: 'Balance home and away',
    description: 'Each team is home about as often as away.',
    mustMeans: 'Every team is within 1 of an even home/away split',
    mustLimit: 1,
    describe: (n) => (n <= 1 ? 'Home and away evenly split' : `A team is ${n} games off an even home/away split`),
  },
  refDuty: {
    label: 'Equal referee duty',
    description: 'Referee (work team) duty is shared evenly.',
    mustMeans: 'Referee duty differs by at most 1 between teams',
    mustLimit: 1,
    describe: (n) => (n <= 1 ? 'Referee duty evenly shared' : `Referee duty differs by up to ${n} between teams`),
  },
};

/** Matches today's generator behaviour: every rule on, nothing mandatory. */
export const DEFAULT_PRIORITIES: SchedulerPriority[] = [
  { id: 'equalGames', mode: 'ranked' },
  { id: 'weeklyPlay', mode: 'ranked' },
  { id: 'spacing', mode: 'ranked' },
  { id: 'timeSlots', mode: 'ranked' },
  { id: 'homeAway', mode: 'ranked' },
  { id: 'refDuty', mode: 'ranked' },
  { id: 'courts', mode: 'ranked' },
];

/** Cleans up a saved list: drops unknown rules, removes duplicates and adds any missing rules at the end. */
export function normalizePriorities(saved?: SchedulerPriority[] | null): SchedulerPriority[] {
  const seen = new Set<PriorityRuleId>();
  const result: SchedulerPriority[] = [];
  (saved || []).forEach((p) => {
    if (p && p.id in PRIORITY_RULES && !seen.has(p.id) && ['must', 'ranked', 'off'].includes(p.mode)) {
      seen.add(p.id);
      result.push({ id: p.id, mode: p.mode });
    }
  });
  DEFAULT_PRIORITIES.forEach((p) => {
    if (!seen.has(p.id)) result.push({ ...p });
  });
  return result;
}

/** Engine switches implied by the priorities (a rule set to Off is not applied at all). */
export function engineFlagsFor(priorities: SchedulerPriority[]) {
  const isOn = (id: PriorityRuleId) => priorities.find((p) => p.id === id)?.mode !== 'off';
  return {
    guaranteeWeeklyPlay: isOn('weeklyPlay'),
    ensureEqualGames: isOn('equalGames'),
    spaceOutOpponents: isOn('spacing'),
    fairnessTimeSlots: isOn('timeSlots'),
    fairnessCourts: isOn('courts'),
  };
}

// ---------------------------------------------------------------------------
// Measuring a schedule (every score is "lower is better")
// ---------------------------------------------------------------------------

export type RuleScores = Record<PriorityRuleId, number>;

const spread = (values: number[]) => (values.length ? Math.max(...values) - Math.min(...values) : 0);

export function scoreSchedule(matches: Match[], teamIds: string[], timeSlots: string[], courtIds: string[]): RuleScores {
  const official = new Map<string, number>(teamIds.map((id) => [id, 0]));
  const home = new Map<string, number>(teamIds.map((id) => [id, 0]));
  const away = new Map<string, number>(teamIds.map((id) => [id, 0]));
  const refs = new Map<string, number>(teamIds.map((id) => [id, 0]));
  const slotCounts = new Map<string, Map<string, number>>(teamIds.map((id) => [id, new Map()]));
  const courtCounts = new Map<string, Map<string, number>>(teamIds.map((id) => [id, new Map()]));
  const playedOn = new Map<string, Set<string>>(); // date -> teams playing
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) || 0) + 1);

  matches.forEach((m) => {
    [m.homeTeamId, m.awayTeamId].forEach((t) => {
      if (!official.has(t)) return;
      if (!m.isExhibition) bump(official, t);
      bump(slotCounts.get(t)!, m.startTime);
      bump(courtCounts.get(t)!, m.subLocationId || m.courtId || '');
      if (!playedOn.has(m.date)) playedOn.set(m.date, new Set());
      playedOn.get(m.date)!.add(t);
    });
    if (home.has(m.homeTeamId)) bump(home, m.homeTeamId);
    if (away.has(m.awayTeamId)) bump(away, m.awayTeamId);
    if (m.workTeamId && refs.has(m.workTeamId)) bump(refs, m.workTeamId);
  });

  // Team-nights without a game
  let sitOuts = 0;
  playedOn.forEach((playing) => {
    sitOuts += teamIds.filter((t) => !playing.has(t)).length;
  });

  // Same opponents meeting again within 2 weeks
  let rematches = 0;
  const lastWeek = new Map<string, number>();
  [...matches]
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .forEach((m) => {
      const key = m.homeTeamId < m.awayTeamId ? `${m.homeTeamId}|${m.awayTeamId}` : `${m.awayTeamId}|${m.homeTeamId}`;
      const previous = lastWeek.get(key);
      if (previous !== undefined && m.weekNumber - previous <= 2) rematches++;
      lastWeek.set(key, m.weekNumber);
    });

  const worstSpread = (counts: Map<string, Map<string, number>>, keys: string[]) =>
    keys.length < 2 ? 0 : Math.max(0, ...teamIds.map((t) => spread(keys.map((k) => counts.get(t)!.get(k) || 0))));

  const hasRefs = matches.some((m) => m.workTeamId);

  return {
    equalGames: spread(teamIds.map((t) => official.get(t)!)),
    weeklyPlay: sitOuts,
    spacing: rematches,
    timeSlots: worstSpread(slotCounts, timeSlots),
    courts: worstSpread(courtCounts, courtIds),
    homeAway: Math.max(0, ...teamIds.map((t) => Math.abs(home.get(t)! - away.get(t)!))),
    refDuty: hasRefs ? spread(teamIds.map((t) => refs.get(t)!)) : 0,
  };
}

/** Rules set to "must" that this schedule breaks. */
export function brokenMustRules(scores: RuleScores, priorities: SchedulerPriority[]): PriorityRuleId[] {
  return priorities.filter((p) => p.mode === 'must' && scores[p.id] > PRIORITY_RULES[p.id].mustLimit).map((p) => p.id);
}

/**
 * Negative when schedule A is better than B. Fewer broken must-rules wins; then each active
 * rule is compared in ranked order, so a higher-ranked rule always outweighs lower ones.
 */
export function compareSchedules(a: RuleScores, b: RuleScores, priorities: SchedulerPriority[]): number {
  const excess = (s: RuleScores) =>
    priorities
      .filter((p) => p.mode === 'must')
      .reduce((sum, p) => sum + Math.max(0, s[p.id] - PRIORITY_RULES[p.id].mustLimit), 0);
  const brokenDiff = brokenMustRules(a, priorities).length - brokenMustRules(b, priorities).length;
  if (brokenDiff !== 0) return brokenDiff;
  const excessDiff = excess(a) - excess(b);
  if (excessDiff !== 0) return excessDiff;
  for (const p of priorities) {
    if (p.mode === 'off') continue;
    // A must-rule that is already met doesn't need to be pushed further at the expense of lower rules
    const cap = p.mode === 'must' ? PRIORITY_RULES[p.id].mustLimit : -Infinity;
    const diff = Math.max(a[p.id], cap) - Math.max(b[p.id], cap);
    if (diff !== 0) return diff;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Optimizer
// ---------------------------------------------------------------------------

export interface OptimizedSchedule {
  result: GeneratedScheduleResult;
  scores: RuleScores;
  broken: PriorityRuleId[];
  attempts: number;
}

/** Engine weights for a priority list: higher-ranked balancing rules pull harder. */
function weightsFor(priorities: SchedulerPriority[], jitter: () => number): SchedulerWeights {
  const active = priorities.filter((p) => p.mode !== 'off');
  const strength = (id: PriorityRuleId) => {
    const rank = active.findIndex((p) => p.id === id);
    if (rank === -1) return 0;
    const must = active[rank].mode === 'must' ? 2 : 1;
    return (1 + (active.length - rank) / active.length) * must * (0.75 + jitter() * 0.5);
  };
  return {
    timeSlots: 10 * strength('timeSlots'),
    courts: 5 * strength('courts'),
    rematchSpacing: 4 * strength('spacing'),
  };
}

export const DEFAULT_ATTEMPTS = 300;

/**
 * Tries `attempts` variations of the schedule and returns the best one for these priorities.
 * Runs in small batches so the page stays responsive; onProgress reports attempts done.
 */
export async function optimizeSchedule(
  baseOptions: ScheduleGeneratorOptions,
  priorities: SchedulerPriority[],
  attempts = DEFAULT_ATTEMPTS,
  onProgress?: (done: number, total: number) => void
): Promise<OptimizedSchedule> {
  const options: ScheduleGeneratorOptions = { ...baseOptions, ...engineFlagsFor(priorities) };
  const teamIds = options.teams.map((t) => t.id);
  const courtIds = options.courts.map((c) => c.id);
  const timeSlots = options.timeSlots || [];

  let jitterState = 12345;
  const jitter = () => {
    jitterState = (jitterState * 1103515245 + 12345) % 2147483648;
    return jitterState / 2147483648;
  };

  const evaluate = (result: GeneratedScheduleResult) => scoreSchedule(result.matches, teamIds, timeSlots, courtIds);

  // Attempt 0 is the classic, un-shuffled schedule so the result is never worse than before
  let bestResult = generateVolleyballSchedule(options);
  let bestScores = evaluate(bestResult);

  const BATCH = 25;
  for (let done = 1; done < attempts; ) {
    const end = Math.min(attempts, done + BATCH);
    for (; done < end; done++) {
      const result = generateVolleyballSchedule({ ...options, seed: done, weights: weightsFor(priorities, jitter) });
      const scores = evaluate(result);
      if (compareSchedules(scores, bestScores, priorities) < 0) {
        bestResult = result;
        bestScores = scores;
      }
    }
    onProgress?.(done, attempts);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return { result: bestResult, scores: bestScores, broken: brokenMustRules(bestScores, priorities), attempts };
}
