import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Core scoring algorithm matching src/data/mockLeagueData.ts
function computePointsForMatch(m, pointsSystem = 'fivb_3pt') {
  let homeSets = 0;
  let awaySets = 0;
  m.scores.forEach((s) => {
    if (s.homeScore > s.awayScore) homeSets += 1;
    else if (s.awayScore > s.homeScore) awaySets += 1;
  });

  let homePoints = 0;
  let awayPoints = 0;

  if (m.winnerId === m.homeTeamId) {
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
      const isSweep = awaySets === 0;
      homePoints += isSweep ? 3 : 2;
      awayPoints += isSweep ? 0 : 1;
    }
  } else if (m.winnerId === m.awayTeamId) {
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
      const isSweep = homeSets === 0;
      awayPoints += isSweep ? 3 : 2;
      homePoints += isSweep ? 0 : 1;
    }
  }

  return { homePoints, awayPoints };
}

describe('Standings Points System Calculations', () => {
  const sweepMatch = {
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
    winnerId: 'team-a',
    scores: [
      { homeScore: 25, awayScore: 20 },
      { homeScore: 25, awayScore: 18 },
    ],
  };

  const sweep30Match = {
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
    winnerId: 'team-a',
    scores: [
      { homeScore: 25, awayScore: 20 },
      { homeScore: 25, awayScore: 18 },
      { homeScore: 25, awayScore: 21 },
    ],
  };

  const splitMatch = {
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
    winnerId: 'team-a',
    scores: [
      { homeScore: 25, awayScore: 20 },
      { homeScore: 20, awayScore: 25 },
      { homeScore: 15, awayScore: 13 },
    ],
  };

  const awaySweepMatch = {
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
    winnerId: 'team-b',
    scores: [
      { homeScore: 19, awayScore: 25 },
      { homeScore: 21, awayScore: 25 },
    ],
  };

  const awaySplitMatch = {
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
    winnerId: 'team-b',
    scores: [
      { homeScore: 25, awayScore: 21 },
      { homeScore: 20, awayScore: 25 },
      { homeScore: 12, awayScore: 15 },
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

    test('awards 2 pts to winner, 1 pt to loser on 2-1 deciding set split', () => {
      const res = computePointsForMatch(splitMatch, 'fivb_3pt');
      assert.equal(res.homePoints, 2);
      assert.equal(res.awayPoints, 1);
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

    test('awards 1 point for every set won in 3-0 sweep', () => {
      const res = computePointsForMatch(sweep30Match, 'one_pt_per_set');
      assert.equal(res.homePoints, 3);
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
