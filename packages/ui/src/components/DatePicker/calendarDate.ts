/**
 * Calendar arithmetic on `YYYY-MM-DD` strings, which is what `DatePicker` speaks in and which sort
 * correctly as text. A date here is a day on a calendar, not an instant, so every calculation runs
 * on UTC fields, where no day is ever 23 or 25 hours long and no midnight is ever skipped, and
 * `Intl.DateTimeFormat` formats it back with `timeZone: 'UTC'`. The one place the local zone
 * belongs is `todayIn`, because "today" is the user's. `toISOString` appears nowhere: on a local
 * `Date` it is the classic way to shift a value by a day.
 */

const DAY_IN_MILLISECONDS = 86_400_000;
const EARLIEST_DATE = '0000-01-01';
const LATEST_DATE = '9999-12-31';

function toInstant(date: string): Date {
  const instant = new Date(0);
  // Not `Date.UTC`, which reads the years 0 to 99 as 1900 to 1999.
  instant.setUTCFullYear(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
  );
  return instant;
}

function formatFields(year: number, month: number, day: number): string {
  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

function fromInstant(instant: Date): string {
  const year = instant.getUTCFullYear();
  if (year < 0) {
    return EARLIEST_DATE;
  }
  if (year > 9999) {
    return LATEST_DATE;
  }
  return formatFields(year, instant.getUTCMonth() + 1, instant.getUTCDate());
}

/** The date if `value` names a real one, else `null`: `2026-02-30`, `''` and `'soon'` do not. */
export function parseIsoDate(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  return fromInstant(toInstant(value)) === value ? value : null;
}

/** The date on the user's own calendar at `now`. */
export function todayIn(now: Date): string {
  return formatFields(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addDays(date: string, amount: number): string {
  return fromInstant(new Date(toInstant(date).getTime() + amount * DAY_IN_MILLISECONDS));
}

export function firstOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function lastOfMonth(date: string): string {
  const instant = toInstant(firstOfMonth(date));
  instant.setUTCMonth(instant.getUTCMonth() + 1);
  return addDays(fromInstant(instant), -1);
}

/** Moves whole months, and lands on the last day when the target month is too short. */
export function addMonths(date: string, amount: number): string {
  const instant = toInstant(firstOfMonth(date));
  instant.setUTCMonth(instant.getUTCMonth() + amount);
  const first = fromInstant(instant);
  const lastDay = Number(lastOfMonth(first).slice(8, 10));
  const day = Math.min(Number(date.slice(8, 10)), lastDay);
  return `${first.slice(0, 7)}-${String(day).padStart(2, '0')}`;
}

/** 0 is Sunday, as `Date` and the prop have it. */
export function weekdayOf(date: string): number {
  return toInstant(date).getUTCDay();
}

export function startOfWeek(date: string, weekStartsOn: number): string {
  return addDays(date, -((weekdayOf(date) - weekStartsOn + 7) % 7));
}

export function endOfWeek(date: string, weekStartsOn: number): string {
  return addDays(startOfWeek(date, weekStartsOn), 6);
}

/** The month holding `date` as rows of seven, with `null` for the cells outside the month. */
export function weeksOfMonth(date: string, weekStartsOn: number): (string | null)[][] {
  const first = firstOfMonth(date);
  const last = lastOfMonth(date);
  const weeks: (string | null)[][] = [];
  for (
    let weekStart = startOfWeek(first, weekStartsOn);
    weekStart <= last;
    weekStart = addDays(weekStart, 7)
  ) {
    weeks.push(
      Array.from({ length: 7 }, (_unused, offset) => {
        const day = addDays(weekStart, offset);
        return day >= first && day <= last ? day : null;
      }),
    );
  }
  return weeks;
}

/** A `DateTimeFormat` for calendar dates. Keep it the only way a date here becomes text. */
export function dateFormatter(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): { format: (date: string) => string } {
  const formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
  return { format: (date) => formatter.format(toInstant(date)) };
}

/** The locale if the platform can read it, else `undefined`: `''` and `en_US` would throw. */
export function usableLocale(locale: string | undefined): string | undefined {
  try {
    return locale === undefined ? undefined : Intl.getCanonicalLocales(locale)[0];
  } catch {
    return undefined;
  }
}

const RIGHT_TO_LEFT_SCRIPTS = new Set([
  'Adlm',
  'Arab',
  'Hebr',
  'Mand',
  'Nkoo',
  'Rohg',
  'Syrc',
  'Thaa',
]);

/** Worked out from the script because `Intl.Locale`'s own text info is not in every browser. */
export function directionOf(locale: string): 'ltr' | 'rtl' {
  const script = new Intl.Locale(locale).maximize().script ?? '';
  return RIGHT_TO_LEFT_SCRIPTS.has(script) ? 'rtl' : 'ltr';
}

interface LocaleWithWeekInfo extends Intl.Locale {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
}

/** The locale's first day of the week where the platform knows it, 0 to 6; else Sunday. */
export function weekStartOf(locale: string | undefined): number {
  const resolved = locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
  const details = new Intl.Locale(resolved) as LocaleWithWeekInfo;
  // The platform counts Monday to Sunday as 1 to 7.
  return (details.getWeekInfo?.().firstDay ?? details.weekInfo?.firstDay ?? 0) % 7;
}
