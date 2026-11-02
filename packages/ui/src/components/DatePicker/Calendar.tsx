import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { ChevronDownIcon } from '../../icons/ChevronDownIcon';
import { IconButton } from '../IconButton/IconButton';
import {
  addDays,
  addMonths,
  dateFormatter,
  endOfWeek,
  firstOfMonth,
  isDateUnavailable,
  lastOfMonth,
  startOfWeek,
  todayIn,
  weeksOfMonth,
} from './calendarDate';
import styles from './DatePicker.module.css';

export interface CalendarProps {
  gridRef: RefObject<HTMLTableElement | null>;
  chosen: string | null;
  min: string | null;
  max: string | null;
  isDateDisabled: ((date: string) => boolean) | undefined;
  locale: string | undefined;
  weekStartsOn: number;
  previousMonthLabel: string;
  nextMonthLabel: string;
  onSelect: (date: string) => void;
}

/** A Sunday, from which a week of weekday names can be counted. */
const A_SUNDAY = '2023-01-01';
/** How far to look for a date that can be chosen, before settling for one that cannot. */
const SEARCH_LIMIT_IN_DAYS = 800;

const monthOf = (date: string) => date.slice(0, 7);

/**
 * The month grid inside `DatePicker`'s dialog, mounted only while it is open. Internal.
 *
 * Roving focus, per the WAI-ARIA date picker dialog pattern: one date is the tab stop, the opening
 * focus and the origin of the arrow keys. Unavailable dates can be focused and read out, as the
 * pattern says, but not chosen; months wholly outside `min` and `max` cannot be reached at all.
 */
export function Calendar({
  gridRef,
  chosen,
  min,
  max,
  isDateDisabled,
  locale,
  weekStartsOn,
  previousMonthLabel,
  nextMonthLabel,
  onSelect,
}: CalendarProps) {
  const monthId = useId();
  const [today] = useState(() => todayIn(new Date()));
  const gridHasFocus = useRef(false);

  const isUnavailable = (date: string) => isDateUnavailable(date, { min, max, isDateDisabled });
  const isReachable = (date: string) =>
    (min === null || monthOf(date) >= monthOf(min)) &&
    (max === null || monthOf(date) <= monthOf(max));

  /** The first date from `start` that can be chosen, or `start` when none is near enough. */
  const firstAvailableFrom = (start: string) => {
    let candidate = start;
    for (let step = 0; step < SEARCH_LIMIT_IN_DAYS && isReachable(candidate); step += 1) {
      if (!isUnavailable(candidate)) {
        return candidate;
      }
      candidate = addDays(candidate, 1);
    }
    return start;
  };

  /** Where the tab stop rests when nothing has moved it: chosen, today, first available. */
  const restingDate = () => {
    if (chosen !== null && isReachable(chosen)) {
      return chosen;
    }
    if (!isUnavailable(today)) {
      return today;
    }
    if (min !== null && today < min) {
      return firstAvailableFrom(min);
    }
    if (max !== null && today > max) {
      const monthStart = firstOfMonth(max);
      return firstAvailableFrom(min !== null && min > monthStart ? min : monthStart);
    }
    return firstAvailableFrom(firstOfMonth(today));
  };

  /** The same order, within one month: where a month button leaves the tab stop. */
  const restingDateIn = (month: string) => {
    if (chosen !== null && monthOf(chosen) === monthOf(month) && !isUnavailable(chosen)) {
      return chosen;
    }
    if (monthOf(today) === monthOf(month) && !isUnavailable(today)) {
      return today;
    }
    const available = firstAvailableFrom(firstOfMonth(month));
    return monthOf(available) === monthOf(month) ? available : firstOfMonth(month);
  };

  const [movedDate, setMovedDate] = useState<string | null>(null);
  const [lastChosen, setLastChosen] = useState(chosen);
  if (chosen !== lastChosen) {
    // `value` changed while open: the grid goes to it, as it would have on opening.
    setLastChosen(chosen);
    setMovedDate(null);
  }
  // Worked out on each render, so narrowing `min` or `max` while open cannot strand the tab stop.
  const activeDate = movedDate !== null && isReachable(movedDate) ? movedDate : restingDate();

  useLayoutEffect(() => {
    // After a month change the focused cell no longer exists, and React fires no blur for it.
    if (gridHasFocus.current) {
      gridRef.current?.querySelector<HTMLElement>(`[data-date="${activeDate}"]`)?.focus();
    }
  }, [activeDate, gridRef]);

  const formatters = useMemo(
    () => ({
      month: dateFormatter(locale, { month: 'long', year: 'numeric' }),
      day: dateFormatter(locale, { day: 'numeric' }),
      fullDate: dateFormatter(locale, { dateStyle: 'full' }),
      shortWeekday: dateFormatter(locale, { weekday: 'short' }),
      longWeekday: dateFormatter(locale, { weekday: 'long' }),
    }),
    [locale],
  );

  const moveTo = (target: string) => {
    if (isReachable(target)) {
      setMovedDate(target);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const inRightToLeft = event.currentTarget.closest('[dir]')?.getAttribute('dir') === 'rtl';
    const monthStep = event.shiftKey ? 12 : 1;
    const targets: Record<string, () => string> = {
      ArrowLeft: () => addDays(activeDate, inRightToLeft ? 1 : -1),
      ArrowRight: () => addDays(activeDate, inRightToLeft ? -1 : 1),
      ArrowUp: () => addDays(activeDate, -7),
      ArrowDown: () => addDays(activeDate, 7),
      Home: () => startOfWeek(activeDate, weekStartsOn),
      End: () => endOfWeek(activeDate, weekStartsOn),
      PageUp: () => addMonths(activeDate, -monthStep),
      PageDown: () => addMonths(activeDate, monthStep),
    };
    const target = targets[event.key];
    if (target) {
      event.preventDefault();
      moveTo(target());
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isUnavailable(activeDate)) {
        onSelect(activeDate);
      }
    }
  };

  const hasPreviousMonth = isReachable(lastOfMonth(addMonths(firstOfMonth(activeDate), -1)));
  const hasNextMonth = isReachable(addMonths(firstOfMonth(activeDate), 1));

  return (
    <>
      <div className={styles.header}>
        {/* `aria-disabled`, not `disabled`: a button that disables itself under the user's press
            would drop focus out of the dialog. */}
        <IconButton
          className={styles.previous}
          size="sm"
          label={previousMonthLabel}
          aria-disabled={hasPreviousMonth ? undefined : true}
          onClick={() => {
            if (hasPreviousMonth) {
              setMovedDate(restingDateIn(addMonths(firstOfMonth(activeDate), -1)));
            }
          }}
        >
          <ChevronDownIcon />
        </IconButton>
        <div id={monthId} className={styles.month} aria-live="polite" aria-atomic="true">
          {formatters.month.format(activeDate)}
        </div>
        <IconButton
          className={styles.next}
          size="sm"
          label={nextMonthLabel}
          aria-disabled={hasNextMonth ? undefined : true}
          onClick={() => {
            if (hasNextMonth) {
              setMovedDate(restingDateIn(addMonths(firstOfMonth(activeDate), 1)));
            }
          }}
        >
          <ChevronDownIcon />
        </IconButton>
      </div>
      <div className={styles.gridSlot}>
        <table
          ref={gridRef}
          role="grid"
          className={styles.grid}
          aria-labelledby={monthId}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            gridHasFocus.current = true;
          }}
          onBlur={(event) => {
            gridHasFocus.current = event.currentTarget.contains(event.relatedTarget);
          }}
        >
          <thead>
            <tr>
              {Array.from({ length: 7 }, (_unused, offset) => {
                const weekday = addDays(A_SUNDAY, (weekStartsOn + offset) % 7);
                return (
                  <th
                    key={weekday}
                    scope="col"
                    className={styles.weekday}
                    aria-label={formatters.longWeekday.format(weekday)}
                  >
                    {formatters.shortWeekday.format(weekday)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {weeksOfMonth(activeDate, weekStartsOn).map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((date, dayIndex) =>
                  date === null ? (
                    <td key={dayIndex} role="gridcell" />
                  ) : (
                    <td
                      key={date}
                      role="gridcell"
                      className={styles.day}
                      data-date={date}
                      tabIndex={date === activeDate ? 0 : -1}
                      aria-label={formatters.fullDate.format(date)}
                      aria-selected={date === chosen}
                      aria-current={date === today ? 'date' : undefined}
                      aria-disabled={isUnavailable(date) ? true : undefined}
                      onClick={() => {
                        if (isUnavailable(date)) {
                          setMovedDate(date);
                        } else {
                          onSelect(date);
                        }
                      }}
                    >
                      {formatters.day.format(date)}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
