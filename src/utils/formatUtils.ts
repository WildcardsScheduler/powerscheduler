/**
 * Utility functions for formatting time, dates, and strings across the application.
 */

/**
 * Converts a 24-hour time string (e.g. "18:30", "09:00", "20:00") or standard time string
 * into a 12-hour format with AM/PM (e.g. "6:30 PM", "9:00 AM", "8:00 PM").
 */
export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '';

  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  // If already formatted with AM/PM, return as-is
  if (/am|pm/i.test(trimmed)) {
    return trimmed;
  }

  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];

  if (isNaN(hours)) return trimmed;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }

  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Formats a time range from start and end time strings.
 * e.g. ("18:30", "19:30") -> "6:30 PM - 7:30 PM"
 */
export function formatTimeRange(startTime?: string | null, endTime?: string | null): string {
  if (!startTime && !endTime) return '';
  if (startTime && !endTime) return formatTime(startTime);
  if (!startTime && endTime) return formatTime(endTime);
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Formats a YYYY-MM-DD date as a short label, e.g. "Tue, Sep 15".
 */
export function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Minutes since midnight for a 24-hour "HH:MM" string, or null if unparseable. */
export function timeToMinutes(timeStr?: string | null): number | null {
  const match = timeStr?.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * True if two time ranges on the same day overlap. Back-to-back games
 * (one ends at 19:30, the next starts at 19:30) do not overlap.
 * A missing end time is treated as start + defaultDurationMinutes.
 */
export function timeRangesOverlap(
  aStart: string,
  aEnd: string | undefined,
  bStart: string,
  bEnd: string | undefined,
  defaultDurationMinutes = 60
): boolean {
  const as = timeToMinutes(aStart);
  const bs = timeToMinutes(bStart);
  if (as === null || bs === null) return aStart === bStart;
  let ae = timeToMinutes(aEnd) ?? as + defaultDurationMinutes;
  let be = timeToMinutes(bEnd) ?? bs + defaultDurationMinutes;
  if (ae <= as) ae = as + defaultDurationMinutes;
  if (be <= bs) be = bs + defaultDurationMinutes;
  return as < be && bs < ae;
}

/** The digits of a North American phone number, without a leading country code 1 (at most 10). */
export function phoneDigits(input?: string | null): string {
  let digits = (input || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/**
 * Formats typed or pasted phone input as "(403) 846-3953". Accepts raw digits,
 * dashes, dots, spaces or a +1 prefix. Partial numbers are formatted as far as
 * they go, so it can be applied on every keystroke.
 */
export function formatPhoneNumber(input?: string | null): string {
  const d = phoneDigits(input);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** True for an empty phone or a complete 10-digit number. */
export function isPhoneEmptyOrComplete(input?: string | null): boolean {
  const len = phoneDigits(input).length;
  return len === 0 || len === 10;
}
