import { MatchRules } from '@/types/league';

export function formatMatchRulesDescription(
  matchRules?: MatchRules,
  fallbackSetFormat?: string
): string {
  if (!matchRules) {
    return fallbackSetFormat || 'Best of 3 (25-25-15)';
  }

  const { totalSets, pointsPerSet, pointsPerDecidingSet, thirdSetRule } = matchRules;

  if (thirdSetRule === 'play_if_tied') {
    if (totalSets <= 3) {
      return `2 Sets (${pointsPerSet}-${pointsPerSet}, 3rd set to ${pointsPerDecidingSet} if necessary)`;
    }
    return `Best of ${totalSets} (${pointsPerSet} pt sets, deciding to ${pointsPerDecidingSet} if tied)`;
  }

  if (thirdSetRule === 'guaranteed_all') {
    if (totalSets === 2) {
      return `2 Guaranteed Sets (${pointsPerSet}-${pointsPerSet})`;
    }
    if (totalSets === 3) {
      return `3 Guaranteed Sets (${pointsPerSet}-${pointsPerSet}-${pointsPerSet})`;
    }
    return `${totalSets} Guaranteed Sets (${pointsPerSet} pts)`;
  }

  if (thirdSetRule === 'timed_sets') {
    return `${totalSets} Sets Timed (${pointsPerSet}-${pointsPerSet})`;
  }

  return `Best of ${totalSets} (${pointsPerSet} pts)`;
}
