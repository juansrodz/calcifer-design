import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useState, type ReactNode } from 'react';
import styles from './Segmented.module.css';

export interface SegmentedOption {
  /** What `value` and `onValueChange` speak in. The empty string is a value like any other. */
  value: string;
  /** The visible text, and the option's accessible name. */
  label: string;
  /** Sits before the label. Decorative: it stays out of the accessible name. */
  icon?: ReactNode;
  disabled?: boolean;
}

interface SegmentedBaseProps {
  options: SegmentedOption[];
  /**
   * Controlled. Pair it with `onValueChange`; use `defaultValue` for an uncontrolled one. A value
   * no option holds shows the first enabled option as chosen, and reports nothing.
   */
  value?: string;
  /** Leave this and `value` out, or name no option, and the first enabled option is chosen. */
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
  const [heldValue, setHeldValue] = useState(defaultValue);
  const chosenValue = value ?? heldValue;
  const heldIndex = options.findIndex((option) => option.value === chosenValue);
  const chosenIndex =
    heldIndex === -1 ? options.findIndex((option) => !option.disabled) : heldIndex;
  return (
    <ToggleGroup
      className={styles.root}
      data-size={size}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      // Always controlled, so that what is pressed follows `options` past the first render and
      // `value` may arrive late. Arrays are Base UI's shape for a group that can hold several; this
      // one holds one. Base UI hears each option by its index, because its `Toggle` takes `''` for
      // no value at all and generates an id instead.
      value={chosenIndex === -1 ? [] : [String(chosenIndex)]}
      onValueChange={(nextIndexes) => {
        // An empty array is the active option being pressed again, which changes nothing.
        const nextOption = options[Number(nextIndexes[0] ?? -1)];
        if (!nextOption) {
          return;
        }
        setHeldValue(nextOption.value);
        onValueChange?.(nextOption.value);
      }}
    >
      {options.map((option, index) => (
        <Toggle
          key={option.value}
          className={styles.option}
          value={String(index)}
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
