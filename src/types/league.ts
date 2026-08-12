export type SportType = 'Volleyball' | 'Beach Volleyball' | 'Basketball' | 'Soccer';

export type NetHeight = "Men's (2.43m)" | "Women's (2.24m)" | "Co-Ed (2.43m)" | "Reverse Co-Ed (2.24m)";

export type SetFormat = 
  | 'Best of 3 (25-25-15)'
  | '3 Guaranteed Sets (25-25-25)'
  | '2 Sets Timed (21-21)';

export interface Division {
  id: string;
  name: string; // e.g. "Co-Ed 6s Competitive A", "Men's Open", "Women's B"
  genderCategory: 'Men' | 'Women' | 'Co-Ed' | 'Reverse Co-Ed';
  netHeight: NetHeight;
  setFormat: SetFormat;
  minFemalesOnCourt?: number;
  capRule: 'Win by 2 (Uncapped)' | 'Cap at 27/17' | 'Cap at 25/15';
  workTeamRequired: boolean;
  maxTeams: number;
}

export interface SubLocation {
  id: string;
  locationId: string;
  name: string; // e.g. "Court 1", "Court 2", "Main Gym", "Sand Court A"
  surface: 'Hardwood' | 'Sport Court' | 'Beach Sand' | 'Turf' | 'Grass';
  notes?: string;
}

// Alias for Court
export type Court = SubLocation;

export interface Location {
  id: string;
  name: string; // e.g. "Pioneer School", "Southside Fieldhouse"
  address: string;
  parkingInfo?: string;
  subLocations: SubLocation[];
}

// Alias for Facility
export type Facility = Location;

export interface Player {
  id: string;
  name: string;
  number?: string;
  position: 'Setter' | 'Outside Hitter' | 'Middle Blocker' | 'Opposite Hitter' | 'Libero' | 'Defensive Specialist' | 'Utility';
  gender: 'M' | 'F' | 'Other';
  isCaptain: boolean;
  rsvpStatus?: 'Going' | 'Maybe' | 'Out' | 'Pending';
}

export interface Team {
  id: string;
  divisionId: string;
  name: string;
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  badgeColor: string; // Hex color for jersey/badge representation
  roster: Player[];
  substitutes?: Player[];
}

export interface SetScore {
  setNumber: number;
  homeScore: number;
  awayScore: number;
}

export type MatchStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Postponed';

export interface Match {
  id: string;
  divisionId: string;
  weekNumber: number;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "18:30"
  endTime: string; // e.g. "19:30"
  locationId?: string;
  subLocationId: string; // Court ID / Sub-location ID
  homeTeamId: string;
  awayTeamId: string;
  workTeamId?: string; // Team assigned to officiate (Up-ref, score, lines)
  status: MatchStatus;
  scores: SetScore[];
  winnerId?: string;
  notes?: string;
  isExhibition?: boolean; // Flagged if extra game beyond official equal standings count

  // Backwards compatibility getter helper
  courtId?: string;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  badgeColor: string;
  played: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  setRatio: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  points: number;
  rank: number;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface AdvancedScheduleOptions {
  daysOfWeek: DayOfWeek[];
  timeSlots: string[]; // e.g. ["18:30", "19:30", "20:30"]
  blackoutDates: string[]; // YYYY-MM-DD strings
  enableDoubleHeaders: boolean;
  doubleHeaderMode: 'back_to_back' | 'spaced';
  spaceOutOpponents: boolean;
  ensureEqualGames: boolean;
  fairnessTimeSlots: boolean;
  fairnessCourts: boolean;
}

export interface LeagueSeason {
  id: string;
  name: string;
  sport: SportType;
  startDate: string;
  endDate: string;
  maxTeams?: number;
  hasDivisions?: boolean; // Single Division vs Multi-Division
  scheduleOptions?: AdvancedScheduleOptions;
  locations: Location[];
  facilities?: Location[]; // Alias
  divisions: Division[];
  teams: Team[];
  matches: Match[];
}
