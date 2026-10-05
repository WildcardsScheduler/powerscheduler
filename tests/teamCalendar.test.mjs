import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/loadTs.mjs';

const { buildTeamCalendar, safeFileName } = loadTs('src/utils/teamCalendar.ts');

const league = {
  name: 'Tuesday Night Competitive',
  locations: [{ id: 'L1', name: 'Pioneer School', address: '5516 54 St, Rocky Mountain House', subLocations: [{ id: 'c1', locationId: 'L1', name: 'Court 1' }] }],
  teams: [
    { id: 'a', name: 'Duck, and Cover; Receivers' },
    { id: 'b', name: 'Block Party' },
    { id: 'c', name: 'Airborne' },
  ],
  matches: [
    { id: 'm2', date: '2026-10-20', startTime: '19:30', endTime: '20:30', weekNumber: 2, locationId: 'L1', subLocationId: 'c1', courtId: 'c1', homeTeamId: 'b', awayTeamId: 'c', workTeamId: 'a' },
    { id: 'm1', date: '2026-10-13', startTime: '18:30', endTime: '19:30', weekNumber: 1, locationId: 'L1', subLocationId: 'c1', courtId: 'c1', homeTeamId: 'a', awayTeamId: 'b', isExhibition: true },
    { id: 'm3', date: '2026-10-27', startTime: '18:30', endTime: '19:30', weekNumber: 3, homeTeamId: 'b', awayTeamId: 'c' },
  ],
};

describe('Admin package: team calendar (.ics)', () => {
  const ics = buildTeamCalendar(league, league.teams[0]);
  const unfolded = ics.replace(/\r\n /g, '');

  test('is a valid calendar with one event per game or ref duty for that team only', () => {
    assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
    assert.ok(ics.endsWith('END:VCALENDAR'));
    assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2, 'the game and the ref duty, not the third match');
  });

  test('uses local start and end times and lists events in date order', () => {
    assert.ok(unfolded.indexOf('DTSTART:20261013T183000') < unfolded.indexOf('DTSTART:20261020T193000'));
    assert.ok(unfolded.includes('DTEND:20261013T193000'));
  });

  test('describes games, exhibitions and ref duty, with the venue and address', () => {
    assert.ok(unfolded.includes('SUMMARY:Volleyball: Duck\\, and Cover\\; Receivers vs Block Party (exhibition)'));
    assert.ok(unfolded.includes('SUMMARY:Ref duty: Block Party vs Airborne'));
    assert.ok(unfolded.includes('LOCATION:Pioneer School (Court 1)\\, 5516 54 St\\, Rocky Mountain House'));
  });

  test('keeps every line within the 75-character limit', () => {
    ics.split('\r\n').forEach((line) => assert.ok(line.length <= 75, line));
  });
});

describe('Admin package: file names', () => {
  test('removes characters that break zip folders on Windows or phones', () => {
    assert.equal(safeFileName('Bump/Set: Spike?'), 'Bump-Set- Spike-');
    assert.equal(safeFileName('  Two   Bumps  '), 'Two Bumps');
    assert.equal(safeFileName('***'), '-');
  });
});
