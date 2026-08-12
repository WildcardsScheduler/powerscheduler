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
