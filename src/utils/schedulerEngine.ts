import { Match, Team, Court, DayOfWeek, AdvancedScheduleOptions, SubLocation } from '@/types/league';

export interface ScheduleGeneratorOptions {
  divisionId: string;
  teams: Team[];
  courts: Court[];
  startDate: string; // YYYY-MM-DD
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
  const playingDates = generateValidDates(startDate, weeksCount, daysOfWeek, blackoutDates);
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

  let currentRoundPool = [...pool];

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

  // Process schedule week by week
  for (let week = 1; week <= weeksCount; week++) {
    const roundIndex = (week - 1) % roundsCount;
    const dateStr = playingDates[week - 1] || addDaysToDate(startDate, (week - 1) * 7);
    
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
            weekNumber: week,
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
          incrementMapCount(headToHeadCounts.get(pairing.home)!, pairing.away);
          incrementMapCount(headToHeadCounts.get(pairing.away)!, pairing.home);

          teamGameCounts.set(pairing.home, (teamGameCounts.get(pairing.home) || 0) + 1);
          teamGameCounts.set(pairing.away, (teamGameCounts.get(pairing.away) || 0) + 1);
        }
      }
    }

    if (scheduledPairs.size < roundPairings.length) {
      warnings.push(`Week ${week}: Not enough courts/time-slots to schedule all ${roundPairings.length} matches.`);
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
              const slotOccupied = matches.some(
                (m) => m.date === dateStr && m.startTime === slotStart && m.courtId === court.id
              );

              if (!slotOccupied) {
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
                  opponentId = otherUnscheduled[0];
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
                    // Pick opponent with lowest H2H count
                    let minH2H = Infinity;
                    let bestOpp = eligibleOpponents[0];
                    for (const cand of eligibleOpponents) {
                      const h2h = headToHeadCounts.get(uTeam)?.get(cand) || 0;
                      if (h2h < minH2H) {
                        minH2H = h2h;
                        bestOpp = cand;
                      }
                    }
                    opponentId = bestOpp;
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
                    weekNumber: week,
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
                  incrementMapCount(headToHeadCounts.get(home)!, away);
                  incrementMapCount(headToHeadCounts.get(away)!, home);
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
          // Check if this slot already has a match scheduled
          const slotOccupied = matches.some(
            (m) => m.date === dateStr && m.startTime === slotStart && m.courtId === court.id
          );

          if (!slotOccupied) {
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
              let minH2H = Infinity;
              let minGamesSum = Infinity;

              for (let i = 0; i < eligibleCandidates.length; i++) {
                for (let j = i + 1; j < eligibleCandidates.length; j++) {
                  const c1 = eligibleCandidates[i];
                  const c2 = eligibleCandidates[j];

                  const h2h = headToHeadCounts.get(c1)?.get(c2) || 0;
                  const gamesSum = (teamGameCounts.get(c1) || 0) + (teamGameCounts.get(c2) || 0);

                  if (h2h < minH2H || (h2h === minH2H && gamesSum < minGamesSum)) {
                    minH2H = h2h;
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
                  weekNumber: week,
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
                incrementMapCount(headToHeadCounts.get(home)!, away);
                incrementMapCount(headToHeadCounts.get(away)!, home);

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
  const totalSlotsAvailable = playingDates.length * effectiveTimeSlots.length * courts.length;
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

// Generates valid dates based on selected days of week and skips blackout dates
function generateValidDates(
  startDateStr: string,
  count: number,
  daysOfWeek: DayOfWeek[],
  blackoutDates: string[]
): string[] {
  const result: string[] = [];
  const blackoutSet = new Set(blackoutDates);
  const targetDayIndices = new Set(daysOfWeek.map((d) => DAY_INDEX_MAP[d]));

  let current = new Date(startDateStr + 'T00:00:00');
  
  while (result.length < count) {
    const dayOfWeek = current.getDay();
    const isoDate = current.toISOString().split('T')[0];

    if (targetDayIndices.has(dayOfWeek) && !blackoutSet.has(isoDate)) {
      result.push(isoDate);
    }
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function incrementMapCount(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) || 0) + 1);
}

function assignRefereesToMatches(matches: Match[], allTeamIds: string[]) {
  const timeSlots = new Map<string, Match[]>();

  matches.forEach((m) => {
    const key = `${m.date}_${m.startTime}`;
    const list = timeSlots.get(key) || [];
    list.push(m);
    timeSlots.set(key, list);
  });

  const timeSlotKeys = Array.from(timeSlots.keys()).sort();

  timeSlotKeys.forEach((key) => {
    const slotMatches = timeSlots.get(key) || [];
    const playingTeams = new Set<string>();
    
    slotMatches.forEach((m) => {
      playingTeams.add(m.homeTeamId);
      playingTeams.add(m.awayTeamId);
    });

    const availableRefs = allTeamIds.filter((tId) => !playingTeams.has(tId));
    let refIdx = 0;

    slotMatches.forEach((m) => {
      if (availableRefs.length > 0) {
        m.workTeamId = availableRefs[refIdx % availableRefs.length];
        refIdx++;
      }
    });
  });
}

function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
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
