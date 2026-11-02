import type { ReactNode } from 'react';
import { dateFormatter, parseIsoDate, usableLocale } from '../DatePicker/calendarDate';
import styles from './Timeline.module.css';

export type TimelineTone = 'neutral' | 'accent' | 'success' | 'danger';

export interface TimelineItem {
  /** Identifies the entry across renders. */
  id: string;
  title: ReactNode;
  /**
   * ISO 8601: `YYYY-MM-DD`, or a date and time such as `2026-03-08T09:30:00Z`. A date alone is a day
   * on the calendar and shifts in no time zone; a time is shown in the viewer's zone. The source
   * string stays in `<time datetime>`. Anything else is shown as written, without a `<time>`.
   */
  timestamp?: string;
  description?: ReactNode;
  /** Stated in text as well as colour. Left out, the entry looks neutral and says nothing of it. */
  tone?: TimelineTone;
}

export interface TimelineProps {
  /** Drawn in the order given, which is the app's to decide. */
  items: TimelineItem[];
  /**
   * A BCP 47 tag for the dates, always on the Gregorian calendar. Left out, the browser's own; a tag
   * it cannot read counts as left out. That default can differ between a server's render and the
   * browser's, which passing `locale` avoids. A time also differs by the viewer's time zone, which
   * `locale` does not cover: leave timestamps with a time out of a server's render.
   */
  locale?: string;
  /** Names the list. */
  'aria-label'?: string;
  /** The words each tone is stated in, for an app that is not in English. */
  toneLabels?: Partial<Record<TimelineTone, string>>;
}

const DEFAULT_TONE_LABELS: Record<TimelineTone, string> = {
  neutral: 'Note',
  accent: 'Highlight',
  success: 'Success',
  danger: 'Problem',
};

const DATE_AND_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}(:?\d{2})?)?$/;

/**
 * The words for `source`, or `null` when it is not a timestamp. The pattern comes first because
 * `Date` itself is too forgiving: it reads "March 8" as 2001, and "12" as December.
 */
function formatTimestamp(source: string, locale: string | undefined): string | null {
  if (parseIsoDate(source) !== null) {
    return dateFormatter(locale, { dateStyle: 'medium' }).format(source);
  }
  if (!DATE_AND_TIME.test(source) || parseIsoDate(source.slice(0, 10)) === null) {
    return null;
  }
  const instant = new Date(source);
  return Number.isNaN(instant.getTime())
    ? null
    : new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        calendar: 'gregory',
      }).format(instant);
}

/**
 * A chronological record. A display only: nothing here can be focused or activated. A tone is said
 * in visible words beside the time, because forced colours flatten every tint here to the same
 * thing, and the words are what still tells a failure from a success.
 */
export function Timeline({ items, locale, 'aria-label': ariaLabel, toneLabels }: TimelineProps) {
  if (items.length === 0) {
    return null;
  }
  const resolvedLocale = usableLocale(locale);
  const words = { ...DEFAULT_TONE_LABELS, ...toneLabels };
  return (
    // `role="list"` is not redundant: WebKit drops list semantics for `list-style: none` outside a
    // `nav`, and this list is what tells a screen reader how many entries there are.
    <ol role="list" className={styles.list} aria-label={ariaLabel}>
      {items.map((item) => {
        const formatted = item.timestamp ? formatTimestamp(item.timestamp, resolvedLocale) : null;
        return (
          <li key={item.id} className={styles.item} data-tone={item.tone ?? 'neutral'}>
            <span className={styles.marker} data-marker="" aria-hidden="true" />
            <div className={styles.body}>
              <div className={styles.title}>{item.title}</div>
              {item.timestamp || item.tone ? (
                <div className={styles.meta}>
                  {formatted === null ? (
                    item.timestamp ? (
                      <span>{item.timestamp}</span>
                    ) : null
                  ) : (
                    <time dateTime={item.timestamp}>{formatted}</time>
                  )}
                  {item.tone ? <span className={styles.tone}>{words[item.tone]}</span> : null}
                </div>
              ) : null}
              {item.description ? (
                <div className={styles.description}>{item.description}</div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
