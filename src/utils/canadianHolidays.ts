export interface CanadianHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  isStatutory: boolean;
  provinces: string; // e.g. "National", "ON, AB, BC, SK", "QC", etc.
  description?: string;
}

export type CanadianProvince =
  | 'ALL'
  | 'ON'
  | 'BC'
  | 'AB'
  | 'QC'
  | 'SK'
  | 'MB'
  | 'NS'
  | 'NB'
  | 'PE'
  | 'NL';

export const PROVINCE_OPTIONS: { code: CanadianProvince; label: string }[] = [
  { code: 'ALL', label: 'All Canada / Federal & Provincial' },
  { code: 'ON', label: 'Ontario (ON)' },
  { code: 'BC', label: 'British Columbia (BC)' },
  { code: 'AB', label: 'Alberta (AB)' },
  { code: 'QC', label: 'Quebec (QC)' },
  { code: 'SK', label: 'Saskatchewan (SK)' },
  { code: 'MB', label: 'Manitoba (MB)' },
  { code: 'NS', label: 'Nova Scotia (NS)' },
  { code: 'NB', label: 'New Brunswick (NB)' },
  { code: 'PE', label: 'Prince Edward Island (PE)' },
  { code: 'NL', label: 'Newfoundland & Labrador (NL)' },
];

/**
 * Calculates Easter Sunday for a given year using Meeus/Jones/Butcher algorithm.
 */
export function getEasterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/**
 * Returns Nth weekday of a specific month.
 * @param year e.g. 2026
 * @param month 1-12
 * @param dayOfWeek 0 = Sun, 1 = Mon, ..., 6 = Sat
 * @param nth 1 for 1st, 2 for 2nd, 3 for 3rd, etc.
 */
function getNthWeekdayOfMonth(year: number, month: number, dayOfWeek: number, nth: number): Date {
  const date = new Date(Date.UTC(year, month - 1, 1));
  let count = 0;
  while (date.getUTCMonth() === month - 1) {
    if (date.getUTCDay() === dayOfWeek) {
      count++;
      if (count === nth) {
        return new Date(date);
      }
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date;
}

function formatDate(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Computes all statutory & major Canadian holidays for a given year.
 */
export function getCanadianHolidaysForYear(year: number): CanadianHoliday[] {
  const holidays: CanadianHoliday[] = [];

  // New Year's Day (Jan 1)
  const newYears = new Date(Date.UTC(year, 0, 1));
  if (newYears.getUTCDay() === 0) {
    holidays.push({
      date: formatDate(new Date(Date.UTC(year, 0, 2))),
      name: "New Year's Day (Observed)",
      isStatutory: true,
      provinces: 'National',
    });
  } else {
    holidays.push({
      date: formatDate(newYears),
      name: "New Year's Day",
      isStatutory: true,
      provinces: 'National',
    });
  }

  // Family Day (3rd Monday in February) - ON, AB, BC, SK, NB, MB (Louis Riel), PE (Islander), NS (Heritage)
  const familyDay = getNthWeekdayOfMonth(year, 2, 1, 3);
  holidays.push({
    date: formatDate(familyDay),
    name: 'Family Day / Louis Riel / Heritage Day',
    isStatutory: true,
    provinces: 'ON, AB, BC, SK, NB, MB, PE, NS',
  });

  // Easter (Good Friday & Easter Monday)
  const { month: eMonth, day: eDay } = getEasterSunday(year);
  const easterSunday = new Date(Date.UTC(year, eMonth - 1, eDay));

  const goodFriday = new Date(easterSunday);
  goodFriday.setUTCDate(goodFriday.getUTCDate() - 2);
  holidays.push({
    date: formatDate(goodFriday),
    name: 'Good Friday',
    isStatutory: true,
    provinces: 'National',
  });

  const easterMonday = new Date(easterSunday);
  easterMonday.setUTCDate(easterMonday.getUTCDate() + 1);
  holidays.push({
    date: formatDate(easterMonday),
    name: 'Easter Monday',
    isStatutory: false,
    provinces: 'Federal, QC',
  });

  // Victoria Day (Monday on or preceding May 24)
  const may24 = new Date(Date.UTC(year, 4, 24));
  const dayOfWeek24 = may24.getUTCDay();
  const offset = (dayOfWeek24 + 6) % 7; // days back to Monday
  const victoriaDay = new Date(may24);
  victoriaDay.setUTCDate(victoriaDay.getUTCDate() - offset);
  holidays.push({
    date: formatDate(victoriaDay),
    name: 'Victoria Day / Patriotes Day',
    isStatutory: true,
    provinces: 'National (except NS, NB, NL optional)',
  });

  // St. Jean Baptiste Day (June 24)
  holidays.push({
    date: formatDate(new Date(Date.UTC(year, 5, 24))),
    name: 'Fête Nationale (St. Jean Baptiste)',
    isStatutory: true,
    provinces: 'QC',
  });

  // Canada Day (July 1; observed July 2 if July 1 is Sunday)
  const canadaDay = new Date(Date.UTC(year, 6, 1));
  if (canadaDay.getUTCDay() === 0) {
    holidays.push({
      date: formatDate(new Date(Date.UTC(year, 6, 2))),
      name: 'Canada Day (Observed)',
      isStatutory: true,
      provinces: 'National',
    });
  } else {
    holidays.push({
      date: formatDate(canadaDay),
      name: 'Canada Day',
      isStatutory: true,
      provinces: 'National',
    });
  }

  // Civic Holiday / August Long Weekend (1st Monday in August)
  const civicHoliday = getNthWeekdayOfMonth(year, 8, 1, 1);
  holidays.push({
    date: formatDate(civicHoliday),
    name: 'Civic Holiday / August Long Weekend',
    isStatutory: true,
    provinces: 'ON, AB, BC, SK, NB, NT, NU',
  });

  // Labour Day (1st Monday in September)
  const labourDay = getNthWeekdayOfMonth(year, 9, 1, 1);
  holidays.push({
    date: formatDate(labourDay),
    name: 'Labour Day',
    isStatutory: true,
    provinces: 'National',
  });

  // National Day for Truth and Reconciliation (September 30)
  holidays.push({
    date: formatDate(new Date(Date.UTC(year, 8, 30))),
    name: 'National Day for Truth and Reconciliation',
    isStatutory: true,
    provinces: 'Federal, BC, MB, PE, YT, NT, NU',
  });

  // Thanksgiving Day (2nd Monday in October)
  const thanksgiving = getNthWeekdayOfMonth(year, 10, 1, 2);
  holidays.push({
    date: formatDate(thanksgiving),
    name: 'Thanksgiving Day',
    isStatutory: true,
    provinces: 'National (except NB, NS, PE, NL optional)',
  });

  // Remembrance Day (November 11)
  holidays.push({
    date: formatDate(new Date(Date.UTC(year, 10, 11))),
    name: 'Remembrance Day',
    isStatutory: true,
    provinces: 'National (except ON, QC optional)',
  });

  // Christmas Day (December 25)
  holidays.push({
    date: formatDate(new Date(Date.UTC(year, 11, 25))),
    name: 'Christmas Day',
    isStatutory: true,
    provinces: 'National',
  });

  // Boxing Day (December 26)
  holidays.push({
    date: formatDate(new Date(Date.UTC(year, 11, 26))),
    name: 'Boxing Day',
    isStatutory: true,
    provinces: 'ON, Federal',
  });

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Returns Canadian Holidays that fall between startDate and endDate (inclusive).
 * Supports province filtering.
 */
export function getCanadianHolidaysForDateRange(
  startDateStr: string,
  endDateStr: string,
  province: CanadianProvince = 'ALL'
): CanadianHoliday[] {
  if (!startDateStr || !endDateStr) return [];

  const start = new Date(startDateStr + 'T00:00:00Z');
  const end = new Date(endDateStr + 'T23:59:59Z');

  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();

  let allHolidays: CanadianHoliday[] = [];
  for (let year = startYear; year <= endYear; year++) {
    allHolidays = allHolidays.concat(getCanadianHolidaysForYear(year));
  }

  return allHolidays.filter((h) => {
    const hDate = new Date(h.date + 'T12:00:00Z');
    const inRange = hDate >= start && hDate <= end;
    if (!inRange) return false;

    if (province === 'ALL') return true;
    return (
      h.provinces.includes('National') ||
      h.provinces.includes('Federal') ||
      h.provinces.includes(province)
    );
  });
}

/**
 * Helper to calculate season end date string given start date and total weeks count.
 */
export function calculateSeasonEndDate(startDateStr: string, weeksCount: number): string {
  if (!startDateStr) return '';
  const date = new Date(startDateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + (weeksCount - 1) * 7 + 6);
  return formatDate(date);
}

/**
 * Checks if a date (YYYY-MM-DD) falls on a specific day of week string ('Monday', 'Tuesday', etc.)
 */
export function getDayOfWeekName(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateStr + 'T12:00:00Z');
  return days[d.getUTCDay()];
}
