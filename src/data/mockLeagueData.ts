import { LeagueSeason, TeamStanding, Match, Team, DEFAULT_MATCH_RULES } from '@/types/league';

export const initialLeagueData: LeagueSeason = {
  id: 'league-fall-2026',
  name: 'Metro Volleyball League - Fall 2026',
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
      address: '750 Schoolhouse Road, Metro City',
      parkingInfo: 'Park in West lot by Gymnasium entrance',
      subLocations: [
        { id: 'sub-pioneer-c1', locationId: 'loc-pioneer', name: 'Court 1 (Pioneer Gym)', surface: 'Hardwood' },
        { id: 'sub-pioneer-c2', locationId: 'loc-pioneer', name: 'Court 2 (Pioneer Gym)', surface: 'Hardwood' },
      ],
    },
    {
      id: 'loc-southside',
      name: 'Southside Fieldhouse',
      address: '1420 Olympic Way, Metro City',
      subLocations: [
        { id: 'sub-southside-cA', locationId: 'loc-southside', name: 'Court A (Hardwood)', surface: 'Hardwood' },
        { id: 'sub-southside-cB', locationId: 'loc-southside', name: 'Court B (Hardwood)', surface: 'Hardwood' },
        { id: 'sub-southside-cC', locationId: 'loc-southside', name: 'Court C (SportCourt)', surface: 'Sport Court' },
      ],
    },
    {
      id: 'loc-beach',
      name: 'North Beach Pavilion',
      address: '88 Ocean Drive, Metro City',
      subLocations: [
        { id: 'sub-beach-1', locationId: 'loc-beach', name: 'Sand Court 1', surface: 'Beach Sand' },
        { id: 'sub-beach-2', locationId: 'loc-beach', name: 'Sand Court 2', surface: 'Beach Sand' },
      ],
    },
  ],
  divisions: [
    {
      id: 'div-coed-a',
      name: 'Co-Ed 6s Competitive A',
      genderCategory: 'Co-Ed',
      netHeight: "Co-Ed (2.43m)",
      setFormat: 'Best of 3 (25-25-15)',
      minFemalesOnCourt: 2,
      capRule: 'Win by 2 (Uncapped)',
      workTeamRequired: true,
      maxTeams: 8,
    },
    {
      id: 'div-mens-open',
      name: "Men's Open",
      genderCategory: 'Men',
      netHeight: "Men's (2.43m)",
      setFormat: 'Best of 3 (25-25-15)',
      capRule: 'Win by 2 (Uncapped)',
      workTeamRequired: true,
      maxTeams: 6,
    },
    {
      id: 'div-womens-a',
      name: "Women's Division A",
      genderCategory: 'Women',
      netHeight: "Women's (2.24m)",
      setFormat: 'Best of 3 (25-25-15)',
      capRule: 'Win by 2 (Uncapped)',
      workTeamRequired: true,
      maxTeams: 6,
    },
  ],
  teams: [
    {
      id: 'team-spiked-punch',
      divisionId: 'div-coed-a',
      name: 'Spiked Punch',
      captainName: 'Sarah Jenkins',
      captainEmail: 'sarah.j@example.com',
      captainPhone: '(555) 234-5678',
      badgeColor: '#ec4899',
      roster: [
        { id: 'p1', name: 'Sarah Jenkins', number: '7', position: 'Setter', gender: 'F', isCaptain: true, rsvpStatus: 'Going' },
        { id: 'p2', name: 'Marcus Vance', number: '12', position: 'Outside Hitter', gender: 'M', isCaptain: false, rsvpStatus: 'Going' },
        { id: 'p3', name: 'Elena Rostova', number: '4', position: 'Middle Blocker', gender: 'F', isCaptain: false, rsvpStatus: 'Going' },
        { id: 'p4', name: 'David Kim', number: '10', position: 'Opposite Hitter', gender: 'M', isCaptain: false, rsvpStatus: 'Maybe' },
        { id: 'p5', name: 'Chloe Miller', number: '2', position: 'Libero', gender: 'F', isCaptain: false, rsvpStatus: 'Going' },
      ],
    },
    {
      id: 'team-block-party',
      divisionId: 'div-coed-a',
      name: 'Block Party',
      captainName: 'Alex Rivera',
      captainEmail: 'alex.r@example.com',
      captainPhone: '(555) 345-6789',
      badgeColor: '#3b82f6',
      roster: [
        { id: 'p7', name: 'Alex Rivera', number: '1', position: 'Outside Hitter', gender: 'M', isCaptain: true, rsvpStatus: 'Going' },
        { id: 'p8', name: 'Jessica Chen', number: '9', position: 'Setter', gender: 'F', isCaptain: false, rsvpStatus: 'Going' },
        { id: 'p9', name: 'Brian O\'Connor', number: '14', position: 'Middle Blocker', gender: 'M', isCaptain: false, rsvpStatus: 'Going' },
      ],
    },
    {
      id: 'team-net-results',
      divisionId: 'div-coed-a',
      name: 'Net Results',
      captainName: 'Tyler Kowalski',
      captainEmail: 'tyler.k@example.com',
      captainPhone: '(555) 456-7890',
      badgeColor: '#10b981',
      roster: [
        { id: 'p12', name: 'Tyler Kowalski', number: '11', position: 'Setter', gender: 'M', isCaptain: true, rsvpStatus: 'Going' },
        { id: 'p13', name: 'Maria Santos', number: '8', position: 'Outside Hitter', gender: 'F', isCaptain: false, rsvpStatus: 'Going' },
      ],
    },
    {
      id: 'team-dig-dynasty',
      divisionId: 'div-coed-a',
      name: 'Dig Dynasty',
      captainName: 'Rachel Thorne',
      captainEmail: 'rachel.t@example.com',
      captainPhone: '(555) 567-8901',
      badgeColor: '#8b5cf6',
      roster: [
        { id: 'p16', name: 'Rachel Thorne', number: '6', position: 'Outside Hitter', gender: 'F', isCaptain: true, rsvpStatus: 'Going' },
      ],
    },
    {
      id: 'team-thunder-spikes',
      divisionId: 'div-mens-open',
      name: 'Thunder Spikes',
      captainName: 'Jason Hayes',
      captainEmail: 'jason.h@example.com',
      captainPhone: '(555) 678-9012',
      badgeColor: '#f59e0b',
      roster: [
        { id: 'p19', name: 'Jason Hayes', number: '10', position: 'Outside Hitter', gender: 'M', isCaptain: true, rsvpStatus: 'Going' },
      ],
    },
    {
      id: 'team-skyline-vbc',
      divisionId: 'div-mens-open',
      name: 'Skyline VBC',
      captainName: 'Victor Cruz',
      captainEmail: 'victor.c@example.com',
      captainPhone: '(555) 789-0123',
      badgeColor: '#06b6d4',
      roster: [
        { id: 'p21', name: 'Victor Cruz', number: '8', position: 'Setter', gender: 'M', isCaptain: true, rsvpStatus: 'Going' },
      ],
    },
  ],
  matches: [
    {
      id: 'm1',
      divisionId: 'div-coed-a',
      weekNumber: 1,
      date: '2026-09-08',
      startTime: '18:30',
      endTime: '19:30',
      locationId: 'loc-pioneer',
      subLocationId: 'sub-pioneer-c1',
      homeTeamId: 'team-spiked-punch',
      awayTeamId: 'team-block-party',
      workTeamId: 'team-net-results',
      status: 'Completed',
      scores: [
        { setNumber: 1, homeScore: 25, awayScore: 22 },
        { setNumber: 2, homeScore: 21, awayScore: 25 },
        { setNumber: 3, homeScore: 15, awayScore: 11 },
      ],
      winnerId: 'team-spiked-punch',
    },
    {
      id: 'm2',
      divisionId: 'div-coed-a',
      weekNumber: 1,
      date: '2026-09-08',
      startTime: '18:30',
      endTime: '19:30',
      locationId: 'loc-pioneer',
      subLocationId: 'sub-pioneer-c2',
      homeTeamId: 'team-net-results',
      awayTeamId: 'team-dig-dynasty',
      workTeamId: 'team-block-party',
      status: 'Completed',
      scores: [
        { setNumber: 1, homeScore: 25, awayScore: 19 },
        { setNumber: 2, homeScore: 25, awayScore: 23 },
      ],
      winnerId: 'team-net-results',
    },
    {
      id: 'm3',
      divisionId: 'div-coed-a',
      weekNumber: 2,
      date: '2026-09-15',
      startTime: '18:30',
      endTime: '19:30',
      locationId: 'loc-pioneer',
      subLocationId: 'sub-pioneer-c1',
      homeTeamId: 'team-spiked-punch',
      awayTeamId: 'team-net-results',
      workTeamId: 'team-dig-dynasty',
      status: 'Scheduled',
      scores: [],
    },
    {
      id: 'm4',
      divisionId: 'div-coed-a',
      weekNumber: 2,
      date: '2026-09-15',
      startTime: '18:30',
      endTime: '19:30',
      locationId: 'loc-pioneer',
      subLocationId: 'sub-pioneer-c2',
      homeTeamId: 'team-block-party',
      awayTeamId: 'team-dig-dynasty',
      workTeamId: 'team-spiked-punch',
      status: 'Scheduled',
      scores: [],
    },
  ],
};

export const sampleBeachLeague: LeagueSeason = {
  id: 'league-summer-beach-2026',
  name: 'Ocean Beach 4s Summer Circuit',
  sport: 'Beach Volleyball',
  startDate: '2026-06-01',
  endDate: '2026-08-15',
  maxTeams: 8,
  locations: [
    {
      id: 'loc-beach-arena',
      name: 'North Beach Sand Courts',
      address: '88 Ocean Drive, Metro City',
      subLocations: [
        { id: 'sub-b1', locationId: 'loc-beach-arena', name: 'Sand Court 1', surface: 'Beach Sand' },
        { id: 'sub-b2', locationId: 'loc-beach-arena', name: 'Sand Court 2', surface: 'Beach Sand' },
      ],
    },
  ],
  divisions: [
    {
      id: 'div-beach-open',
      name: 'Beach Co-Ed 4s Open',
      genderCategory: 'Co-Ed',
      netHeight: "Co-Ed (2.43m)",
      setFormat: 'Best of 3 (25-25-15)',
      minFemalesOnCourt: 1,
      capRule: 'Win by 2 (Uncapped)',
      workTeamRequired: true,
      maxTeams: 8,
    },
  ],
  teams: [
    {
      id: 'team-sand-stormers',
      divisionId: 'div-beach-open',
      name: 'Sand Stormers',
      captainName: 'Derek Sands',
      captainEmail: 'derek@example.com',
      captainPhone: '(555) 999-0000',
      badgeColor: '#f59e0b',
      roster: [
        { id: 'pb1', name: 'Derek Sands', position: 'Setter', gender: 'M', isCaptain: true, rsvpStatus: 'Going' },
      ],
    },
    {
      id: 'team-sunset-setters',
      divisionId: 'div-beach-open',
      name: 'Sunset Setters',
      captainName: 'Mia Alvarez',
      captainEmail: 'mia@example.com',
      captainPhone: '(555) 888-1111',
      badgeColor: '#06b6d4',
      roster: [
        { id: 'pb2', name: 'Mia Alvarez', position: 'Outside Hitter', gender: 'F', isCaptain: true, rsvpStatus: 'Going' },
      ],
    },
  ],
  matches: [
    {
      id: 'mb1',
      divisionId: 'div-beach-open',
      weekNumber: 1,
      date: '2026-06-01',
      startTime: '10:00',
      endTime: '11:00',
      locationId: 'loc-beach-arena',
      subLocationId: 'sub-b1',
      homeTeamId: 'team-sand-stormers',
      awayTeamId: 'team-sunset-setters',
      status: 'Scheduled',
      scores: [],
    },
  ],
};

export const initialLeaguesList: LeagueSeason[] = [
  initialLeagueData,
  sampleBeachLeague,
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
