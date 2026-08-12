import { LeagueSeason, TeamStanding, Match, Team, DEFAULT_MATCH_RULES } from '@/types/league';

export const initialLeagueData: LeagueSeason = {
  id: 'league-fall-2026',
  name: 'Premier Volleyball League - Fall 2026',
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
      name: 'Pioneer Gym',
      address: '750 Schoolhouse Road',
      parkingInfo: 'Park in Main Gymnasium lot',
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

export function calculateStandings(teams: Team[], matches: Match[], divisionId: string): TeamStanding[] {
  const divTeams = teams.filter((t) => t.divisionId === divisionId);
  const divMatches = matches.filter(
    (m) => m.divisionId === divisionId && m.status === 'Completed' && !m.isExhibition
  );

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

    let homeSets = 0;
    let awaySets = 0;

    m.scores.forEach((s) => {
      home.pointsFor += s.homeScore;
      home.pointsAgainst += s.awayScore;
      away.pointsFor += s.awayScore;
      away.pointsAgainst += s.homeScore;

      if (s.homeScore > s.awayScore) homeSets += 1;
      else if (s.awayScore > s.homeScore) awaySets += 1;
    });

    home.setsWon += homeSets;
    home.setsLost += awaySets;
    away.setsWon += awaySets;
    away.setsLost += homeSets;

    if (m.winnerId === m.homeTeamId) {
      home.wins += 1;
      away.losses += 1;
      home.points += homeSets === 2 && awaySets === 0 ? 3 : 2;
      away.points += awaySets === 1 ? 1 : 0;
    } else if (m.winnerId === m.awayTeamId) {
      away.wins += 1;
      home.losses += 1;
      away.points += awaySets === 2 && homeSets === 0 ? 3 : 2;
      home.points += homeSets === 1 ? 1 : 0;
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
