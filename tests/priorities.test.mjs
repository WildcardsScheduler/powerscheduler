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
    assert.equal(cleaned.find((p) => p.id === 'spacing').mode, 'must', 'the saved setting is kept, not the duplicate');
    assert.equal(cleaned.length, P.DEFAULT_PRIORITIES.length);
    assert.equal(new Set(cleaned.map((p) => p.id)).size, cleaned.length);
  });

  test('a higher-ranked rule always outweighs lower-ranked ones', () => {
    const base = { sameNight: 0, equalGames: 0, weeklyPlay: 0, opponents: 0, spacing: 0, timeSlots: 0, courts: 0, homeAway: 0, refDuty: 0 };
    const betterSpacing = { ...base, spacing: 1, timeSlots: 9 };
    const betterSlots = { ...base, spacing: 2, timeSlots: 0 };
    assert.ok(P.compareSchedules(betterSpacing, betterSlots, ranked('spacing', 'timeSlots')) < 0);
    assert.ok(P.compareSchedules(betterSlots, betterSpacing, ranked('timeSlots', 'spacing')) < 0);
  });

  test('a schedule that meets every must-rule beats one that does not, whatever the ranking', () => {
    const base = { sameNight: 0, equalGames: 0, weeklyPlay: 0, opponents: 0, spacing: 0, timeSlots: 0, courts: 0, homeAway: 0, refDuty: 0 };
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

  test('Balance opponents ranked first spreads official matchups evenly (8 teams, every slot filled)', async () => {
    const opts = { ...baseOptions(8), endDate: '2026-12-15', assignWorkTeams: false, fillAllTimeslots: true };
    const { result, scores } = await P.optimizeSchedule(opts, ranked('opponents'), 300);
    assert.ok(scores.opponents <= 1, 'each team within 1 game across its opponents, got ' + scores.opponents);
    const meetings = new Map();
    result.matches.filter((m) => !m.isExhibition).forEach((m) => {
      const key = [m.homeTeamId, m.awayTeamId].sort().join('|');
      meetings.set(key, (meetings.get(key) || 0) + 1);
    });
    const counts = [...meetings.values()];
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, 'pairs meet ' + Math.min(...counts) + '-' + Math.max(...counts) + ' times');
  });

  test('opponent swaps keep official game counts equal and never double-book', async () => {
    const opts = { ...baseOptions(8), endDate: '2026-12-15', fillAllTimeslots: true };
    const { result } = await P.optimizeSchedule(opts, ranked('opponents'), 30);
    const official = new Map();
    const busy = new Set();
    for (const m of result.matches) {
      if (!m.isExhibition) [m.homeTeamId, m.awayTeamId].forEach((t) => official.set(t, (official.get(t) || 0) + 1));
      for (const t of [m.homeTeamId, m.awayTeamId, m.workTeamId].filter(Boolean)) {
        const key = m.date + '|' + m.startTime + '|' + t;
        assert.ok(!busy.has(key), 'team busy twice: ' + key);
        busy.add(key);
      }
      assert.notEqual(m.homeTeamId, m.awayTeamId);
    }
    assert.equal(new Set(official.values()).size, 1);
  });

  test('a new rule is added to older saved rankings in its default position', () => {
    const saved = [{ id: 'weeklyPlay', mode: 'must' }, { id: 'spacing', mode: 'ranked' }, { id: 'equalGames', mode: 'ranked' }];
    const ids = P.normalizePriorities(saved).map((p) => p.id);
    // New rules slot in next to their neighbours from the default order; saved rules keep their order
    assert.deepEqual(ids.slice(0, 3), ['sameNight', 'weeklyPlay', 'opponents']);
    assert.ok(ids.indexOf('spacing') < ids.indexOf('equalGames'));
  });

  test('no team plays the same opponent twice in one night (on by default as a must-rule)', async () => {
    for (const teamCount of [6, 8, 9]) {
      const opts = { ...baseOptions(teamCount), fillAllTimeslots: true };
      const { result, broken } = await P.optimizeSchedule(opts, P.DEFAULT_PRIORITIES, 40);
      const seen = new Set();
      for (const m of result.matches) {
        const key = m.date + '|' + [m.homeTeamId, m.awayTeamId].sort().join('|');
        assert.ok(!seen.has(key), teamCount + ' teams: same-night rematch ' + key);
        seen.add(key);
      }
      assert.ok(!broken.includes('sameNight'));
    }
  });

  test('turning the same-night rule off lets the engine use those rematches to fill slots', () => {
    const opts = { ...baseOptions(6), fillAllTimeslots: true };
    const withRule = generateVolleyballSchedule(opts).matches.length;
    const withoutRule = generateVolleyballSchedule({ ...opts, noSameNightRematches: false }).matches.length;
    assert.ok(withoutRule >= withRule);
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
