import { LeagueSeason, Division, Location, Team, Match, SportType, MatchRules, DEFAULT_MATCH_RULES } from '@/types/league';
import { generateVolleyballSchedule } from './schedulerEngine';

export function createBlankLeague(
  name: string,
  sport: SportType,
  startDate: string,
  endDate: string,
  maxTeams: number = 12,
  hasDivisions: boolean = true,
  matchRules?: MatchRules
): LeagueSeason {
  const leagueId = `league-${Date.now()}`;
  const timestamp = Date.now();
  const rules = matchRules || DEFAULT_MATCH_RULES;

  const defaultDivision: Division = {
    id: `div-${timestamp}-main`,
    name: hasDivisions ? 'Division A' : 'Main Division',
    genderCategory: 'Co-Ed',
    netHeight: "Co-Ed (2.43m)",
    setFormat: 'Best of 3 (25-25-15)',
    matchRules: rules,
    capRule: 'Win by 2 (Uncapped)',
    workTeamRequired: true,
    maxTeams: maxTeams,
  };

  const defaultLocation: Location = {
    id: `loc-${timestamp}-main`,
    name: 'Main Sports Complex',
    address: '100 Sports Way, Metro City',
    subLocations: [
      { id: `sub-${timestamp}-c1`, locationId: `loc-${timestamp}-main`, name: 'Court 1', surface: 'Hardwood' },
      { id: `sub-${timestamp}-c2`, locationId: `loc-${timestamp}-main`, name: 'Court 2', surface: 'Hardwood' },
    ],
  };

  return {
    id: leagueId,
    name,
    sport,
    startDate,
    endDate,
    maxTeams,
    hasDivisions,
    matchRules: rules,
    locations: [defaultLocation],
    divisions: [defaultDivision],
    teams: [],
    matches: [],
  };
}

export function createSampleLeague(
  name: string,
  sport: SportType,
  startDate: string,
  endDate: string,
  maxTeams: number = 12,
  hasDivisions: boolean = true,
  matchRules?: MatchRules
): LeagueSeason {
  const leagueId = `league-${Date.now()}`;
  const timestamp = Date.now();
  const rules = matchRules || DEFAULT_MATCH_RULES;

  let divisions: Division[] = [];
  let locations: Location[] = [];

  if (!hasDivisions) {
    // Single Unified Division League - Completely fills all maxTeams into 1 division
    divisions = [
      {
        id: `div-${timestamp}-single`,
        name: 'Main Division',
        genderCategory: 'Co-Ed',
        netHeight: "Co-Ed (2.43m)",
        setFormat: 'Best of 3 (25-25-15)',
        minFemalesOnCourt: 2,
        capRule: 'Win by 2 (Uncapped)',
        workTeamRequired: true,
        maxTeams: maxTeams,
      },
    ];
  } else if (sport === 'Beach Volleyball') {
    const divCap = Math.ceil(maxTeams / 2);
    divisions = [
      {
        id: `div-${timestamp}-b1`,
        name: 'Beach Co-Ed 4s Open',
        genderCategory: 'Co-Ed',
        netHeight: "Co-Ed (2.43m)",
        setFormat: 'Best of 3 (25-25-15)',
        minFemalesOnCourt: 1,
        capRule: 'Win by 2 (Uncapped)',
        workTeamRequired: true,
        maxTeams: divCap,
      },
      {
        id: `div-${timestamp}-b2`,
        name: "Beach Men's 2s",
        genderCategory: 'Men',
        netHeight: "Men's (2.43m)",
        setFormat: 'Best of 3 (25-25-15)',
        capRule: 'Win by 2 (Uncapped)',
        workTeamRequired: true,
        maxTeams: Math.max(2, maxTeams - divCap),
      },
    ];
  } else if (sport === 'Basketball') {
    const divCap = Math.ceil(maxTeams / 2);
    divisions = [
      {
        id: `div-${timestamp}-bk1`,
        name: "Men's Competitive 5v5",
        genderCategory: 'Men',
        netHeight: "Men's (2.43m)",
        setFormat: '2 Sets Timed (21-21)',
        capRule: 'Cap at 25/15',
        workTeamRequired: true,
        maxTeams: divCap,
      },
      {
        id: `div-${timestamp}-bk2`,
        name: 'Co-Ed Rec 5v5',
        genderCategory: 'Co-Ed',
        netHeight: "Co-Ed (2.43m)",
        setFormat: '2 Sets Timed (21-21)',
        minFemalesOnCourt: 2,
        capRule: 'Cap at 25/15',
        workTeamRequired: true,
        maxTeams: Math.max(2, maxTeams - divCap),
      },
    ];
  } else if (sport === 'Soccer') {
    const divCap = Math.ceil(maxTeams / 2);
    divisions = [
      {
        id: `div-${timestamp}-sc1`,
        name: 'Co-Ed 7v7 Premier',
        genderCategory: 'Co-Ed',
        netHeight: "Co-Ed (2.43m)",
        setFormat: '2 Sets Timed (21-21)',
        minFemalesOnCourt: 2,
        capRule: 'Win by 2 (Uncapped)',
        workTeamRequired: false,
        maxTeams: divCap,
      },
      {
        id: `div-${timestamp}-sc2`,
        name: "Men's 7v7 Open",
        genderCategory: 'Men',
        netHeight: "Men's (2.43m)",
        setFormat: '2 Sets Timed (21-21)',
        capRule: 'Win by 2 (Uncapped)',
        workTeamRequired: false,
        maxTeams: Math.max(2, maxTeams - divCap),
      },
    ];
  } else {
    // Default: Indoor Volleyball Multi-Division
    const divCap = Math.ceil(maxTeams / 2);
    divisions = [
      {
        id: `div-${timestamp}-v1`,
        name: 'Co-Ed 6s Competitive A',
        genderCategory: 'Co-Ed',
        netHeight: "Co-Ed (2.43m)",
        setFormat: 'Best of 3 (25-25-15)',
        minFemalesOnCourt: 2,
        capRule: 'Win by 2 (Uncapped)',
        workTeamRequired: true,
        maxTeams: divCap,
      },
      {
        id: `div-${timestamp}-v2`,
        name: "Men's Open",
        genderCategory: 'Men',
        netHeight: "Men's (2.43m)",
        setFormat: 'Best of 3 (25-25-15)',
        capRule: 'Win by 2 (Uncapped)',
        workTeamRequired: true,
        maxTeams: Math.max(2, maxTeams - divCap),
      },
    ];
  }

  // Locations by Sport
  if (sport === 'Beach Volleyball') {
    locations = [
      {
        id: `loc-${timestamp}-beach`,
        name: 'Sunside Beach Arena',
        address: '500 Boardwalk Drive, Metro City',
        parkingInfo: 'Free public parking in Lot B',
        subLocations: [
          { id: `sub-${timestamp}-b1`, locationId: `loc-${timestamp}-beach`, name: 'Sand Court 1', surface: 'Beach Sand' },
          { id: `sub-${timestamp}-b2`, locationId: `loc-${timestamp}-beach`, name: 'Sand Court 2', surface: 'Beach Sand' },
          { id: `sub-${timestamp}-b3`, locationId: `loc-${timestamp}-beach`, name: 'Sand Court 3', surface: 'Beach Sand' },
          { id: `sub-${timestamp}-b4`, locationId: `loc-${timestamp}-beach`, name: 'Sand Court 4', surface: 'Beach Sand' },
        ],
      },
    ];
  } else if (sport === 'Basketball') {
    locations = [
      {
        id: `loc-${timestamp}-metro`,
        name: 'Metro Athletics Center',
        address: '220 Hoops Boulevard, Metro City',
        parkingInfo: 'Main garage level 1',
        subLocations: [
          { id: `sub-${timestamp}-bkc1`, locationId: `loc-${timestamp}-metro`, name: 'Main Court A', surface: 'Hardwood' },
          { id: `sub-${timestamp}-bkc2`, locationId: `loc-${timestamp}-metro`, name: 'East Court B', surface: 'Hardwood' },
          { id: `sub-${timestamp}-bkc3`, locationId: `loc-${timestamp}-metro`, name: 'West Court C', surface: 'Hardwood' },
        ],
      },
    ];
  } else if (sport === 'Soccer') {
    locations = [
      {
        id: `loc-${timestamp}-turf`,
        name: 'Community Turf Complex',
        address: '88 Soccer Way, Metro City',
        parkingInfo: 'Park in Field Lot A',
        subLocations: [
          { id: `sub-${timestamp}-sc1`, locationId: `loc-${timestamp}-turf`, name: 'Turf Field 1', surface: 'Turf' },
          { id: `sub-${timestamp}-sc2`, locationId: `loc-${timestamp}-turf`, name: 'Turf Field 2', surface: 'Turf' },
        ],
      },
    ];
  } else {
    locations = [
      {
        id: `loc-${timestamp}-gym`,
        name: 'Central Gymnasium',
        address: '450 University Ave, Metro City',
        parkingInfo: 'Park near Main Athletics Gate',
        subLocations: [
          { id: `sub-${timestamp}-g1`, locationId: `loc-${timestamp}-gym`, name: 'North Court 1', surface: 'Hardwood' },
          { id: `sub-${timestamp}-g2`, locationId: `loc-${timestamp}-gym`, name: 'South Court 2', surface: 'Hardwood' },
          { id: `sub-${timestamp}-g3`, locationId: `loc-${timestamp}-gym`, name: 'East Court 3', surface: 'Hardwood' },
        ],
      },
    ];
  }

  // Large Pool of Team Names per Sport to Fill Any Division Capacity (4 to 32 Teams)
  const teamNamePools: Record<string, string[]> = {
    Volleyball: [
      'Apex Spikers', 'Net Ninjas', 'Block & Roll', 'Ace Attackers',
      'Spike Force', 'Net Crashers', 'Sky Jumpers', 'Thunder Block',
      'Dig Dynasty', 'Spiked Punch', 'Net Results', 'Serves Up',
      'Monster Blockers', 'Set To Kill', 'Bump Pass Spike', 'Volley Llamas',
      'Ball Busters', 'High Flyers', 'Court Jesters', 'Hard Hits',
      'Sideout Squad', 'Over the Net', 'Power Setters', 'Match Point Crew',
      'Floor Burners', 'Net Assets', 'Fast Breakouts', 'Gold Medalists',
      'Attack Angle', 'Spike-ology', 'Set It & Forget It', 'The Spike Girls',
    ],
    'Beach Volleyball': [
      'Sand Stormers', 'Sunset Volleys', 'Coastal Crushers', 'Tidal Waves',
      'Dune Diggers', 'Beach Bums', 'Sun Setters', 'Sandy Aces',
      'Palm Spikers', 'Shoreline Slammers', 'Ocean Blocks', 'Sunburn Squad',
      'Beach Breakers', 'High Tide Volleys', 'Wave Riders', 'Sandbar Setters',
    ],
    Basketball: [
      'Ballers FC', 'Rim Rockers', 'City Hoopers', 'Triple Threat',
      'Alley-Oops', 'Fast Breakers', 'Full Court Press', 'Swish Squad',
      'Net Rippers', 'Downtown Shooters', 'Ankle Breakers', 'Paint Protectors',
      'Coast to Coast', 'Slam Dunkers', 'Brick House', 'Half Court Heroes',
    ],
    Soccer: [
      'Metro Strikers', 'Apex FC', 'Golden Boots', 'Turf Titans',
      'City FC', 'United Kickers', 'Dynamo Strikers', 'Premier XI',
      'Goal Diggers', 'Corner Kicks', 'Clean Sheets', 'Pitch Masters',
      'Red Card Crew', 'Offside Trap', 'Free Kick Squad', 'Total Footballers',
    ],
  };

  const colors = [
    '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4',
    '#ef4444', '#14b8a6', '#6366f1', '#a855f7', '#d97706', '#059669',
  ];

  const teams: Team[] = [];
  const matches: Match[] = [];
  const allSubLocs = locations.flatMap((l) => l.subLocations);

  divisions.forEach((division, divIndex) => {
    const targetCount = division.maxTeams || 8;
    const pool = teamNamePools[sport] || teamNamePools['Volleyball'];

    const divTeams: Team[] = [];
    for (let i = 0; i < targetCount; i++) {
      const nameIndex = (divIndex * 16 + i) % pool.length;
      const tName = pool[nameIndex] || `Team ${i + 1}`;
      const teamId = `team-${timestamp}-d${divIndex}-${i + 1}`;

      const newTeam: Team = {
        id: teamId,
        divisionId: division.id,
        name: tName,
        captainName: `Captain ${tName.split(' ')[0]}`,
        captainEmail: `captain.${divIndex * 16 + i + 1}@example.com`,
        captainPhone: `(555) 10${divIndex}-${i + 1}00`,
        badgeColor: colors[(divIndex * 8 + i) % colors.length],
        roster: [
          {
            id: `p-${timestamp}-d${divIndex}-${i}-1`,
            name: `Player 1 (${tName})`,
            position: 'Setter',
            gender: i % 2 === 0 ? 'F' : 'M',
            isCaptain: true,
            rsvpStatus: 'Going',
          },
          {
            id: `p-${timestamp}-d${divIndex}-${i}-2`,
            name: `Player 2 (${tName})`,
            position: 'Outside Hitter',
            gender: i % 2 === 0 ? 'M' : 'F',
            isCaptain: false,
            rsvpStatus: 'Going',
          },
        ],
      };
      divTeams.push(newTeam);
    }
  });

  return {
    id: leagueId,
    name,
    sport,
    startDate,
    endDate,
    maxTeams,
    hasDivisions,
    matchRules: rules,
    locations,
    divisions,
    teams,
    matches,
  };
}
