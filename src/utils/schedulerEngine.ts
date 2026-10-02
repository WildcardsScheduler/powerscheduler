import { Match, Team, Court, DayOfWeek, SubLocation } from '@/types/league';

export interface ScheduleGeneratorOptions {
  divisionId: string;
  teams: Team[];
  courts: Court[];
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (inclusive). When set, every valid date in the range is scheduled and weeksCount is ignored.
  occupiedSlots?: string[]; // Court bookings to avoid (e.g. other divisions), keyed with slotKey(date, startTime, courtId)
  unavailableCourtTimes?: string[]; // Court times that can't be used on a given night, keyed with courtTimeKey(courtId, day, startTime)
  startTime?: string; // e.g. "18:30" (legacy fallback)
  matchDurationMinutes: number; // 60
  timeSlotsPerNight?: number; // legacy fallback
  weeksCount: number; // e.g. 6
  assignWorkTeams: boolean;

  // Advanced Options & Priorities
  daysOfWeek?: DayOfWeek[];
  timeSlots?: string[]; // Custom time slots e.g. ["18:30", "19:30", "20:30"]
  blackoutDates?: string[]; // YYYY-MM-DD
  enableDoubleHeaders?: boolean;
  doubleHeaderMode?: 'back_to_back' | 'spaced';
  fillAllTimeslots?: boolean; // Fill 100% available slots via double headers
  guaranteeWeeklyPlay?: boolean; // Guarantee every team plays each league night (no bye / sit-out weeks)
  markDoubleHeadersAsExhibition?: boolean; // Flag extra double-header capacity filler games as Exhibition
  spaceOutOpponents?: boolean;
  ensureEqualGames?: boolean;
  fairnessTimeSlots?: boolean;
  fairnessCourts?: boolean;
}

export interface TeamFairnessMetric {
  teamId: string;
  teamName: string;
  totalGames: number;
  homeGames?: number;
  awayGames?: number;
  officialGames: number;
  exhibitionGames: number;
  doubleHeaderCount: number;
  timeSlotCounts: Record<string, number>; // exact count for each time slot e.g. { "18:30": 4, "19:30": 4, "20:30": 4 }
  courtCounts: Record<string, number>;
  refDutyCount: number;
}

export interface ScheduleFairnessReport {
  totalSlotsAvailable: number;
  totalSlotsFilled: number;
  slotUtilizationPercentage: number;
  totalMatches: number;
  officialMatchesCount: number;
  doubleHeaderMatchesCount: number;
  exhibitionMatchesCount: number;
  effectiveTimeSlots: string[]; // List of slot strings like ["18:30", "19:30", "20:30"]
  teamMetrics: TeamFairnessMetric[];
  opponentMatrix: Record<string, Record<string, number>>; // Total matchups (official + exhibition)
  officialOpponentMatrix?: Record<string, Record<string, number>>; // Official Standings matchups only
  exhibitionOpponentMatrix?: Record<string, Record<string, number>>; // Exhibition matchups only
}

export interface GeneratedScheduleResult {
  matches: Match[];
  warnings: string[];
  report: ScheduleFairnessReport;
}

const DAY_INDEX_MAP: Record<DayOfWeek, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * Advanced League Scheduler Engine with Fairness Balancing, Opponent Spacing,
 * Blackout Dates, Double Header Rules, and Equal Games Equalization.
 */
export function generateVolleyballSchedule(options: ScheduleGeneratorOptions): GeneratedScheduleResult {
  const {
    divisionId,
    teams,
    courts,
    startDate,
    endDate,
    occupiedSlots = [],
    unavailableCourtTimes = [],
    startTime = '18:30',
    matchDurationMinutes = 60,
    timeSlotsPerNight = 3,
    weeksCount,
    assignWorkTeams,
    daysOfWeek = ['Tuesday'],
    timeSlots: customTimeSlots,
    blackoutDates = [],
    enableDoubleHeaders = false,
    doubleHeaderMode = 'back_to_back',
    fillAllTimeslots = true,
    guaranteeWeeklyPlay = true,
    markDoubleHeadersAsExhibition = true,
    spaceOutOpponents = true,
    ensureEqualGames = true,
    fairnessTimeSlots = true,
    fairnessCourts = true,
  } = options;

  const emptyReport: ScheduleFairnessReport = {
    totalSlotsAvailable: 0,
    totalSlotsFilled: 0,
    slotUtilizationPercentage: 0,
    totalMatches: 0,
    officialMatchesCount: 0,
    doubleHeaderMatchesCount: 0,
    exhibitionMatchesCount: 0,
    effectiveTimeSlots: [],
    teamMetrics: [],
    opponentMatrix: {},
  };

  const warnings: string[] = [];
  const matches: Match[] = [];

  if (teams.length < 2) {
    warnings.push('Need at least 2 teams to generate a schedule.');
    return { matches: [], warnings, report: emptyReport };
  }

  if (courts.length === 0) {
    warnings.push('At least one court is required.');
    return { matches: [], warnings, report: emptyReport };
  }

  // Derive Effective Time Slots
  let effectiveTimeSlots: string[] = [];
  if (customTimeSlots && customTimeSlots.length > 0) {
    effectiveTimeSlots = customTimeSlots;
  } else {
    for (let slot = 0; slot < timeSlotsPerNight; slot++) {
      effectiveTimeSlots.push(addMinutesToTimeString(startTime, slot * matchDurationMinutes));
    }
  }

  // Generate Available Playing Dates (excluding blackout dates and matching days of week)
  const playingDates = generateValidDates(startDate, weeksCount, daysOfWeek, blackoutDates, endDate);
  if (playingDates.length === 0) {
    warnings.push('No playing dates fall between the start and end date on the selected days.');
    return { matches: [], warnings, report: emptyReport };
  }
  if (blackoutDates.length > 0) {
    warnings.push(`Blackout dates active: ${blackoutDates.length} holiday/unavailable date(s) skipped.`);
  }

  // Berger Tables Round Robin Generator
  const teamIds = teams.map((t) => t.id);
  const isOdd = teamIds.length % 2 !== 0;
  const dummyTeam = 'BYE';
  
  const pool = isOdd ? [...teamIds, dummyTeam] : [...teamIds];
  const numTeams = pool.length;
  const roundsCount = numTeams - 1;

  // Court/time bookings made by other divisions on the same courts
  const occupied = new Set(occupiedSlots);
  // Court times switched off for a given night of the week (e.g. Court 2 has no 8:30 slot on Tuesdays)
  const unavailable = new Set(unavailableCourtTimes);
  const isCourtOpen = (date: string, slotStart: string, courtId: string) =>
    !unavailable.has(courtTimeKey(courtId, dayOfWeekOf(date), slotStart));
  const isCourtFree = (date: string, slotStart: string, courtId: string) =>
    isCourtOpen(date, slotStart, courtId) &&
    !occupied.has(slotKey(date, slotStart, courtId)) &&
    !matches.some((m) => m.date === date && m.startTime === slotStart && m.courtId === courtId);

  // Tracking Matrix for Fairness Algorithms
  const timeSlotUsage = new Map<string, Map<string, number>>(); // teamId -> (slot -> count)
  const courtUsage = new Map<string, Map<string, number>>(); // teamId -> (courtId -> count)
  const teamGameCounts = new Map<string, number>(); // teamId -> total games
  const homeGameUsage = new Map<string, number>(); // teamId -> total home games played so far
  const headToHeadCounts = new Map<string, Map<string, number>>(); // teamId -> (opponentId -> count)

  teamIds.forEach((id1) => {
    timeSlotUsage.set(id1, new Map());
    courtUsage.set(id1, new Map());
    teamGameCounts.set(id1, 0);
    homeGameUsage.set(id1, 0);
    headToHeadCounts.set(id1, new Map());
    teamIds.forEach((id2) => {
      headToHeadCounts.get(id1)!.set(id2, 0);
    });
  });

  let matchIdCounter = 1;

  // League nights in the same calendar week share a week number
  const weekNumberByDate = buildWeekNumbers(playingDates);

  // "Space out opponents": remember the night index each pair last met, and steer
  // extra games (double headers, slot fills, weekly-play guarantees) away from recent rematches.
  const lastMetNight = new Map<string, number>();
  const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const SPACING_WINDOW = 3; // nights
  let night = 1;
  const recencyPenalty = (a: string, b: string) => {
    if (!spaceOutOpponents) return 0;
    const last = lastMetNight.get(pairKey(a, b));
    return last === undefined ? 0 : Math.max(0, SPACING_WINDOW - (night - last));
  };
  // Lower is better: balance head-to-head counts first; a same-night rematch outweighs one extra meeting
  const opponentScore = (a: string, b: string) =>
    (headToHeadCounts.get(a)?.get(b) || 0) * 10 + recencyPenalty(a, b) * 4;
  const recordMeeting = (home: string, away: string) => {
    incrementMapCount(headToHeadCounts.get(home)!, away);
    incrementMapCount(headToHeadCounts.get(away)!, home);
    lastMetNight.set(pairKey(home, away), night);
  };

  // Process schedule week by week
  for (let week = 1; week <= playingDates.length; week++) {
    night = week;
    const roundIndex = (week - 1) % roundsCount;
    const dateStr = playingDates[week - 1];
    const weekNumber = weekNumberByDate.get(dateStr) || week;
    
    // Pure Berger Table Rotation for this round
    const currentRoundPool = getBergerPoolForRound(pool, roundIndex);
    const roundPairings: { home: string; away: string }[] = [];

    for (let i = 0; i < numTeams / 2; i++) {
      const t1 = currentRoundPool[i];
      const t2 = currentRoundPool[numTeams - 1 - i];

      if (t1 !== dummyTeam && t2 !== dummyTeam) {
        // Dynamic Home/Away Balancing:
        // Give Home to whichever team currently has fewer home games played.
        // If tied, alternate based on round index to ensure exact 50/50 balance.
        const h1 = homeGameUsage.get(t1) || 0;
        const h2 = homeGameUsage.get(t2) || 0;
        let home: string;
        let away: string;

        if (h1 < h2) {
          home = t1;
          away = t2;
        } else if (h2 < h1) {
          home = t2;
          away = t1;
        } else {
          // Tie-break alternating
          if ((i + roundIndex) % 2 === 0) {
            home = t1;
            away = t2;
          } else {
            home = t2;
            away = t1;
          }
        }

        roundPairings.push({ home, away });
      }
    }

    // Schedule pairings into court & time slot grid with Fairness Optimization
    const scheduledPairs = new Set<number>();
    
    for (let slotIdx = 0; slotIdx < effectiveTimeSlots.length; slotIdx++) {
      const slotStart = effectiveTimeSlots[slotIdx];
      const slotEnd = addMinutesToTimeString(slotStart, matchDurationMinutes);

      for (const court of courts) {
        if (!isCourtFree(dateStr, slotStart, court.id)) continue;

        // Find best pairing for this (court, timeSlot) based on fairness scoring
        let bestPairingIdx = -1;
        let bestScore = Infinity;

        for (let pIdx = 0; pIdx < roundPairings.length; pIdx++) {
          if (scheduledPairs.has(pIdx)) continue;

          const p = roundPairings[pIdx];

          // Calculate Fairness Score (lower is fairer)
          let score = 0;

          if (fairnessTimeSlots) {
            const hSlotCount = timeSlotUsage.get(p.home)?.get(slotStart) || 0;
            const aSlotCount = timeSlotUsage.get(p.away)?.get(slotStart) || 0;
            score += (hSlotCount + aSlotCount) * 10;
          }

          if (fairnessCourts) {
            const hCourtCount = courtUsage.get(p.home)?.get(court.id) || 0;
            const aCourtCount = courtUsage.get(p.away)?.get(court.id) || 0;
            score += (hCourtCount + aCourtCount) * 5;
          }

          if (score < bestScore) {
            bestScore = score;
            bestPairingIdx = pIdx;
          }
        }

        if (bestPairingIdx !== -1) {
          const pairing = roundPairings[bestPairingIdx];
          scheduledPairs.add(bestPairingIdx);

          const newMatch: Match = {
            id: `gen-${divisionId}-w${week}-m${matchIdCounter++}`,
            divisionId,
            weekNumber,
            date: dateStr,
            startTime: slotStart,
            endTime: slotEnd,
            locationId: court.locationId,
            subLocationId: court.id,
            courtId: court.id,
            homeTeamId: pairing.home,
            awayTeamId: pairing.away,
            status: 'Scheduled',
            scores: [],
          };

          matches.push(newMatch);

          // Update fairness matrices
          incrementMapCount(homeGameUsage, pairing.home);
          incrementMapCount(timeSlotUsage.get(pairing.home)!, slotStart);
          incrementMapCount(timeSlotUsage.get(pairing.away)!, slotStart);
          incrementMapCount(courtUsage.get(pairing.home)!, court.id);
          incrementMapCount(courtUsage.get(pairing.away)!, court.id);
          recordMeeting(pairing.home, pairing.away);

          teamGameCounts.set(pairing.home, (teamGameCounts.get(pairing.home) || 0) + 1);
          teamGameCounts.set(pairing.away, (teamGameCounts.get(pairing.away) || 0) + 1);
        }
      }
    }

    if (scheduledPairs.size < roundPairings.length) {
      warnings.push(`Week ${weekNumber} (${dateStr}): Not enough courts/time-slots to schedule all ${roundPairings.length} matches.`);
    }

    // Guarantee Every Team Plays Each League Night (No Bye / Sit-Out Weeks)
    if (guaranteeWeeklyPlay) {
      const dateMatches = matches.filter((m) => m.date === dateStr);
      const teamsPlayingToday = new Set<string>();
      dateMatches.forEach((m) => {
        teamsPlayingToday.add(m.homeTeamId);
        teamsPlayingToday.add(m.awayTeamId);
      });

      const unscheduledTeams = teamIds.filter((id) => !teamsPlayingToday.has(id));

      if (unscheduledTeams.length > 0) {
        for (let uIdx = 0; uIdx < unscheduledTeams.length; uIdx++) {
          const uTeam = unscheduledTeams[uIdx];
          if (matches.some((m) => m.date === dateStr && (m.homeTeamId === uTeam || m.awayTeamId === uTeam))) {
            continue;
          }

          let placed = false;
          for (let slotIdx = 0; slotIdx < effectiveTimeSlots.length && !placed; slotIdx++) {
            const slotStart = effectiveTimeSlots[slotIdx];
            const slotEnd = addMinutesToTimeString(slotStart, matchDurationMinutes);

            for (const court of courts) {
              if (isCourtFree(dateStr, slotStart, court.id)) {
                const currentNightMatches = matches.filter((m) => m.date === dateStr);
                const teamsBusyInSlot = new Set<string>();
                currentNightMatches
                  .filter((m) => m.startTime === slotStart)
                  .forEach((m) => {
                    teamsBusyInSlot.add(m.homeTeamId);
                    teamsBusyInSlot.add(m.awayTeamId);
                  });

                // Candidates for opponent: other unscheduled teams first, or eligible playing teams for a double header
                const otherUnscheduled = unscheduledTeams.filter(
                  (otherId) =>
                    otherId !== uTeam &&
                    !matches.some((m) => m.date === dateStr && (m.homeTeamId === otherId || m.awayTeamId === otherId)) &&
                    !teamsBusyInSlot.has(otherId)
                );

                let opponentId: string | null = null;
                if (otherUnscheduled.length > 0) {
                  opponentId = otherUnscheduled.reduce((best, cand) =>
                    opponentScore(uTeam, cand) < opponentScore(uTeam, best) ? cand : best
                  );
                } else {
                  // Find eligible double-header team
                  const eligibleOpponents = teamIds.filter((id) => {
                    if (id === uTeam || teamsBusyInSlot.has(id)) return false;
                    return isTeamEligibleForSlotOnDate(
                      id,
                      slotIdx,
                      currentNightMatches,
                      effectiveTimeSlots,
                      doubleHeaderMode
                    );
                  });

                  if (eligibleOpponents.length > 0) {
                    // Pick the opponent faced least (and least recently)
                    opponentId = eligibleOpponents.reduce((best, cand) =>
                      opponentScore(uTeam, cand) < opponentScore(uTeam, best) ? cand : best
                    );
                  }
                }

                if (opponentId) {
                  const h1 = homeGameUsage.get(uTeam) || 0;
                  const h2 = homeGameUsage.get(opponentId) || 0;
                  const home = h1 <= h2 ? uTeam : opponentId;
                  const away = h1 <= h2 ? opponentId : uTeam;

                  const weeklyMatch: Match = {
                    id: `gen-${divisionId}-w${week}-m${matchIdCounter++}`,
                    divisionId,
                    weekNumber,
                    date: dateStr,
                    startTime: slotStart,
                    endTime: slotEnd,
                    locationId: court.locationId,
                    subLocationId: court.id,
                    courtId: court.id,
                    homeTeamId: home,
                    awayTeamId: away,
                    status: 'Scheduled',
                    scores: [],
                    notes: otherUnscheduled.includes(opponentId) ? undefined : 'Weekly Play Guarantee (Double Header)',
                  };

                  matches.push(weeklyMatch);
                  incrementMapCount(homeGameUsage, home);
                  incrementMapCount(timeSlotUsage.get(home)!, slotStart);
                  incrementMapCount(timeSlotUsage.get(away)!, slotStart);
                  incrementMapCount(courtUsage.get(home)!, court.id);
                  incrementMapCount(courtUsage.get(away)!, court.id);
                  recordMeeting(home, away);
                  teamGameCounts.set(home, (teamGameCounts.get(home) || 0) + 1);
                  teamGameCounts.set(away, (teamGameCounts.get(away) || 0) + 1);

                  placed = true;
                  break;
                }
              }
            }
          }
        }
      }
    }

    // Optional "Fill All Timeslots" algorithm for full capacity utilization via Double Headers
    if (fillAllTimeslots || enableDoubleHeaders) {
      for (let slotIdx = 0; slotIdx < effectiveTimeSlots.length; slotIdx++) {
        const slotStart = effectiveTimeSlots[slotIdx];
        const slotEnd = addMinutesToTimeString(slotStart, matchDurationMinutes);

        for (const court of courts) {
          // Skip slots already used by this schedule or another division
          if (isCourtFree(dateStr, slotStart, court.id)) {
            const dateMatches = matches.filter((m) => m.date === dateStr);

            // Find teams already playing in this specific time slot on this night
            const teamsBusyInSlot = new Set<string>();
            dateMatches
              .filter((m) => m.startTime === slotStart)
              .forEach((m) => {
                teamsBusyInSlot.add(m.homeTeamId);
                teamsBusyInSlot.add(m.awayTeamId);
              });

            // Filter candidate teams based on eligibility & strict back-to-back rules
            const eligibleCandidates = teamIds.filter((id) => {
              if (teamsBusyInSlot.has(id)) return false;

              return isTeamEligibleForSlotOnDate(
                id,
                slotIdx,
                dateMatches,
                effectiveTimeSlots,
                doubleHeaderMode
              );
            });

            if (eligibleCandidates.length >= 2) {
              // Find candidate pair with LOWEST head-to-head count (and lowest games sum)
              let bestPair: { home: string; away: string } | null = null;
              let bestPairScore = Infinity;
              let minGamesSum = Infinity;

              for (let i = 0; i < eligibleCandidates.length; i++) {
                for (let j = i + 1; j < eligibleCandidates.length; j++) {
                  const c1 = eligibleCandidates[i];
                  const c2 = eligibleCandidates[j];

                  const pairScore = opponentScore(c1, c2);
                  const gamesSum = (teamGameCounts.get(c1) || 0) + (teamGameCounts.get(c2) || 0);

                  if (pairScore < bestPairScore || (pairScore === bestPairScore && gamesSum < minGamesSum)) {
                    bestPairScore = pairScore;
                    minGamesSum = gamesSum;
                    bestPair = { home: c1, away: c2 };
                  }
                }
              }

              if (bestPair) {
                const h1HomeCount = matches.filter((m) => m.homeTeamId === bestPair.home).length;
                const h2HomeCount = matches.filter((m) => m.homeTeamId === bestPair.away).length;
                const home = h1HomeCount <= h2HomeCount ? bestPair.home : bestPair.away;
                const away = h1HomeCount <= h2HomeCount ? bestPair.away : bestPair.home;

                const fillMatch: Match = {
                  id: `gen-${divisionId}-w${week}-m${matchIdCounter++}`,
                  divisionId,
                  weekNumber,
                  date: dateStr,
                  startTime: slotStart,
                  endTime: slotEnd,
                  locationId: court.locationId,
                  subLocationId: court.id,
                  courtId: court.id,
                  homeTeamId: home,
                  awayTeamId: away,
                  status: 'Scheduled',
                  scores: [],
                  isExhibition: false,
                  notes: 'Double Header (Slot Fill)',
                };

                matches.push(fillMatch);

                // Update fairness matrices
                incrementMapCount(homeGameUsage, home);
                incrementMapCount(timeSlotUsage.get(home)!, slotStart);
                incrementMapCount(timeSlotUsage.get(away)!, slotStart);
                incrementMapCount(courtUsage.get(home)!, court.id);
                incrementMapCount(courtUsage.get(away)!, court.id);
                recordMeeting(home, away);

                teamGameCounts.set(home, (teamGameCounts.get(home) || 0) + 1);
                teamGameCounts.set(away, (teamGameCounts.get(away) || 0) + 1);
              }
            }
          }
        }
      }
    }
  }

  // Post-Processing: Equalize Official Standings Matches & Flag Extra Games as Exhibition
  if (ensureEqualGames || markDoubleHeadersAsExhibition) {
    // 1. Calculate each team's total scheduled games count
    const teamTotalCounts = new Map<string, number>();
    teamIds.forEach((id) => teamTotalCounts.set(id, 0));
    matches.forEach((m) => {
      teamTotalCounts.set(m.homeTeamId, (teamTotalCounts.get(m.homeTeamId) || 0) + 1);
      teamTotalCounts.set(m.awayTeamId, (teamTotalCounts.get(m.awayTeamId) || 0) + 1);
    });

    const minTotalGames = Math.min(...Array.from(teamTotalCounts.values()));

    // 2. Find maximum integer K <= minTotalGames such that EVERY team gets EXACTLY K official games
    let bestK = 0;
    let bestOfficialSet = new Set<string>();

    for (let testK = minTotalGames; testK >= 1; testK--) {
      const teamOfficialCount = new Map<string, number>();
      teamIds.forEach((id) => teamOfficialCount.set(id, 0));
      const currentOfficialMatches = new Set<string>();

      // Prioritize regular season matches over slot fills / double headers
      const sortedMatches = [...matches].sort((a, b) => {
        const aIsFill = a.notes?.includes('Slot Fill') || a.notes?.includes('Double Header') ? 1 : 0;
        const bIsFill = b.notes?.includes('Slot Fill') || b.notes?.includes('Double Header') ? 1 : 0;
        if (aIsFill !== bIsFill) return aIsFill - bIsFill;
        return a.weekNumber - b.weekNumber;
      });

      for (const m of sortedMatches) {
        const hCount = teamOfficialCount.get(m.homeTeamId) || 0;
        const aCount = teamOfficialCount.get(m.awayTeamId) || 0;

        // ONLY mark as official if BOTH teams still need an official game to reach testK
        if (hCount < testK && aCount < testK) {
          teamOfficialCount.set(m.homeTeamId, hCount + 1);
          teamOfficialCount.set(m.awayTeamId, aCount + 1);
          currentOfficialMatches.add(m.id);
        }
      }

      // Check if ALL teams reached EXACTLY testK official games
      const allReached = teamIds.every((id) => (teamOfficialCount.get(id) || 0) === testK);
      if (allReached) {
        bestK = testK;
        bestOfficialSet = currentOfficialMatches;
        break;
      }
    }

    // Apply the official vs exhibition designation
    if (bestK > 0) {
      matches.forEach((m) => {
        if (bestOfficialSet.has(m.id)) {
          m.isExhibition = false;
        } else {
          m.isExhibition = true;
          if (!m.notes || !m.notes.includes('Exhibition')) {
            m.notes = m.notes ? `${m.notes} (Exhibition)` : 'Exhibition Match (Non-Standings)';
          }
        }
      });
    }
  }

  // Assign Referee Work Teams if enabled
  if (assignWorkTeams) {
    assignRefereesToMatches(matches, teamIds);
  }

  // Compile Comprehensive Schedule Fairness & Completeness Report
  // Capacity counts only court times that are open and not booked by another division
  let totalSlotsAvailable = 0;
  playingDates.forEach((d) =>
    effectiveTimeSlots.forEach((t) =>
      courts.forEach((c) => {
        if (isCourtOpen(d, t, c.id) && !occupied.has(slotKey(d, t, c.id))) totalSlotsAvailable++;
      })
    )
  );
  const totalSlotsFilled = matches.length;
  const slotUtilizationPercentage =
    totalSlotsAvailable > 0 ? Math.round((totalSlotsFilled / totalSlotsAvailable) * 100) : 100;

  // Track double headers per date
  const dateTeamMatchCounts = new Map<string, Map<string, number>>();
  const teamDoubleHeaderCounts = new Map<string, number>();
  teamIds.forEach((id) => teamDoubleHeaderCounts.set(id, 0));

  matches.forEach((m) => {
    if (!dateTeamMatchCounts.has(m.date)) {
      dateTeamMatchCounts.set(m.date, new Map());
    }
    const map = dateTeamMatchCounts.get(m.date)!;
    map.set(m.homeTeamId, (map.get(m.homeTeamId) || 0) + 1);
    map.set(m.awayTeamId, (map.get(m.awayTeamId) || 0) + 1);
  });

  dateTeamMatchCounts.forEach((map) => {
    map.forEach((cnt, tId) => {
      if (cnt > 1) {
        teamDoubleHeaderCounts.set(tId, (teamDoubleHeaderCounts.get(tId) || 0) + 1);
      }
    });
  });

  let doubleHeaderMatchesCount = 0;
  let exhibitionMatchesCount = 0;
  let officialMatchesCount = 0;
  matches.forEach((m) => {
    if (m.notes?.includes('Double Header') || m.notes?.includes('Exhibition')) doubleHeaderMatchesCount++;
    if (m.isExhibition) exhibitionMatchesCount++;
    else officialMatchesCount++;
  });

  // Calculate Head-to-Head Opponent Matrix (Total, Official Standings, and Exhibition)
  const opponentMatrix: Record<string, Record<string, number>> = {};
  const officialOpponentMatrix: Record<string, Record<string, number>> = {};
  const exhibitionOpponentMatrix: Record<string, Record<string, number>> = {};

  teamIds.forEach((t1) => {
    opponentMatrix[t1] = {};
    officialOpponentMatrix[t1] = {};
    exhibitionOpponentMatrix[t1] = {};
    teamIds.forEach((t2) => {
      opponentMatrix[t1][t2] = 0;
      officialOpponentMatrix[t1][t2] = 0;
      exhibitionOpponentMatrix[t1][t2] = 0;
    });
  });

  matches.forEach((m) => {
    if (opponentMatrix[m.homeTeamId] && opponentMatrix[m.homeTeamId][m.awayTeamId] !== undefined) {
      opponentMatrix[m.homeTeamId][m.awayTeamId]++;
      if (m.isExhibition) {
        exhibitionOpponentMatrix[m.homeTeamId][m.awayTeamId]++;
      } else {
        officialOpponentMatrix[m.homeTeamId][m.awayTeamId]++;
      }
    }
    if (opponentMatrix[m.awayTeamId] && opponentMatrix[m.awayTeamId][m.homeTeamId] !== undefined) {
      opponentMatrix[m.awayTeamId][m.homeTeamId]++;
      if (m.isExhibition) {
        exhibitionOpponentMatrix[m.awayTeamId][m.homeTeamId]++;
      } else {
        officialOpponentMatrix[m.awayTeamId][m.homeTeamId]++;
      }
    }
  });

  // Calculate Per-Team Metrics with exact time slot breakdown
  const teamMetrics: TeamFairnessMetric[] = teams.map((t) => {
    const tMatches = matches.filter((m) => m.homeTeamId === t.id || m.awayTeamId === t.id);
    const officialGames = tMatches.filter((m) => !m.isExhibition).length;
    const exhibitionGames = tMatches.filter((m) => m.isExhibition).length;

    const timeSlotCounts: Record<string, number> = {};
    effectiveTimeSlots.forEach((slot) => {
      timeSlotCounts[slot] = 0;
    });

    const courtCounts: Record<string, number> = {};
    courts.forEach((c) => {
      courtCounts[c.id] = 0;
    });

    let refDutyCount = 0;
    matches.forEach((m) => {
      if (m.workTeamId === t.id) {
        refDutyCount++;
      }
    });

    tMatches.forEach((m) => {
      if (m.startTime) {
        timeSlotCounts[m.startTime] = (timeSlotCounts[m.startTime] || 0) + 1;
      }
      if (m.courtId) {
        courtCounts[m.courtId] = (courtCounts[m.courtId] || 0) + 1;
      }
    });

    return {
      teamId: t.id,
      teamName: t.name,
      totalGames: tMatches.length,
      officialGames,
      exhibitionGames,
      doubleHeaderCount: teamDoubleHeaderCounts.get(t.id) || 0,
      timeSlotCounts,
      courtCounts,
      refDutyCount,
    };
  });

  const report: ScheduleFairnessReport = {
    totalSlotsAvailable,
    totalSlotsFilled,
    slotUtilizationPercentage,
    totalMatches: matches.length,
    officialMatchesCount,
    doubleHeaderMatchesCount,
    exhibitionMatchesCount,
    effectiveTimeSlots,
    teamMetrics,
    opponentMatrix,
    officialOpponentMatrix,
    exhibitionOpponentMatrix,
  };

  return { matches, warnings, report };
}

/**
 * Calculates a complete ScheduleFairnessReport for any set of matches and teams.
 * Can be called dynamically after manual schedule edits/swaps during the season.
 */
export function calculateScheduleFairnessReport(
  teams: Team[],
  matches: Match[],
  courts: SubLocation[] = [],
  knownTimeSlots?: string[]
): ScheduleFairnessReport {
  const teamIds = teams.map((t) => t.id);

  // Discover time slots from matches or passed slots
  const effectiveTimeSlots =
    knownTimeSlots && knownTimeSlots.length > 0
      ? knownTimeSlots
      : Array.from(new Set(matches.map((m) => m.startTime).filter(Boolean))).sort();

  const playingDates = Array.from(new Set(matches.map((m) => m.date).filter(Boolean)));
  const totalSlotsAvailable =
    playingDates.length *
    (effectiveTimeSlots.length || 1) *
    (courts.length || 1);
  const totalSlotsFilled = matches.length;
  const slotUtilizationPercentage =
    totalSlotsAvailable > 0 ? Math.round((totalSlotsFilled / totalSlotsAvailable) * 100) : 100;

  // Track double headers per date
  const dateTeamMatchCounts = new Map<string, Map<string, number>>();
  const teamDoubleHeaderCounts = new Map<string, number>();
  teamIds.forEach((id) => teamDoubleHeaderCounts.set(id, 0));

  matches.forEach((m) => {
    if (!m.date) return;
    if (!dateTeamMatchCounts.has(m.date)) {
      dateTeamMatchCounts.set(m.date, new Map());
    }
    const map = dateTeamMatchCounts.get(m.date)!;
    map.set(m.homeTeamId, (map.get(m.homeTeamId) || 0) + 1);
    map.set(m.awayTeamId, (map.get(m.awayTeamId) || 0) + 1);
  });

  dateTeamMatchCounts.forEach((map) => {
    map.forEach((cnt, tId) => {
      if (cnt > 1) {
        teamDoubleHeaderCounts.set(tId, (teamDoubleHeaderCounts.get(tId) || 0) + 1);
      }
    });
  });

  let doubleHeaderMatchesCount = 0;
  let exhibitionMatchesCount = 0;
  let officialMatchesCount = 0;
  matches.forEach((m) => {
    if (m.notes?.includes('Double Header') || m.notes?.includes('Exhibition')) doubleHeaderMatchesCount++;
    if (m.isExhibition) exhibitionMatchesCount++;
    else officialMatchesCount++;
  });

  // Calculate Head-to-Head Opponent Matrix (Total, Official Standings, and Exhibition)
  const opponentMatrix: Record<string, Record<string, number>> = {};
  const officialOpponentMatrix: Record<string, Record<string, number>> = {};
  const exhibitionOpponentMatrix: Record<string, Record<string, number>> = {};

  teamIds.forEach((t1) => {
    opponentMatrix[t1] = {};
    officialOpponentMatrix[t1] = {};
    exhibitionOpponentMatrix[t1] = {};
    teamIds.forEach((t2) => {
      opponentMatrix[t1][t2] = 0;
      officialOpponentMatrix[t1][t2] = 0;
      exhibitionOpponentMatrix[t1][t2] = 0;
    });
  });

  matches.forEach((m) => {
    if (opponentMatrix[m.homeTeamId] && opponentMatrix[m.homeTeamId][m.awayTeamId] !== undefined) {
      opponentMatrix[m.homeTeamId][m.awayTeamId]++;
      if (m.isExhibition) {
        exhibitionOpponentMatrix[m.homeTeamId][m.awayTeamId]++;
      } else {
        officialOpponentMatrix[m.homeTeamId][m.awayTeamId]++;
      }
    }
    if (opponentMatrix[m.awayTeamId] && opponentMatrix[m.awayTeamId][m.homeTeamId] !== undefined) {
      opponentMatrix[m.awayTeamId][m.homeTeamId]++;
      if (m.isExhibition) {
        exhibitionOpponentMatrix[m.awayTeamId][m.homeTeamId]++;
      } else {
        officialOpponentMatrix[m.awayTeamId][m.homeTeamId]++;
      }
    }
  });

  // Calculate Per-Team Metrics with exact time slot breakdown
  const teamMetrics: TeamFairnessMetric[] = teams.map((t) => {
    const tMatches = matches.filter((m) => m.homeTeamId === t.id || m.awayTeamId === t.id);
    const homeGames = matches.filter((m) => m.homeTeamId === t.id).length;
    const awayGames = matches.filter((m) => m.awayTeamId === t.id).length;
    const officialGames = tMatches.filter((m) => !m.isExhibition).length;
    const exhibitionGames = tMatches.filter((m) => m.isExhibition).length;

    const timeSlotCounts: Record<string, number> = {};
    effectiveTimeSlots.forEach((slot) => {
      timeSlotCounts[slot] = 0;
    });

    const courtCounts: Record<string, number> = {};
    courts.forEach((c) => {
      courtCounts[c.id] = 0;
    });

    let refDutyCount = 0;
    matches.forEach((m) => {
      if (m.workTeamId === t.id) {
        refDutyCount++;
      }
    });

    tMatches.forEach((m) => {
      if (m.startTime) {
        timeSlotCounts[m.startTime] = (timeSlotCounts[m.startTime] || 0) + 1;
      }
      const courtKey = m.subLocationId || m.courtId;
      if (courtKey) {
        courtCounts[courtKey] = (courtCounts[courtKey] || 0) + 1;
      }
    });

    return {
      teamId: t.id,
      teamName: t.name,
      totalGames: tMatches.length,
      homeGames,
      awayGames,
      officialGames,
      exhibitionGames,
      doubleHeaderCount: teamDoubleHeaderCounts.get(t.id) || 0,
      timeSlotCounts,
      courtCounts,
      refDutyCount,
    };
  });

  return {
    totalSlotsAvailable,
    totalSlotsFilled,
    slotUtilizationPercentage,
    totalMatches: matches.length,
    officialMatchesCount,
    doubleHeaderMatchesCount,
    exhibitionMatchesCount,
    effectiveTimeSlots,
    teamMetrics,
    opponentMatrix,
    officialOpponentMatrix,
    exhibitionOpponentMatrix,
  };
}

/** Key for a court time that is unavailable on a given night of the week. */
export function courtTimeKey(courtId: string, day: DayOfWeek, startTime: string): string {
  return `${courtId}|${day}|${startTime}`;
}

const DAY_NAMES: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function dayOfWeekOf(date: string): DayOfWeek {
  return DAY_NAMES[new Date(date + 'T00:00:00').getDay()];
}

export function slotKey(date: string, startTime: string, courtId: string): string {
  return `${date}|${startTime}|${courtId}`;
}

// Formats a Date as YYYY-MM-DD using local time (toISOString() would convert to UTC first)
export function toLocalIsoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Valid playing dates on the selected days of week, skipping blackout dates.
 * With an end date: every valid date from start to end (inclusive).
 * Without one: the first `count` valid dates.
 */
export function generateValidDates(
  startDateStr: string,
  count: number,
  daysOfWeek: DayOfWeek[],
  blackoutDates: string[],
  endDateStr?: string
): string[] {
  const result: string[] = [];
  const blackoutSet = new Set(blackoutDates);
  const targetDayIndices = new Set(daysOfWeek.map((d) => DAY_INDEX_MAP[d]));
  if (targetDayIndices.size === 0 || !startDateStr) return result;

  const current = new Date(startDateStr + 'T00:00:00');
  const end = endDateStr ? new Date(endDateStr + 'T00:00:00') : null;
  const MAX_DAYS = 3 * 366; // safety bound

  for (let i = 0; i < MAX_DAYS; i++) {
    if (end ? current > end : result.length >= count) break;
    const isoDate = toLocalIsoDate(current);
    if (targetDayIndices.has(current.getDay()) && !blackoutSet.has(isoDate)) {
      result.push(isoDate);
    }
    current.setDate(current.getDate() + 1);
  }

  return result;
}

/**
 * Week number for each playing date: nights in the same Monday-Sunday week share a number,
 * and weeks are numbered consecutively (a week with no games, e.g. a holiday, is skipped).
 */
export function buildWeekNumbers(playingDates: string[]): Map<string, number> {
  const weekKey = (date: string) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday
    return toLocalIsoDate(d);
  };
  const result = new Map<string, number>();
  let currentKey = '';
  let weekNumber = 0;
  [...playingDates].sort().forEach((date) => {
    const key = weekKey(date);
    if (key !== currentKey) {
      currentKey = key;
      weekNumber++;
    }
    result.set(date, weekNumber);
  });
  return result;
}

function incrementMapCount(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) || 0) + 1);
}

/**
 * Assigns a work (referee) team to every match. Preference order:
 *   1. a team playing in the slot directly before/after at the same location (already at the gym),
 *   2. a team playing elsewhere that night,
 *   3. a team not playing that night;
 * ties go to the team with the fewest ref duties so far, so duty is spread evenly.
 */
function assignRefereesToMatches(matches: Match[], allTeamIds: string[]) {
  const refCounts = new Map<string, number>(allTeamIds.map((id) => [id, 0]));

  const byDate = new Map<string, Match[]>();
  matches.forEach((m) => {
    const list = byDate.get(m.date) || [];
    list.push(m);
    byDate.set(m.date, list);
  });

  Array.from(byDate.keys())
    .sort()
    .forEach((date) => {
      const nightMatches = byDate.get(date)!;
      const nightSlots = Array.from(new Set(nightMatches.map((m) => m.startTime))).sort();

      nightSlots.forEach((slot, slotIdx) => {
        const slotMatches = nightMatches.filter((m) => m.startTime === slot);
        const busy = new Set<string>();
        slotMatches.forEach((m) => {
          busy.add(m.homeTeamId);
          busy.add(m.awayTeamId);
        });

        slotMatches.forEach((m) => {
          let bestTeam: string | undefined;
          let bestScore = Infinity;

          for (const teamId of allTeamIds) {
            if (busy.has(teamId)) continue;
            const teamGames = nightMatches.filter((x) => x.homeTeamId === teamId || x.awayTeamId === teamId);
            let tier = 2;
            if (teamGames.length > 0) {
              const adjacentSameVenue = teamGames.some(
                (x) =>
                  Math.abs(nightSlots.indexOf(x.startTime) - slotIdx) === 1 &&
                  (!m.locationId || !x.locationId || x.locationId === m.locationId)
              );
              tier = adjacentSameVenue ? 0 : 1;
            }
            const score = tier * 1000 + (refCounts.get(teamId) || 0);
            if (score < bestScore) {
              bestScore = score;
              bestTeam = teamId;
            }
          }

          if (bestTeam) {
            m.workTeamId = bestTeam;
            busy.add(bestTeam); // one court per work team per slot
            refCounts.set(bestTeam, (refCounts.get(bestTeam) || 0) + 1);
          }
        });
      });
    });
}

function addMinutesToTimeString(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// Helper to determine if a team can play in slotIdx on dateStr without violating back-to-back rules
function isTeamEligibleForSlotOnDate(
  teamId: string,
  slotIdx: number,
  dateMatches: Match[],
  effectiveTimeSlots: string[],
  doubleHeaderMode: 'back_to_back' | 'spaced' = 'back_to_back'
): boolean {
  const teamMatchesOnDate = dateMatches.filter(
    (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
  );

  // Maximum 2 matches per night for any team
  if (teamMatchesOnDate.length >= 2) return false;

  // If team has no matches on this date yet, they are free to play in any slot
  if (teamMatchesOnDate.length === 0) return true;

  // Team already has 1 match on this date
  const existingSlotIdxs = teamMatchesOnDate
    .map((m) => effectiveTimeSlots.indexOf(m.startTime))
    .filter((idx) => idx !== -1);

  if (doubleHeaderMode === 'back_to_back') {
    // Hard Rule: Must be directly consecutive / adjacent slot (diff === 1). No waiting between games!
    const isAdjacent = existingSlotIdxs.some(
      (exIdx) => Math.abs(slotIdx - exIdx) === 1
    );
    return isAdjacent;
  }

  if (doubleHeaderMode === 'spaced') {
    // Hard Rule: Must have at least 1 break slot between matches (diff > 1)
    const isSpaced = existingSlotIdxs.some(
      (exIdx) => Math.abs(slotIdx - exIdx) > 1
    );
    return isSpaced;
  }

  return true;
}

// Computes a clean, uncorrupted Berger table team pool for any round index
function getBergerPoolForRound(basePool: string[], roundIndex: number): string[] {
  if (roundIndex === 0) return [...basePool];
  const fixed = basePool[0];
  const rotating = basePool.slice(1);
  const shift = roundIndex % rotating.length;
  const rotated = [
    ...rotating.slice(rotating.length - shift),
    ...rotating.slice(0, rotating.length - shift),
  ];
  return [fixed, ...rotated];
}
