import { LeagueSeason, Match, Team } from '@/types/league';

/** Team calendar files and helpers shared by the admin package (no browser APIs, so they can be tested). */

/** Keeps names safe for zip folders and file names on Windows, macOS and phones. */
export function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Team';
}

export function matchLocationName(league: LeagueSeason, match: Match): string {
  const subLocId = match.subLocationId || match.courtId;
  const primaryLoc = league.locations.find(
    (l) => l.id === match.locationId || l.subLocations.some((s) => s.id === subLocId)
  );
  const courtName = primaryLoc?.subLocations.find((s) => s.id === subLocId)?.name || 'Court';
  return primaryLoc?.name ? `${primaryLoc.name} (${courtName})` : courtName;
}

// ---------------------------------------------------------------------------
// Calendar (.ics)
// ---------------------------------------------------------------------------

const icsEscape = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const icsLocalDateTime = (date: string, time: string) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
// Lines longer than 75 characters must be folded (continuation lines start with a space)
const icsFold = (line: string) => line.match(/.{1,73}/g)?.join('\r\n ') ?? line;

/** Every game and referee duty for a team, as a calendar file captains can import on their phone. */
export function buildTeamCalendar(league: LeagueSeason, team: Team): string {
  const teamName = (id: string) => league.teams.find((t) => t.id === id)?.name || 'TBD';
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const events = league.matches
    .filter((m) => m.homeTeamId === team.id || m.awayTeamId === team.id || m.workTeamId === team.id)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .map((m) => {
      const isRef = m.homeTeamId !== team.id && m.awayTeamId !== team.id;
      const opponent = m.homeTeamId === team.id ? teamName(m.awayTeamId) : teamName(m.homeTeamId);
      const summary = isRef
        ? `Ref duty: ${teamName(m.homeTeamId)} vs ${teamName(m.awayTeamId)}`
        : `Volleyball: ${team.name} vs ${opponent}${m.isExhibition ? ' (exhibition)' : ''}`;
      const location = league.locations.find((l) => l.id === m.locationId);
      const where = [matchLocationName(league, m), location?.address].filter(Boolean).join(', ');
      const end = m.endTime || m.startTime;
      return [
        'BEGIN:VEVENT',
        `UID:${m.id}-${team.id}@schedule.rockywildcards.com`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${icsLocalDateTime(m.date, m.startTime)}`,
        `DTEND:${icsLocalDateTime(m.date, end)}`,
        `SUMMARY:${icsEscape(summary)}`,
        `LOCATION:${icsEscape(where)}`,
        `DESCRIPTION:${icsEscape(`Week ${m.weekNumber}. Latest schedule and scores: https://schedule.rockywildcards.com`)}`,
        'END:VEVENT',
      ];
    });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PowerSchedule//Team Schedule//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${icsEscape(`${team.name} - ${league.name}`)}`,
    ...events.flat(),
    'END:VCALENDAR',
  ]
    .map(icsFold)
    .join('\r\n');
}
