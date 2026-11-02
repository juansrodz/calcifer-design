import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useContext, useState, type ReactNode } from 'react';
import { InsideToolbarContext } from '../Toolbar/InsideToolbarContext';
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
 * whose arrow keys, Home and End move focus without changing the choice.
 *
 * Tab lands on the chosen option. Base UI's `ToggleGroup` has no prop for that and roves from the
 * first enabled option, so while focus is outside the group each `Toggle` is told its `tabIndex`.
 * Inside it Base UI roves as usual: an override there would leave the chosen option as a second
 * stop on the way out. A disabled chosen option cannot take focus, so Base UI decides then too,
 * and inside a `Toolbar` the toolbar owns the stop.
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
  const insideToolbar = useContext(InsideToolbarContext);
  const [heldValue, setHeldValue] = useState(defaultValue);
  const [focusedValue, setFocusedValue] = useState<string | null>(null);
  const chosenValue = value ?? heldValue;
  const heldIndex = options.findIndex((option) => option.value === chosenValue);
  const chosenIndex =
    heldIndex === -1 ? options.findIndex((option) => !option.disabled) : heldIndex;
  // Read from `options`, not only from blur: React fires none for a focused element it removes.
  const focusIsInside = options.some((option) => option.value === focusedValue && !option.disabled);
  const chosenOption = options[chosenIndex];
  const placesTabStop = !insideToolbar && !focusIsInside && chosenOption && !chosenOption.disabled;
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
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusedValue(null);
        }
      }}
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
          onFocus={() => setFocusedValue(option.value)}
          {...(placesTabStop ? { tabIndex: index === chosenIndex ? 0 : -1 } : null)}
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
