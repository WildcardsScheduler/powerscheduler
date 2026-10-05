import { Match, SetScore } from '@/types/league';

/** League standard: a forfeit is recorded as a sweep for the team that showed up. */
export const FORFEIT_SETS = 2;
export const DEFAULT_FORFEIT_POINTS = 25;

/**
 * True when a game has a result that counts: played to completion, or won by forfeit.
 * Use this instead of checking for 'Completed' so forfeits count everywhere results do.
 */
export function isPlayedMatch(match: Pick<Match, 'status'>): boolean {
  return match.status === 'Completed' || match.status === 'Forfeit';
}

/** The forfeit score (25-0, 25-0 by default) in home/away order for the winning side. */
export function forfeitScores(winnerIsHome: boolean, pointsPerSet: number = DEFAULT_FORFEIT_POINTS): SetScore[] {
  return Array.from({ length: FORFEIT_SETS }, (_, i) => ({
    setNumber: i + 1,
    homeScore: winnerIsHome ? pointsPerSet : 0,
    awayScore: winnerIsHome ? 0 : pointsPerSet,
  }));
}
