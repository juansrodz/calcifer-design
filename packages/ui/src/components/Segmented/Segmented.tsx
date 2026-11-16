import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useContext, useState, type ReactNode } from 'react';
import { useIndexedToggleGroup } from '../../hooks/useIndexedToggleGroup';
import a11yStyles from '../../styles/a11y.module.css';
import { hasContent } from '../../utils/hasContent';
import { InsideToolbarContext } from '../Toolbar/InsideToolbarContext';
import styles from './Segmented.module.css';

export interface SegmentedOption {
  /** What `value` and `onValueChange` speak in. The empty string is a value like any other. */
  value: string;
  /** The visible text, and the option's accessible name. */
  label: string;
  /** Sits before the label. Decorative: it stays out of the accessible name. */
  icon?: ReactNode;
  /**
   * A count or short status shown after the label, such as the `2` in "Requests 2". It is part of
   * the option's accessible name, and pressing it chooses the option. In the chosen option it sits
   * on `--color-selected`: a bare count keeps the option's text colour, and a pill made from the
   * surface, accent-wash, border and text tokens (a `Tag`) is drawn as the option's inverse. A
   * badge painted any other way is the consumer's to keep legible on that fill.
   */
  badge?: ReactNode;
  /**
   * Hides the label from the eye and keeps it for assistive technology, so the option is named by
   * its label while `icon` is all that shows. It takes effect only on an option that has an
   * `icon`: with none, the label stays visible rather than leave a blank button.
   */
  hideLabel?: boolean;
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
  /**
   * Stretches the group across its row and shares the row equally between the options. The options
   * stay on that one row, so it suits a few short ones; without `fill`, many or long options wrap
   * to a second row instead.
   */
  fill?: boolean;
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

/** The option holding `value`, or else the first enabled one; -1 when there is neither. */
function chosenIndexOf(options: SegmentedOption[], value: string | undefined): number {
  const namedIndex = options.findIndex((option) => option.value === value);
  return namedIndex === -1 ? options.findIndex((option) => !option.disabled) : namedIndex;
}

/**
 * The label as the option renders it: the bare text for a default option, a visually hidden span
 * for an icon-only one (the label hides only when an icon shows in its place), and a plain span
 * ahead of a badge so the label and the count are siblings.
 */
function renderLabel(option: SegmentedOption, hasBadge: boolean): ReactNode {
  if (option.hideLabel && option.icon) {
    return <span className={a11yStyles.visuallyHidden}>{option.label}</span>;
  }
  return hasBadge ? <span>{option.label}</span> : option.label;
}

/**
 * Choose exactly one of a few options. Each is a toggle button, and the group is one tab stop
 * whose arrow keys, Home and End move focus without changing the choice.
 *
 * Tab lands on the chosen option (`useIndexedToggleGroup` records how), except inside a `Toolbar`,
 * where the toolbar owns the stop.
 */
export function Segmented({
  options,
  value,
  defaultValue,
  onValueChange,
  size = 'md',
  fill = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SegmentedProps) {
  const insideToolbar = useContext(InsideToolbarContext);
  const [heldValue, setHeldValue] = useState(defaultValue);
  const chosenIndex = chosenIndexOf(options, value ?? heldValue);
  const toggleGroup = useIndexedToggleGroup(options, insideToolbar ? -1 : chosenIndex);
  return (
    <ToggleGroup
      className={styles.root}
      data-size={size}
      data-fill={fill ? '' : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      // Always controlled, so that what is pressed follows `options` past the first render and
      // `value` may arrive late. Arrays are Base UI's shape for a group that can hold several; this
      // one holds one, heard by its index.
      value={toggleGroup.groupValue(chosenIndex === -1 ? [] : [chosenIndex])}
      onBlur={toggleGroup.onGroupBlur}
      onValueChange={(nextIndexes) => {
        // An empty array is the active option being pressed again, which changes nothing.
        const [nextOption] = toggleGroup.optionsAt(nextIndexes);
        if (!nextOption) {
          return;
        }
        setHeldValue(nextOption.value);
        onValueChange?.(nextOption.value);
      }}
    >
      {options.map((option, index) => {
        const hasBadge = hasContent(option.badge);
        return (
          <Toggle
            key={option.value}
            className={styles.option}
            value={String(index)}
            disabled={option.disabled}
            {...toggleGroup.itemProps(option, index)}
          >
            {option.icon ? (
              <span className={styles.icon} aria-hidden="true">
                {option.icon}
              </span>
            ) : null}
            {renderLabel(option, hasBadge)}
            {/* The space is rendered, not styled, so the accessible name joins the label and the
                count ("Requests 2") with no stylesheet loaded; the flex row draws nothing for it. */}
            {hasBadge ? (
              <>
                {' '}
                <span className={styles.badge}>{option.badge}</span>
              </>
            ) : null}
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
}
