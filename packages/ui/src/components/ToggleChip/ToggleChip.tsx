import { Toggle } from '@base-ui/react/toggle';
import type { ReactNode } from 'react';
import { CheckIcon } from '../../icons/CheckIcon';
import styles from './ToggleChip.module.css';

/**
 * `md`, the default, is 32 px tall in the 14 px type (42 px with an icon). `sm` is the WBW mock's
 * chip: 28 px in the 12 px type, 36 px with an icon. Both stay past WCAG 2.5.8's 24 px target.
 */
export type ToggleChipSize = 'sm' | 'md';

/**
 * Where a pressed chip of a multiple group draws its check: after the label (`end`, the default) or
 * before it (`start`, after any icon). Both are reading directions, so a right-to-left page mirrors
 * them.
 */
export type ToggleChipCheckPosition = 'start' | 'end';

export interface ToggleChipProps {
  /** Controlled. Pair it with `onPressedChange`; use `defaultPressed` for an uncontrolled chip. */
  pressed?: boolean;
  defaultPressed?: boolean;
  /**
   * The chip's new state. One argument, as on every other control in the library: Base UI calls
   * its own callback `(pressed, eventDetails)` and this wrapper drops the second.
   */
  onPressedChange?: (pressed: boolean) => void;
  /**
   * Sits at the chip's start, rounded to a 26 px disc. Decorative, so it stays out of the
   * accessible name.
   */
  icon?: ReactNode;
  disabled?: boolean;
  /** `md` by default; `sm` is the smaller chip (`ToggleChipSize`). */
  size?: ToggleChipSize;
  /** The label, and the chip's accessible name. */
  children: ReactNode;
  className?: string;
}

interface ChipToggleProps extends ToggleChipProps {
  /**
   * What the chip is inside a `ToggleChipGroup`. Left out, the chip stands alone. The group
   * hands the option's index, not its value: Base UI's `Toggle` takes `''` for no value at all.
   */
  value?: string;
  /** Draws a check. The group asks for it on a pressed chip of a multiple group. */
  showCheck: boolean;
  /** Which side of the label the check is drawn on; `end` when left out. */
  checkPosition?: ToggleChipCheckPosition;
  /**
   * The group's tab stop (`useIndexedToggleGroup`). A lone chip leaves both out, and so does a
   * group chip whose stop is Base UI's: they are spread only when present, so an absent one never
   * overrides the `tabIndex` Base UI roves.
   */
  tabIndex?: number;
  onFocus?: () => void;
}

/**
 * The one chip both components draw. Internal: `ToggleChipGroup` imports it from here and the
 * barrel does not export it, so `ToggleChipProps` stays exactly what a consumer of a lone chip
 * can set.
 */
export function ChipToggle({
  value,
  showCheck,
  checkPosition = 'end',
  size = 'md',
  icon,
  disabled,
  pressed,
  defaultPressed,
  onPressedChange,
  children,
  className,
  ...tabStopProps
}: ChipToggleProps) {
  // The check is a flex item, so its place in the DOM is its place in the reading direction: before
  // the label is the inline start, the left or (in a right-to-left page) the right.
  const check = showCheck ? (
    <span className={styles.check} aria-hidden="true">
      <CheckIcon />
    </span>
  ) : null;
  return (
    <Toggle
      className={[styles.chip, className].filter(Boolean).join(' ')}
      data-with-icon={icon ? '' : undefined}
      data-size={size}
      value={value}
      disabled={disabled}
      pressed={pressed}
      defaultPressed={defaultPressed}
      {...tabStopProps}
      // One argument out, whatever Base UI passes in — see the prop's doc.
      onPressedChange={onPressedChange ? (nextPressed) => onPressedChange(nextPressed) : undefined}
    >
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {checkPosition === 'start' ? check : null}
      {children}
      {checkPosition === 'end' ? check : null}
    </Toggle>
  );
}

/**
 * A pill that is pressed or not: a toggle button, `aria-pressed` for assistive technology, and in
 * the selected colour while pressed. Alone it draws no check; a pressed chip of a multiple
 * `ToggleChipGroup` does.
 */
export function ToggleChip({
  pressed,
  defaultPressed,
  onPressedChange,
  icon,
  disabled,
  size,
  children,
  className,
}: ToggleChipProps) {
  return (
    <ChipToggle
      showCheck={false}
      size={size}
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={onPressedChange}
      icon={icon}
      disabled={disabled}
      className={className}
    >
      {children}
    </ChipToggle>
  );
}
