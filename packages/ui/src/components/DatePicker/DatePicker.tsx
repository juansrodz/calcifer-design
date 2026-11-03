import { Popover as BasePopover } from '@base-ui/react/popover';
import { useRef, useState, type ReactNode } from 'react';
import { CalendarIcon } from '../../icons/CalendarIcon';
import popupStyles from '../../styles/popup.module.css';
import { Button } from '../Button/Button';
import type { FieldFrameProps } from '../Field/Field';
import { PickerField } from '../Field/PickerField';
import { Calendar } from './Calendar';
import {
  dateFormatter,
  directionOf,
  isDateUnavailable,
  parseIsoDate,
  usableLocale,
  weekStartOf,
} from './calendarDate';
import styles from './DatePicker.module.css';

export interface DatePickerLabels {
  /** The month button's name. */
  previousMonth: string;
  nextMonth: string;
  /** The button that closes the calendar without choosing. */
  close: string;
  /** Joins the trigger's accessible name when the field is `required`. */
  required: string;
  /** Shown when `Form` submits a `required` picker with nothing chosen. */
  requiredMessage: string;
  /** Shown when `Form` submits a date that `min`, `max` or `isDateDisabled` refuses. */
  unavailableMessage: string;
  /** The clear button's name. Defaults to "Clear" and the field's own label. */
  clear: string;
}

const DEFAULT_LABELS: Omit<DatePickerLabels, 'clear'> = {
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  close: 'Close',
  required: 'required',
  requiredMessage: 'Choose a date.',
  unavailableMessage: 'Choose an available date.',
};

export interface DatePickerProps extends FieldFrameProps {
  /** The visible label, and the start of the trigger's accessible name. */
  label: string;
  /** Sits under the trigger and joins its `aria-describedby`. */
  description?: ReactNode;
  /**
   * Draws the required mark and adds the word to the trigger's name. `Form` refuses to submit while
   * nothing is chosen, with `labels.requiredMessage` on the frame. A plain `<form>` is not blocked:
   * the value travels in a hidden input, which has no constraints, so the app validates.
   */
  required?: boolean;
  /**
   * Controlled: `YYYY-MM-DD`, or `null` for nothing chosen. A string that does not name a real date
   * (`''`, `2026-02-30`) reads as nothing chosen, and nothing is reported for it. A real date
   * outside `min` and `max` or refused by `isDateDisabled` is still shown, because it is the app's
   * value, and `Form` refuses to submit it, with `labels.unavailableMessage` on the frame. That
   * covers a default value too, and a date a moved `min` has overtaken. A plain `<form>` is not
   * blocked, for the reason `required` gives.
   */
  value?: string | null;
  /**
   * Uncontrolled: the first value, and the one a native reset of the surrounding form goes back to,
   * with `onValueChange` told. A controlled `value` stays through a reset, as the parent's to change.
   */
  defaultValue?: string | null;
  /** The chosen date or `null` once cleared, in one argument, and only for a real change. */
  onValueChange?: (value: string | null) => void;
  /** Called when focus leaves the trigger, for a form library's "touched". */
  onBlur?: () => void;
  /** The earliest date that can be chosen. Months entirely before it cannot be reached. */
  min?: string;
  /** The latest date that can be chosen. Months entirely after it cannot be reached. */
  max?: string;
  /** Marks more dates unavailable. They can still be reached by arrow key and read out. */
  isDateDisabled?: (date: string) => boolean;
  /**
   * A BCP 47 tag for the month and day names, the digits and the calendar's direction. Left out,
   * the browser's own; a tag it cannot read counts as left out. That default can differ between a
   * server's render and the browser's, which passing `locale` avoids.
   */
  locale?: string;
  /** The first column, 0 for Sunday to 6 for Saturday. Left out, what `locale` says. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Shows a button that clears the date, while there is one. */
  clearable?: boolean;
  /** Shown on the trigger while nothing is chosen. */
  placeholder?: string;
  /** The words the control says itself, for an app that is not in English. */
  labels?: Partial<DatePickerLabels>;
}

/**
 * A date field: a button showing the formatted date opens the WAI-ARIA date picker dialog, whose
 * grid is ours because Base UI has no public calendar. Submits `YYYY-MM-DD` through a hidden input.
 */
export function DatePicker({
  label,
  name,
  description,
  error,
  required = false,
  disabled = false,
  value,
  defaultValue,
  onValueChange,
  onBlur,
  min,
  max,
  isDateDisabled,
  locale,
  weekStartsOn,
  clearable = false,
  placeholder = 'Choose a date',
  labels,
}: DatePickerProps) {
  const gridRef = useRef<HTMLTableElement>(null);
  const [heldValue, setHeldValue] = useState(() => parseIsoDate(defaultValue));
  const [open, setOpen] = useState(false);
  if (open && disabled) {
    setOpen(false);
  }
  const chosen = value === undefined ? heldValue : parseIsoDate(value);
  const words = { ...DEFAULT_LABELS, clear: `Clear ${label}`, ...labels };
  const resolvedLocale = usableLocale(locale);
  const firstWeekday = weekStartsOn ?? weekStartOf(resolvedLocale);
  const earliest = parseIsoDate(min);
  const latest = parseIsoDate(max);

  const commit = (nextValue: string | null) => {
    setHeldValue(nextValue);
    if (nextValue !== chosen) {
      onValueChange?.(nextValue);
    }
  };

  return (
    <PickerField
      label={label}
      name={name}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      value={chosen}
      valueText={
        chosen === null
          ? placeholder
          : dateFormatter(resolvedLocale, { dateStyle: 'medium' }).format(chosen)
      }
      icon={<CalendarIcon />}
      requiredWord={words.required}
      validate={() => {
        if (chosen === null) {
          return required ? words.requiredMessage : null;
        }
        return isDateUnavailable(chosen, { min: earliest, max: latest, isDateDisabled })
          ? words.unavailableMessage
          : null;
      }}
      onReset={() => {
        if (value === undefined) {
          commit(parseIsoDate(defaultValue));
        }
      }}
      clearable={clearable}
      clearLabel={words.clear}
      onClear={() => commit(null)}
      onBlur={onBlur}
      open={open}
      onOpenChange={setOpen}
      modal="trap-focus"
    >
      <BasePopover.Portal>
        <BasePopover.Positioner className={popupStyles.layer} align="start" sideOffset={8}>
          <BasePopover.Popup
            className={[popupStyles.surface, styles.popup].join(' ')}
            data-popup="popover"
            aria-label={label}
            aria-modal="true"
            dir={resolvedLocale === undefined ? undefined : directionOf(resolvedLocale)}
            // Tab order and the opening focus agree: the grid's one tab stop, per `Calendar`.
            initialFocus={() => gridRef.current?.querySelector('[tabindex="0"]') ?? true}
          >
            <Calendar
              gridRef={gridRef}
              chosen={chosen}
              min={earliest}
              max={latest}
              isDateDisabled={isDateDisabled}
              locale={resolvedLocale}
              weekStartsOn={firstWeekday}
              previousMonthLabel={words.previousMonth}
              nextMonthLabel={words.nextMonth}
              onSelect={(date) => {
                commit(date);
                setOpen(false);
              }}
            />
            {/* Visible, not visually hidden as `Popover`'s is: it sits in this dialog's tab
                order, and Base UI only arms the focus trap when one is present. */}
            <div className={styles.footer}>
              <BasePopover.Close render={<Button variant="ghost" size="sm" />}>
                {words.close}
              </BasePopover.Close>
            </div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </PickerField>
  );
}
