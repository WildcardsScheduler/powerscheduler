import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/loadTs.mjs';

const { isGameDay } = loadTs('src/utils/gameDay.ts');
const league = (dates) => [{ matches: dates.map((date) => ({ date })) }];

describe('Game day detection (live refresh)', () => {
  test('a day with a game is a game day', () => {
    assert.equal(isGameDay(league(['2026-10-06']), new Date(2026, 9, 6, 18, 0)), true);
  });
  test('a day without games is not', () => {
    assert.equal(isGameDay(league(['2026-10-06']), new Date(2026, 9, 7, 18, 0)), false);
  });
  test('the early hours after a game night still count (late scores)', () => {
    assert.equal(isGameDay(league(['2026-10-06']), new Date(2026, 9, 7, 1, 30)), true);
    assert.equal(isGameDay(league(['2026-10-06']), new Date(2026, 9, 7, 3, 0)), false);
  });
  test('any league with a game today counts', () => {
    const leagues = [{ matches: [{ date: '2026-10-08' }] }, { matches: [{ date: '2026-10-06' }] }];
    assert.equal(isGameDay(leagues, new Date(2026, 9, 6, 12, 0)), true);
  });
  test('leagues with no schedule are fine', () => {
    assert.equal(isGameDay([{ matches: [] }, {}], new Date(2026, 9, 6)), false);
  });
});
