import { LeagueSeason, TeamStanding, Match, Team, MatchRules } from '@/types/league';
import { isPlayedMatch } from '@/utils/matchStatus';

export const initialLeagueData: LeagueSeason = {
  id: 'league-fall-2026',
  name: 'My Volleyball League',
  sport: 'Volleyball',
  startDate: '2026-09-08',
  endDate: '2026-11-24',
  maxTeams: 12,
  matchRules: {
    totalSets: 3,
    pointsPerSet: 25,
    pointsPerDecidingSet: 15,
    thirdSetRule: 'guaranteed_all',
    winByTwo: true,
    capRule: 'Win by 2 (Uncapped)',
  },
  locations: [
    {
      id: 'loc-pioneer',
      name: 'Pioneer School',
      address: '5516 54 St, Rocky Mountain House, AB T4T 1S7',
      subLocations: [
        { id: 'sub-pioneer-c1', locationId: 'loc-pioneer', name: 'Court 1', surface: 'Hardwood' },
        { id: 'sub-pioneer-c2', locationId: 'loc-pioneer', name: 'Court 2', surface: 'Hardwood' },
      ],
    },
  ],
  divisions: [
    {
      id: 'div-main',
      name: 'Main Division',
      genderCategory: 'Co-Ed',
      setFormat: 'Best of 3 (25-25-15)',
      minFemalesOnCourt: 2,
      capRule: 'Win by 2 (Uncapped)',
      workTeamRequired: true,
      maxTeams: 12,
    },
  ],
  teams: [],
  matches: [],
};

export const initialLeaguesList: LeagueSeason[] = [
  initialLeagueData,
];

export function calculateStandings(
  teams: Team[],
  matches: Match[],
  divisionId: string,
  matchRules?: MatchRules
): TeamStanding[] {
  const divTeams = teams.filter((t) => t.divisionId === divisionId);
  const divMatches = matches.filter(
    (m) => m.divisionId === divisionId && isPlayedMatch(m) && !m.isExhibition
  );

  const excludeThirdSet = matchRules?.excludeThirdSetPointsFromDiff ?? true;

  const statsMap = new Map<string, Omit<TeamStanding, 'rank' | 'setRatio' | 'pointDiff'>>();

  divTeams.forEach((t) => {
    statsMap.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      badgeColor: t.badgeColor,
      played: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      points: 0,
    });
  });

  divMatches.forEach((m) => {
    const home = statsMap.get(m.homeTeamId);
    const away = statsMap.get(m.awayTeamId);

    if (!home || !away) return;

    home.played += 1;
    away.played += 1;

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

    const pointsSystem = matchRules?.standingsPointsSystem || 'fivb_3pt';

    // A regulation sweep occurs if a team won both of the first 2 sets (2-0 sweep).
    // Only meaningful in 3-set matches: 2-0 does not decide a best-of-5.
    const isThreeSetMatch = (matchRules?.totalSets ?? 3) <= 3;
    const isRegulationSweep = isThreeSetMatch && (homeRegSets === 2 || awayRegSets === 2);
    const sweepWinnerId = homeRegSets === 2 ? m.homeTeamId : awayRegSets === 2 ? m.awayTeamId : null;

    let homeSets = 0;
    let awaySets = 0;

    m.scores.forEach((s) => {
      const isThirdSet = s.setNumber === 3;
      const isDeadRubber = isRegulationSweep && isThirdSet;

      // A 3rd set played after a 2-0 sweep is a dead rubber. It never counts towards +/-.
      // It only counts towards sets won/lost (and standings points) under "1 point per set won".
      if (isDeadRubber && pointsSystem !== 'one_pt_per_set') {
        return;
      }

      // Count official set score
      if (s.homeScore > s.awayScore) homeSets += 1;
      else if (s.awayScore > s.homeScore) awaySets += 1;

      // Exclude 3rd set scores from +/- point totals if option enabled or if it was a dead rubber
      if (!isDeadRubber && (!excludeThirdSet || !isThirdSet)) {
        home.pointsFor += s.homeScore;
        home.pointsAgainst += s.awayScore;
        away.pointsFor += s.awayScore;
        away.pointsAgainst += s.homeScore;
      }
    });

    home.setsWon += homeSets;
    home.setsLost += awaySets;
    away.setsWon += awaySets;
    away.setsLost += homeSets;

    const effectiveWinnerId = isRegulationSweep && sweepWinnerId ? sweepWinnerId : m.winnerId;

    if (effectiveWinnerId === m.homeTeamId) {
      home.wins += 1;
      away.losses += 1;

      if (pointsSystem === 'one_pt_per_set') {
        home.points += homeSets;
        away.points += awaySets;
      } else if (pointsSystem === 'win_loss_2pt') {
        home.points += 2;
        away.points += 0;
      } else if (pointsSystem === 'win_loss_3pt') {
        home.points += 3;
        away.points += 0;
      } else {
        // 'fivb_3pt' (Default):
        // Sweep (2-0 regulation sweep or 0 sets conceded): 3 pts to winner, 0 to loser
        // Third-set decider (tied 1-1 after 2 sets): 2 pts to winner, 1 bonus pt to loser
        const isSweep = isRegulationSweep || awaySets === 0;
        home.points += isSweep ? 3 : 2;
        away.points += isSweep ? 0 : 1;
      }
    } else if (effectiveWinnerId === m.awayTeamId) {
      away.wins += 1;
      home.losses += 1;

      if (pointsSystem === 'one_pt_per_set') {
        away.points += awaySets;
        home.points += homeSets;
      } else if (pointsSystem === 'win_loss_2pt') {
        away.points += 2;
        home.points += 0;
      } else if (pointsSystem === 'win_loss_3pt') {
        away.points += 3;
        home.points += 0;
      } else {
        // 'fivb_3pt' (Default):
        const isSweep = isRegulationSweep || homeSets === 0;
        away.points += isSweep ? 3 : 2;
        home.points += isSweep ? 0 : 1;
      }
    }
  });

  const standingsList: TeamStanding[] = Array.from(statsMap.values()).map((s) => {
    const totalSets = s.setsWon + s.setsLost;
    const setRatio = totalSets > 0 ? Number((s.setsWon / totalSets).toFixed(3)) : 0;
    const pointDiff = s.pointsFor - s.pointsAgainst;

    return {
      ...s,
      setRatio,
      pointDiff,
      rank: 0,
    };
  });

  standingsList.sort((a, b) => {
    // 1. Total Points
    if (b.points !== a.points) return b.points - a.points;
    // 2. Match Wins
    if (b.wins !== a.wins) return b.wins - a.wins;
    // 3. Set Ratio
    if (b.setRatio !== a.setRatio) return b.setRatio - a.setRatio;
    // 4. Point Differential
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    // 5. Points For
    return b.pointsFor - a.pointsFor;
  });

  return standingsList.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
