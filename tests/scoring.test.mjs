import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/loadTs.mjs';

// Runs the real standings code from src/data/mockLeagueData.ts
const { calculateStandings } = loadTs('src/data/mockLeagueData.ts');

const TEAMS = [
  { id: 'team-a', name: 'Team A', divisionId: 'div', badgeColor: '#000', captainName: '', captainEmail: '', captainPhone: '', roster: [] },
  { id: 'team-b', name: 'Team B', divisionId: 'div', badgeColor: '#fff', captainName: '', captainEmail: '', captainPhone: '', roster: [] },
];

function rules(pointsSystem, overrides = {}) {
  return {
    totalSets: 3,
    pointsPerSet: 25,
    pointsPerDecidingSet: 15,
    thirdSetRule: 'guaranteed_all',
    winByTwo: true,
    capRule: 'Win by 2 (Uncapped)',
    excludeThirdSetPointsFromDiff: true,
    standingsPointsSystem: pointsSystem,
    ...overrides,
  };
}

/** Standings for a single completed match between Team A (home) and Team B (away). */
function computePointsForMatch(m, pointsSystem = 'fivb_3pt', ruleOverrides = {}) {
  const match = {
    id: 'm1',
    divisionId: 'div',
    weekNumber: 1,
    date: '2026-09-08',
    startTime: '18:30',
    endTime: '19:30',
    subLocationId: 'court-1',
    status: 'Completed',
    ...m,
  };
  const standings = calculateStandings(TEAMS, [match], 'div', rules(pointsSystem, ruleOverrides));
  const home = standings.find((s) => s.teamId === 'team-a');
  const away = standings.find((s) => s.teamId === 'team-b');
  return {
    homePoints: home.points,
    awayPoints: away.points,
    homeSets: home.setsWon,
    awaySets: away.setsWon,
    homeWins: home.wins,
    awayWins: away.wins,
    homePointsFor: home.pointsFor,
    awayPointsFor: away.pointsFor,
    homeDiff: home.pointDiff,
  };
}

const sets = (...pairs) => pairs.map(([homeScore, awayScore], i) => ({ setNumber: i + 1, homeScore, awayScore }));

describe('Standings Points System Calculations', () => {
  const sweepMatch = { homeTeamId: 'team-a', awayTeamId: 'team-b', winnerId: 'team-a', scores: sets([25, 20], [25, 18]) };
  const sweep30Match = { homeTeamId: 'team-a', awayTeamId: 'team-b', winnerId: 'team-a', scores: sets([25, 20], [25, 18], [25, 21]) };
  // Team A won 2-0 in regulation, then Team B won a 3rd set (13-15)
  const sweepThenLostSet3Match = { homeTeamId: 'team-a', awayTeamId: 'team-b', winnerId: 'team-a', scores: sets([25, 20], [25, 18], [13, 15]) };
  const splitMatch = { homeTeamId: 'team-a', awayTeamId: 'team-b', winnerId: 'team-a', scores: sets([25, 20], [20, 25], [15, 13]) };
  const awaySweepMatch = { homeTeamId: 'team-a', awayTeamId: 'team-b', winnerId: 'team-b', scores: sets([19, 25], [21, 25]) };
  const awaySplitMatch = { homeTeamId: 'team-a', awayTeamId: 'team-b', winnerId: 'team-b', scores: sets([25, 21], [20, 25], [12, 15]) };

  describe('FIVB 3-Point System (Default)', () => {
    test('awards 3 pts to winner, 0 pts to loser on 2-0 sweep', () => {
      const res = computePointsForMatch(sweepMatch, 'fivb_3pt');
      assert.equal(res.homePoints, 3);
      assert.equal(res.awayPoints, 0);
    });

    test('awards 3 pts to winner, 0 pts to loser on 3-0 sweep', () => {
      const res = computePointsForMatch(sweep30Match, 'fivb_3pt');
      assert.equal(res.homePoints, 3);
      assert.equal(res.awayPoints, 0);
    });

    test('a 3rd set played after a 2-0 sweep does not count at all', () => {
      const res = computePointsForMatch(sweepThenLostSet3Match, 'fivb_3pt');
      assert.equal(res.homePoints, 3, 'Winner of 2-0 regulation sweep keeps 3 points');
      assert.equal(res.awayPoints, 0, 'Loser gets no bonus point from the dead-rubber set');
      assert.equal(res.homeSets, 2);
      assert.equal(res.awaySets, 0);
      assert.equal(res.homePointsFor, 50, 'Home points only include sets 1 & 2 (25 + 25)');
      assert.equal(res.awayPointsFor, 38, 'Away points only include sets 1 & 2 (20 + 18)');
    });

    test('awards 2 pts to winner, 1 pt to loser on 2-1 deciding set split', () => {
      const res = computePointsForMatch(splitMatch, 'fivb_3pt');
      assert.equal(res.homePoints, 2);
      assert.equal(res.awayPoints, 1);
      assert.equal(res.homeSets, 2);
      assert.equal(res.awaySets, 1);
    });

    test('works correctly when away team wins sweep (0-2)', () => {
      const res = computePointsForMatch(awaySweepMatch, 'fivb_3pt');
      assert.equal(res.homePoints, 0);
      assert.equal(res.awayPoints, 3);
    });

    test('works correctly when away team wins 2-1 split (1-2)', () => {
      const res = computePointsForMatch(awaySplitMatch, 'fivb_3pt');
      assert.equal(res.homePoints, 1);
      assert.equal(res.awayPoints, 2);
    });
  });

  describe('1 Point Per Set Won (one_pt_per_set)', () => {
    test('awards 1 point for every set won in sweep (2-0)', () => {
      const res = computePointsForMatch(sweepMatch, 'one_pt_per_set');
      assert.equal(res.homePoints, 2);
      assert.equal(res.awayPoints, 0);
    });

    test('awards 2 pts to winner and 1 pt to loser in 2-1 split', () => {
      const res = computePointsForMatch(splitMatch, 'one_pt_per_set');
      assert.equal(res.homePoints, 2);
      assert.equal(res.awayPoints, 1);
    });

    test('a 3rd set after a 2-0 sweep counts for sets and points', () => {
      const res = computePointsForMatch(sweepThenLostSet3Match, 'one_pt_per_set');
      assert.equal(res.homeSets, 2);
      assert.equal(res.awaySets, 1, 'Team B is credited with the set it won');
      assert.equal(res.homePoints, 2);
      assert.equal(res.awayPoints, 1, 'Team B earns 1 point for winning set 3');
      assert.equal(res.homeWins, 1, 'Team A still wins the match');
    });

    test('a 3rd set after a 2-0 sweep never counts towards +/-, even with the option off', () => {
      const res = computePointsForMatch(sweepThenLostSet3Match, 'one_pt_per_set', { excludeThirdSetPointsFromDiff: false });
      assert.equal(res.homePointsFor, 50, 'Only sets 1 & 2 count (25 + 25)');
      assert.equal(res.awayPointsFor, 38, 'Only sets 1 & 2 count (20 + 18)');
      assert.equal(res.homeDiff, 12);
    });

    test('a deciding 3rd set after 1-1 follows the +/- option', () => {
      const excluded = computePointsForMatch(splitMatch, 'one_pt_per_set');
      assert.equal(excluded.homeDiff, 0, 'Option on: sets 1 & 2 only (45 - 45)');
      const included = computePointsForMatch(splitMatch, 'one_pt_per_set', { excludeThirdSetPointsFromDiff: false });
      assert.equal(included.homeDiff, 2, 'Option off: set 3 (15-13) included');
    });
  });

  describe('Win/Loss 2-Pt (win_loss_2pt)', () => {
    test('awards 2 pts for sweep win and 0 for loss', () => {
      const res = computePointsForMatch(sweepMatch, 'win_loss_2pt');
      assert.equal(res.homePoints, 2);
      assert.equal(res.awayPoints, 0);
    });

    test('awards 2 pts for 2-1 win and 0 for loss', () => {
      const res = computePointsForMatch(splitMatch, 'win_loss_2pt');
      assert.equal(res.homePoints, 2);
      assert.equal(res.awayPoints, 0);
    });
  });

  describe('Win/Loss 3-Pt (win_loss_3pt)', () => {
    test('awards 3 pts for sweep win and 0 for loss', () => {
      const res = computePointsForMatch(sweepMatch, 'win_loss_3pt');
      assert.equal(res.homePoints, 3);
      assert.equal(res.awayPoints, 0);
    });

    test('awards 3 pts for 2-1 win and 0 for loss', () => {
      const res = computePointsForMatch(splitMatch, 'win_loss_3pt');
      assert.equal(res.homePoints, 3);
      assert.equal(res.awayPoints, 0);
    });
  });

  describe('Best-of-5 matches', () => {
    test('a 2-0 lead is not treated as a sweep: the 3-2 comeback winner gets the win', () => {
      const comeback = {
        homeTeamId: 'team-a',
        awayTeamId: 'team-b',
        winnerId: 'team-b',
        scores: sets([25, 20], [25, 20], [20, 25], [20, 25], [10, 15]),
      };
      const res = computePointsForMatch(comeback, 'fivb_3pt', { totalSets: 5 });
      assert.equal(res.awayWins, 1);
      assert.equal(res.homeWins, 0);
      assert.equal(res.awaySets, 3);
      assert.equal(res.homeSets, 2);
      assert.equal(res.awayPoints, 2);
      assert.equal(res.homePoints, 1);
    });
  });
});

describe('Standings filtering and ranking', () => {
  test('ignores exhibition, postponed and scheduled matches', () => {
    const base = { homeTeamId: 'team-a', awayTeamId: 'team-b', winnerId: 'team-a', scores: sets([25, 20], [25, 18]) };
    const ignored = [
      { ...base, id: 'x1', status: 'Completed', isExhibition: true },
      { ...base, id: 'x2', status: 'Postponed' },
      { ...base, id: 'x3', status: 'Scheduled' },
    ].map((m) => ({ divisionId: 'div', weekNumber: 1, date: '2026-09-08', startTime: '18:30', endTime: '', subLocationId: 'c', ...m }));
    const standings = calculateStandings(TEAMS, ignored, 'div', rules('fivb_3pt'));
    assert.ok(standings.every((s) => s.played === 0 && s.points === 0));
  });

  test('clearing a score takes the game back out of the standings', () => {
    const played = { id: 'm1', divisionId: 'div', weekNumber: 1, date: '2026-09-08', startTime: '18:30', endTime: '', subLocationId: 'c',
      status: 'Completed', homeTeamId: 'team-a', awayTeamId: 'team-b', winnerId: 'team-a', scores: sets([25, 20], [25, 18]) };
    const before = calculateStandings(TEAMS, [played], 'div', rules('fivb_3pt'));
    assert.equal(before.find((s) => s.teamId === 'team-a').points, 3, 'the win counts while the score is recorded');

    // What the scorekeeper's Clear score (and the match editor's unplayed statuses) save
    const cleared = { ...played, status: 'Scheduled', scores: [], winnerId: undefined };
    const after = calculateStandings(TEAMS, [cleared], 'div', rules('fivb_3pt'));
    assert.ok(after.every((s) => s.played === 0 && s.wins === 0 && s.losses === 0 && s.points === 0 && s.setsWon === 0 && s.pointsFor === 0));
  });

  test('a cancelled game with a leftover score is not counted', () => {
    const base = { divisionId: 'div', weekNumber: 1, date: '2026-09-08', startTime: '18:30', endTime: '', subLocationId: 'c',
      homeTeamId: 'team-a', awayTeamId: 'team-b', winnerId: 'team-a', scores: sets([25, 20], [25, 18]) };
    const standings = calculateStandings(TEAMS, [{ ...base, id: 'c1', status: 'Cancelled' }], 'div', rules('fivb_3pt'));
    assert.ok(standings.every((s) => s.played === 0 && s.points === 0));
  });

  test('a forfeit counts as a 25-0, 25-0 sweep for the team that showed up', () => {
    const { forfeitScores } = loadTs('src/utils/matchStatus.ts');
    const forfeit = { id: 'f1', divisionId: 'div', weekNumber: 1, date: '2026-09-08', startTime: '18:30', endTime: '', subLocationId: 'c',
      status: 'Forfeit', homeTeamId: 'team-a', awayTeamId: 'team-b', winnerId: 'team-b', scores: forfeitScores(false) };
    assert.deepEqual(forfeit.scores, sets([0, 25], [0, 25]));
    for (const thirdSetRule of ['play_if_tied', 'guaranteed_all']) {
      const standings = calculateStandings(TEAMS, [forfeit], 'div', rules('fivb_3pt', { thirdSetRule }));
      const winner = standings.find((s) => s.teamId === 'team-b');
      const loser = standings.find((s) => s.teamId === 'team-a');
      assert.equal(winner.points, 3, thirdSetRule + ': the sweep is worth 3 points');
      assert.equal(winner.wins, 1);
      assert.equal(winner.setsWon, 2);
      assert.equal(winner.pointDiff, 50);
      assert.equal(loser.points, 0);
      assert.equal(loser.losses, 1);
      assert.equal(loser.played, 1);
    }
  });

  test('ranks by points first', () => {
    const m = { id: 'm1', divisionId: 'div', weekNumber: 1, date: '2026-09-08', startTime: '18:30', endTime: '', subLocationId: 'c',
      status: 'Completed', homeTeamId: 'team-a', awayTeamId: 'team-b', winnerId: 'team-b', scores: sets([19, 25], [21, 25]) };
    const standings = calculateStandings(TEAMS, [m], 'div', rules('fivb_3pt'));
    assert.equal(standings[0].teamId, 'team-b');
    assert.equal(standings[0].rank, 1);
    assert.equal(standings[1].rank, 2);
  });
});
