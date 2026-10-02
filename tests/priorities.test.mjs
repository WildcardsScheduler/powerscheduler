import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/loadTs.mjs';

// Runs the real priority optimizer from src/utils
const P = loadTs('src/utils/schedulePriorities.ts');
const { generateVolleyballSchedule } = loadTs('src/utils/schedulerEngine.ts');

const makeTeams = (n) => Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, name: `Team ${i + 1}`, divisionId: 'd1', roster: [] }));
const courts = [
  { id: 'c1', locationId: 'L', name: 'Court 1' },
  { id: 'c2', locationId: 'L', name: 'Court 2' },
];
const baseOptions = (teamCount) => ({
  divisionId: 'd1',
  teams: makeTeams(teamCount),
  courts,
  startDate: '2026-09-08',
  endDate: '2026-11-24',
  matchDurationMinutes: 60,
  weeksCount: 99,
  assignWorkTeams: true,
  daysOfWeek: ['Tuesday'],
  timeSlots: ['18:30', '19:30', '20:30'],
});
const ranked = (...ids) => [...ids.map((id) => ({ id, mode: 'ranked' })), ...P.DEFAULT_PRIORITIES.filter((p) => !ids.includes(p.id))];
const score = (opts, matches) => P.scoreSchedule(matches, opts.teams.map((t) => t.id), opts.timeSlots, ['c1', 'c2']);

describe('Scheduler priorities', () => {
  test('saved priorities are cleaned up: unknown and duplicate rules dropped, missing rules added', () => {
    const cleaned = P.normalizePriorities([
      { id: 'spacing', mode: 'must' },
      { id: 'spacing', mode: 'off' },
      { id: 'madeUp', mode: 'ranked' },
    ]);
    assert.equal(cleaned[0].id, 'spacing');
    assert.equal(cleaned[0].mode, 'must');
    assert.equal(cleaned.length, P.DEFAULT_PRIORITIES.length);
    assert.equal(new Set(cleaned.map((p) => p.id)).size, cleaned.length);
  });

  test('a higher-ranked rule always outweighs lower-ranked ones', () => {
    const base = { equalGames: 0, weeklyPlay: 0, spacing: 0, timeSlots: 0, courts: 0, homeAway: 0, refDuty: 0 };
    const betterSpacing = { ...base, spacing: 1, timeSlots: 9 };
    const betterSlots = { ...base, spacing: 2, timeSlots: 0 };
    assert.ok(P.compareSchedules(betterSpacing, betterSlots, ranked('spacing', 'timeSlots')) < 0);
    assert.ok(P.compareSchedules(betterSlots, betterSpacing, ranked('timeSlots', 'spacing')) < 0);
  });

  test('a schedule that meets every must-rule beats one that does not, whatever the ranking', () => {
    const base = { equalGames: 0, weeklyPlay: 0, spacing: 0, timeSlots: 0, courts: 0, homeAway: 0, refDuty: 0 };
    const priorities = [{ id: 'timeSlots', mode: 'ranked' }, { id: 'homeAway', mode: 'must' }, ...ranked().slice(2)];
    const meetsMust = { ...base, timeSlots: 5, homeAway: 1 };
    const breaksMust = { ...base, timeSlots: 0, homeAway: 3 };
    assert.ok(P.compareSchedules(meetsMust, breaksMust, priorities) < 0);
  });

  test('the optimized schedule is never worse than the classic one on the top-ranked rule', async () => {
    for (const top of ['spacing', 'timeSlots', 'homeAway']) {
      const opts = baseOptions(9);
      const classic = score(opts, generateVolleyballSchedule(opts).matches);
      const best = await P.optimizeSchedule(opts, ranked(top), 60);
      assert.ok(best.scores[top] <= classic[top], `${top}: optimized ${best.scores[top]} vs classic ${classic[top]}`);
    }
  });

  test('ranking a rule first improves it compared with ranking it last', async () => {
    const opts = baseOptions(9);
    const spacingFirst = await P.optimizeSchedule(opts, ranked('spacing', 'timeSlots'), 80);
    const spacingLast = await P.optimizeSchedule(opts, [...ranked('timeSlots').filter((p) => p.id !== 'spacing'), { id: 'spacing', mode: 'ranked' }], 80);
    assert.ok(spacingFirst.scores.spacing <= spacingLast.scores.spacing);
  });

  test('reports must-rules it cannot meet instead of hiding them', async () => {
    // 6 teams filling 6 court-times a night must play the same opponents again within 2 weeks
    const result = await P.optimizeSchedule(baseOptions(6), [{ id: 'spacing', mode: 'must' }, ...ranked().filter((p) => p.id !== 'spacing')], 30);
    assert.deepEqual(result.broken, ['spacing']);
  });

  test('turning a rule off switches that behaviour off in the engine', () => {
    const flags = P.engineFlagsFor([{ id: 'weeklyPlay', mode: 'off' }, ...ranked().filter((p) => p.id !== 'weeklyPlay')]);
    assert.equal(flags.guaranteeWeeklyPlay, false);
    assert.equal(flags.spaceOutOpponents, true);
  });

  test('the same seed always gives the same schedule, and no seed gives the classic schedule', () => {
    const opts = baseOptions(8);
    const a = generateVolleyballSchedule({ ...opts, seed: 7 }).matches;
    const b = generateVolleyballSchedule({ ...opts, seed: 7 }).matches;
    assert.deepEqual(a, b);
    assert.deepEqual(generateVolleyballSchedule(opts).matches, generateVolleyballSchedule(opts).matches);
  });

  test('optimized schedules still never double-book a court or a team', async () => {
    const opts = baseOptions(10);
    const { result } = await P.optimizeSchedule(opts, P.DEFAULT_PRIORITIES, 40);
    const courtsUsed = new Set();
    const teamsBusy = new Set();
    for (const m of result.matches) {
      const court = `${m.date}|${m.startTime}|${m.courtId}`;
      assert.ok(!courtsUsed.has(court), `court double-booked: ${court}`);
      courtsUsed.add(court);
      for (const t of [m.homeTeamId, m.awayTeamId, m.workTeamId].filter(Boolean)) {
        const key = `${m.date}|${m.startTime}|${t}`;
        assert.ok(!teamsBusy.has(key), `team busy twice: ${key}`);
        teamsBusy.add(key);
      }
    }
  });
});
