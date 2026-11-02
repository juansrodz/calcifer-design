import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import type { ReactNode } from 'react';
import styles from './Segmented.module.css';

export interface SegmentedOption {
  /**
   * What `value` and `onValueChange` speak in. Must not be empty: Base UI's `Toggle` treats `''`
   * as no value at all and generates an id in its place, so that option could never be pressed.
   */
  value: string;
  /** The visible text, and the option's accessible name. */
  label: string;
  /** Sits before the label. Decorative: it stays out of the accessible name. */
  icon?: ReactNode;
  disabled?: boolean;
}

interface SegmentedBaseProps {
  options: SegmentedOption[];
  /** Controlled. Pair it with `onValueChange`; use `defaultValue` for an uncontrolled one. */
  value?: string;
  /** With neither this nor `value`, the first enabled option starts out chosen. */
  defaultValue?: string;
  /**
   * The newly chosen option's value. One argument, as on every other control in the library, and
   * it fires only for a change: pressing the option already chosen reports nothing.
   */
  onValueChange?: (value: string) => void;
  size?: 'sm' | 'md';
}

interface SegmentedNamedByLabel extends SegmentedBaseProps {
  /** Names the group. One of this and `aria-labelledby` is required. */
  'aria-label': string;
  'aria-labelledby'?: undefined;
}

interface SegmentedNamedByElement extends SegmentedBaseProps {
  'aria-label'?: undefined;
  /** The id of the element that names the group. */
  'aria-labelledby': string;
}

export type SegmentedProps = SegmentedNamedByLabel | SegmentedNamedByElement;

/**
 * Choose exactly one of a few options. Each is a toggle button, and the group is one tab stop
 * whose arrow keys, Home and End move focus without changing the choice. Base UI's `ToggleGroup`
 * decides the tab stop and has no prop for it, so it starts on the first enabled option rather
 * than on the chosen one, until focus has been moved.
 */
export function Segmented({
  options,
  value,
  defaultValue,
  onValueChange,
  size = 'md',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SegmentedProps) {
  const initialValue = defaultValue ?? options.find((option) => !option.disabled)?.value;
  return (
    <ToggleGroup
      className={styles.root}
      data-size={size}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      // Arrays are Base UI's shape for a group that can hold several; this one holds one.
      value={value === undefined ? undefined : [value]}
      defaultValue={initialValue === undefined ? undefined : [initialValue]}
      onValueChange={(nextValues, eventDetails) => {
        const [nextValue] = nextValues;
        // An empty array is the active option being pressed again. Cancelling is what Base UI
        // offers for this, and it stops the group's own state as well as this callback's.
        if (nextValue === undefined) {
          eventDetails.cancel();
          return;
        }
        onValueChange?.(nextValue);
      }}
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          className={styles.option}
          value={option.value}
          disabled={option.disabled}
        >
          {option.icon ? (
            <span className={styles.icon} aria-hidden="true">
              {option.icon}
            </span>
          ) : null}
          {option.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
