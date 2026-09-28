import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Core scoring algorithm matching src/data/mockLeagueData.ts
function computePointsForMatch(m, pointsSystem = 'fivb_3pt') {
  // Evaluate regulation sets (sets 1 & 2)
  const set1 = m.scores.find((s) => s.setNumber === 1) || m.scores[0];
  const set2 = m.scores.find((s) => s.setNumber === 2) || m.scores[1];

  let homeRegSets = 0;
  let awayRegSets = 0;
  if (set1) {
    if (set1.homeScore > set1.awayScore) homeRegSets += 1;
    else if (set1.awayScore > set1.homeScore) awayRegSets += 1;
  }
  if (set2) {
    if (set2.homeScore > set2.awayScore) homeRegSets += 1;
    else if (set2.awayScore > set2.homeScore) awayRegSets += 1;
  }

  // A regulation sweep occurs if a team won both of the first 2 sets (2-0 sweep)
  const isRegulationSweep = homeRegSets === 2 || awayRegSets === 2;
  const sweepWinnerId = homeRegSets === 2 ? m.homeTeamId : awayRegSets === 2 ? m.awayTeamId : null;

  let homeSets = 0;
  let awaySets = 0;
  let homePointsFor = 0;
  let awayPointsFor = 0;

  m.scores.forEach((s) => {
    const isThirdSet = s.setNumber === 3;

    // Dead rubber: If already swept 2-0 in regulation, Set 3 is unofficial
    if (isRegulationSweep && isThirdSet) {
      return;
    }

    if (s.homeScore > s.awayScore) homeSets += 1;
    else if (s.awayScore > s.homeScore) awaySets += 1;

    homePointsFor += s.homeScore;
    awayPointsFor += s.awayScore;
  });

  let homePoints = 0;
  let awayPoints = 0;
  const effectiveWinnerId = isRegulationSweep && sweepWinnerId ? sweepWinnerId : m.winnerId;

  if (effectiveWinnerId === m.homeTeamId) {
    if (pointsSystem === 'one_pt_per_set') {
      homePoints += homeSets;
      awayPoints += awaySets;
    } else if (pointsSystem === 'win_loss_2pt') {
      homePoints += 2;
      awayPoints += 0;
    } else if (pointsSystem === 'win_loss_3pt') {
      homePoints += 3;
      awayPoints += 0;
    } else {
      // 'fivb_3pt' (Default):
      const isSweep = isRegulationSweep || awaySets === 0;
      homePoints += isSweep ? 3 : 2;
      awayPoints += isSweep ? 0 : 1;
    }
  } else if (effectiveWinnerId === m.awayTeamId) {
    if (pointsSystem === 'one_pt_per_set') {
      awayPoints += awaySets;
      homePoints += homeSets;
    } else if (pointsSystem === 'win_loss_2pt') {
      awayPoints += 2;
      homePoints += 0;
    } else if (pointsSystem === 'win_loss_3pt') {
      awayPoints += 3;
      homePoints += 0;
    } else {
      // 'fivb_3pt' (Default):
      const isSweep = isRegulationSweep || homeSets === 0;
      awayPoints += isSweep ? 3 : 2;
      homePoints += isSweep ? 0 : 1;
    }
  }

  return { homePoints, awayPoints, homeSets, awaySets, homePointsFor, awayPointsFor };
}

describe('Standings Points System Calculations', () => {
  const sweepMatch = {
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
    winnerId: 'team-a',
    scores: [
      { setNumber: 1, homeScore: 25, awayScore: 20 },
      { setNumber: 2, homeScore: 25, awayScore: 18 },
    ],
  };

  const sweep30Match = {
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
    winnerId: 'team-a',
    scores: [
      { setNumber: 1, homeScore: 25, awayScore: 20 },
      { setNumber: 2, homeScore: 25, awayScore: 18 },
      { setNumber: 3, homeScore: 25, awayScore: 21 },
    ],
  };

  // Match where Team A won 2-0 in regulation, then played a fun 3rd set that Team B won (13-15)
  const sweepWithExhibition3rdSetMatch = {
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
    winnerId: 'team-a',
    scores: [
      { setNumber: 1, homeScore: 25, awayScore: 20 },
      { setNumber: 2, homeScore: 25, awayScore: 18 },
      { setNumber: 3, homeScore: 13, awayScore: 15 },
    ],
  };

  const splitMatch = {
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
    winnerId: 'team-a',
    scores: [
      { setNumber: 1, homeScore: 25, awayScore: 20 },
      { setNumber: 2, homeScore: 20, awayScore: 25 },
      { setNumber: 3, homeScore: 15, awayScore: 13 },
    ],
  };

  const awaySweepMatch = {
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
    winnerId: 'team-b',
    scores: [
      { setNumber: 1, homeScore: 19, awayScore: 25 },
      { setNumber: 2, homeScore: 21, awayScore: 25 },
    ],
  };

  const awaySplitMatch = {
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
    winnerId: 'team-b',
    scores: [
      { setNumber: 1, homeScore: 25, awayScore: 21 },
      { setNumber: 2, homeScore: 20, awayScore: 25 },
      { setNumber: 3, homeScore: 12, awayScore: 15 },
    ],
  };

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

    test('awards 3 pts to winner and 0 to loser even if exhibition set 3 was played after 2-0 sweep', () => {
      const res = computePointsForMatch(sweepWithExhibition3rdSetMatch, 'fivb_3pt');
      assert.equal(res.homePoints, 3, 'Winner of 2-0 regulation sweep maintains 3 points');
      assert.equal(res.awayPoints, 0, 'Loser does not get a bonus point from an unofficial 3rd set');
      assert.equal(res.homeSets, 2, 'Official sets won is 2');
      assert.equal(res.awaySets, 0, 'Official sets won is 0');
      // Set 3 points (13-15) must NOT count toward point totals:
      assert.equal(res.homePointsFor, 50, 'Home points only include sets 1 & 2 (25 + 25)');
      assert.equal(res.awayPointsFor, 38, 'Away points only include sets 1 & 2 (20 + 18)');
    });

    test('awards 2 pts to winner, 1 pt to loser on 2-1 deciding set split (tied 1-1 after 2 sets)', () => {
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
});
