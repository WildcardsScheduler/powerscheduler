import { LeagueSeason } from '@/types/league';
import { toLocalIsoDate } from '@/utils/schedulerEngine';

/** Scores from a late game night often come in after midnight, so game day runs until this hour the next morning. */
export const GAME_DAY_ENDS_AT_HOUR = 3;

/**
 * True when any league has a game today (by the viewer's local date), or it's the early
 * morning after a game night. Used to keep live score refreshing on only when it's useful.
 */
export function isGameDay(leagues: LeagueSeason[], now: Date = new Date()): boolean {
  const today = toLocalIsoDate(now);
  const yesterday = toLocalIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const lateNight = now.getHours() < GAME_DAY_ENDS_AT_HOUR;
  return leagues.some((league) =>
    (league.matches || []).some((m) => m.date === today || (lateNight && m.date === yesterday))
  );
}
