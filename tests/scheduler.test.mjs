import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/loadTs.mjs';

// Runs the real scheduling code from src/utils
const { generateVolleyballSchedule, buildWeekNumbers, slotKey, courtTimeKey } = loadTs('src/utils/schedulerEngine.ts');
const { timeRangesOverlap } = loadTs('src/utils/formatUtils.ts');

const makeTeams = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, name: `Team ${i + 1}`, divisionId: 'd1', roster: [] }));
const courts = [
  { id: 'c1', locationId: 'L', name: 'Court 1' },
  { id: 'c2', locationId: 'L', name: 'Court 2' },
];

function generate(overrides = {}) {
  return generateVolleyballSchedule({
    divisionId: 'd1',
    teams: makeTeams(9),
    courts,
    startDate: '2026-09-08',
    endDate: '2026-11-24',
    matchDurationMinutes: 60,
    weeksCount: 99,
    assignWorkTeams: true,
    daysOfWeek: ['Tuesday'],
    timeSlots: ['18:30', '19:30', '20:30'],
    blackoutDates: ['2026-10-13'],
    ...overrides,
  });
}

/** Number of times a pair meets again within `window` weeks of their previous meeting. */
function quickRematches(matches, window) {
  const lastWeek = new Map();
  let count = 0;
  [...matches]
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .forEach((m) => {
      const key = [m.homeTeamId, m.awayTeamId].sort().join('|');
      if (lastWeek.has(key) && m.weekNumber - lastWeek.get(key) <= window) count++;
      lastWeek.set(key, m.weekNumber);
    });
  return count;
}

describe('Schedule generator', () => {
  test('never double-books a court or a team, and stays inside the season', () => {
    const { matches } = generate();
    const courtSlots = new Set();
    const teamSlots = new Set();
    for (const m of matches) {
      const court = slotKey(m.date, m.startTime, m.courtId);
      assert.ok(!courtSlots.has(court), `court double-booked: ${court}`);
      courtSlots.add(court);
      for (const t of [m.homeTeamId, m.awayTeamId, m.workTeamId].filter(Boolean)) {
        const key = `${m.date}|${m.startTime}|${t}`;
        assert.ok(!teamSlots.has(key), `team busy twice in one slot: ${key}`);
        teamSlots.add(key);
      }
      assert.ok(m.date >= '2026-09-08' && m.date <= '2026-11-24', `out of season: ${m.date}`);
      assert.notEqual(m.date, '2026-10-13', 'blackout date used');
    }
  });

  test('avoids court slots booked by another division', () => {
    const occupied = [slotKey('2026-09-08', '18:30', 'c1'), slotKey('2026-09-15', '19:30', 'c2')];
    const { matches } = generate({ occupiedSlots: occupied });
    for (const m of matches) {
      assert.ok(!occupied.includes(slotKey(m.date, m.startTime, m.courtId)));
    }
  });

  test('gives every team the same number of official games', () => {
    const { report } = generate();
    const official = new Set(report.teamMetrics.map((t) => t.officialGames));
    assert.equal(official.size, 1);
  });

  test('spreads referee duty evenly (within 1)', () => {
    const { report } = generate();
    const refs = report.teamMetrics.map((t) => t.refDutyCount);
    assert.ok(Math.max(...refs) - Math.min(...refs) <= 1, `ref duty: ${refs.join(',')}`);
  });

  test('two nights in the same week share a week number', () => {
    const { matches } = generate({ daysOfWeek: ['Tuesday', 'Thursday'], blackoutDates: [] });
    const byWeek = new Map();
    matches.forEach((m) => {
      byWeek.set(m.weekNumber, (byWeek.get(m.weekNumber) || new Set()).add(m.date));
    });
    assert.equal(byWeek.get(1).size, 2, 'week 1 has Tuesday and Thursday');
    assert.deepEqual([...byWeek.get(1)].sort(), ['2026-09-08', '2026-09-10']);
    assert.equal(Math.max(...byWeek.keys()), 12, '12 calendar weeks from Sep 8 to Nov 24');
  });

  test('"Space out opponents" reduces quick rematches', () => {
    // A small division with spare court capacity forces many extra games
    const options = { teams: makeTeams(7), blackoutDates: [] };
    const spaced = quickRematches(generate({ ...options, spaceOutOpponents: true }).matches, 2);
    const unspaced = quickRematches(generate({ ...options, spaceOutOpponents: false }).matches, 2);
    assert.ok(spaced < unspaced, `spaced=${spaced} should be less than unspaced=${unspaced}`);
  });
});

describe('Court availability by night', () => {
  const tuesdayCourt2Late = courtTimeKey('c2', 'Tuesday', '20:30');

  test('never schedules on a switched-off court time, but still uses the other court', () => {
    const { matches } = generate({ teams: makeTeams(10), unavailableCourtTimes: [tuesdayCourt2Late] });
    assert.equal(matches.filter((m) => m.courtId === 'c2' && m.startTime === '20:30').length, 0);
    assert.ok(matches.some((m) => m.courtId === 'c1' && m.startTime === '20:30'), 'Court 1 still has an 8:30 game');
  });

  test('applies only to the chosen night of the week', () => {
    const { matches } = generate({
      teams: makeTeams(10),
      daysOfWeek: ['Tuesday', 'Thursday'],
      unavailableCourtTimes: [tuesdayCourt2Late],
    });
    const late = matches.filter((m) => m.courtId === 'c2' && m.startTime === '20:30');
    const dayOf = (date) => new Date(date + 'T00:00:00').getDay(); // 2 = Tuesday, 4 = Thursday
    assert.equal(late.filter((m) => dayOf(m.date) === 2).length, 0, 'no Tuesday games in the blocked slot');
    assert.ok(late.some((m) => dayOf(m.date) === 4), 'Thursday can still use Court 2 at 8:30');
  });

  test('capacity in the report excludes switched-off court times', () => {
    const full = generate({ teams: makeTeams(10) }).report.totalSlotsAvailable;
    const reduced = generate({ teams: makeTeams(10), unavailableCourtTimes: [tuesdayCourt2Late] }).report.totalSlotsAvailable;
    const nights = new Set(generate({ teams: makeTeams(10) }).matches.map((m) => m.date)).size;
    assert.equal(full - reduced, nights, 'one fewer slot per Tuesday');
  });
});

describe('Week numbering', () => {
  test('weeks are numbered consecutively, skipping weeks with no games', () => {
    const weeks = buildWeekNumbers(['2026-09-08', '2026-09-10', '2026-09-22', '2026-09-29']);
    assert.deepEqual([...weeks.values()], [1, 1, 2, 3]);
  });
});

describe('Match time clash check', () => {
  test('overlapping times clash', () => {
    assert.equal(timeRangesOverlap('18:30', '19:30', '18:45', '19:45'), true);
  });
  test('back-to-back games do not clash', () => {
    assert.equal(timeRangesOverlap('18:30', '19:30', '19:30', '20:30'), false);
  });
  test('a missing end time is treated as one hour', () => {
    assert.equal(timeRangesOverlap('18:30', '', '19:15', '20:15'), true);
    assert.equal(timeRangesOverlap('18:30', '', '19:30', '20:30'), false);
  });
});
