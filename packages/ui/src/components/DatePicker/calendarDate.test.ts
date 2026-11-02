import { afterEach, describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  dateFormatter,
  directionOf,
  endOfWeek,
  firstOfMonth,
  lastOfMonth,
  parseIsoDate,
  startOfWeek,
  todayIn,
  usableLocale,
  weekdayOf,
  weekStartOf,
  weeksOfMonth,
} from './calendarDate';

const originalZone = process.env.TZ;

/** A spread that crosses the date line both ways, half-hour offsets and midnight DST changes. */
const zones = [
  'UTC',
  'Pacific/Kiritimati', // +14
  'Pacific/Pago_Pago', // -11
  'Asia/Kolkata', // +5:30
  'America/New_York',
  'Europe/London',
  'America/Havana', // DST begins at midnight: that local midnight does not exist.
  'Asia/Beirut', // The same.
];

afterEach(() => {
  process.env.TZ = originalZone;
});

describe('parseIsoDate', () => {
  it.each(['2026-03-08', '2024-02-29', '0001-01-01', '9999-12-31', '0099-06-15'])(
    'takes %s',
    (date) => {
      expect(parseIsoDate(date)).toBe(date);
    },
  );

  it.each([
    '',
    'soon',
    '2026-02-29',
    '2026-02-30',
    '2026-13-01',
    '2026-00-10',
    '2026-1-1',
    '2026-01-01T00:00:00Z',
    ' 2026-01-01',
    null,
    undefined,
  ])('refuses %j', (value) => {
    expect(parseIsoDate(value)).toBeNull();
  });

  it('refuses a number from a JavaScript caller instead of throwing', () => {
    expect(parseIsoDate(20260101 as unknown as string)).toBeNull();
  });
});

describe('arithmetic', () => {
  it('crosses month and year ends', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('clamps at the month end, leap years included', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(addMonths('2026-05-31', 1)).toBe('2026-06-30');
    expect(addMonths('2024-02-29', 12)).toBe('2025-02-28');
    expect(addMonths('2024-02-29', 48)).toBe('2028-02-29');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
  });

  it('knows century leap years', () => {
    expect(lastOfMonth('2000-02-10')).toBe('2000-02-29');
    expect(lastOfMonth('1900-02-10')).toBe('1900-02-28');
  });

  it('stays at the ends of the representable range', () => {
    expect(addDays('9999-12-31', 1)).toBe('9999-12-31');
    expect(addDays('0000-01-01', -1)).toBe('0000-01-01');
    expect(addDays('0099-12-31', 1)).toBe('0100-01-01');
  });

  it('finds the first and last of a month', () => {
    expect(firstOfMonth('2026-07-19')).toBe('2026-07-01');
    expect(lastOfMonth('2026-07-19')).toBe('2026-07-31');
  });

  it('finds the week around a date from any first weekday', () => {
    // 2026-11-04 is a Wednesday.
    expect(weekdayOf('2026-11-04')).toBe(3);
    expect(startOfWeek('2026-11-04', 0)).toBe('2026-11-01');
    expect(endOfWeek('2026-11-04', 0)).toBe('2026-11-07');
    expect(startOfWeek('2026-11-04', 1)).toBe('2026-11-02');
    expect(endOfWeek('2026-11-04', 1)).toBe('2026-11-08');
    expect(startOfWeek('2026-11-04', 6)).toBe('2026-10-31');
    expect(startOfWeek('2026-11-04', 3)).toBe('2026-11-04');
  });

  it('lays a month out in rows of seven with blanks outside it', () => {
    const weeks = weeksOfMonth('2026-02-14', 1);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-02-01']);
    expect(weeks.at(-1)?.at(-1)).toBe(null);
    expect(weeks.flat().filter(Boolean)).toHaveLength(28);
  });
});

describe.each(zones)('in %s', (zone) => {
  it('is really running in that zone', () => {
    process.env.TZ = zone;
    const instant = new Date(Date.UTC(2026, 0, 15, 12));
    expect(instant.toLocaleString('en-US')).toBe(
      instant.toLocaleString('en-US', { timeZone: zone }),
    );
  });

  it('formats what it is given, on and around every clock change of the year', () => {
    process.env.TZ = zone;
    const formatter = dateFormatter('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    for (let day = '2026-01-01'; day <= '2026-12-31'; day = addDays(day, 1)) {
      expect(formatter.format(day)).toBe(day);
    }
  });

  it('counts each day once across the clock changes', () => {
    process.env.TZ = zone;
    let days = 0;
    for (let day = '2026-01-01'; day !== '2027-01-01'; day = addDays(day, 1)) {
      days += 1;
    }
    expect(days).toBe(365);
  });

  it('reads today from the local calendar, even where UTC has moved on', () => {
    process.env.TZ = zone;
    expect(todayIn(new Date(2026, 0, 31, 0, 30))).toBe('2026-01-31');
    expect(todayIn(new Date(2026, 0, 31, 23, 30))).toBe('2026-01-31');
    expect(todayIn(new Date(2026, 2, 8, 12))).toBe('2026-03-08');
  });
});

describe('locales', () => {
  it('reads direction from the script', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(directionOf('he-IL')).toBe('rtl');
    expect(directionOf('fa')).toBe('rtl');
    expect(directionOf('en-GB')).toBe('ltr');
    expect(directionOf('ja')).toBe('ltr');
    expect(directionOf('az-Arab')).toBe('rtl');
    expect(directionOf('az')).toBe('ltr');
  });

  it('turns a locale the platform refuses into none at all', () => {
    expect(usableLocale('en-GB')).toBe('en-GB');
    expect(usableLocale(undefined)).toBeUndefined();
    expect(usableLocale('')).toBeUndefined();
    expect(usableLocale('en_US')).toBeUndefined();
  });

  it('reads the first weekday from the locale, as 0 to 6', () => {
    expect(weekStartOf('en-US')).toBe(0);
    expect(weekStartOf('en-GB')).toBe(1);
    expect(weekStartOf('ar-EG')).toBe(6);
  });
});
