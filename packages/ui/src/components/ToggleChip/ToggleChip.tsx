import { Toggle } from '@base-ui/react/toggle';
import type { ReactNode } from 'react';
import { CheckIcon } from '../../icons/CheckIcon';
import styles from './ToggleChip.module.css';

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
  /** Draws a check after the label. The group asks for it on a pressed chip of a multiple group. */
  showCheck: boolean;
}

/**
 * The one chip both components draw. Internal: `ToggleChipGroup` imports it from here and the
 * barrel does not export it, so `ToggleChipProps` stays exactly what a consumer of a lone chip
 * can set.
 */
export function ChipToggle({
  value,
  showCheck,
  icon,
  disabled,
  pressed,
  defaultPressed,
  onPressedChange,
  children,
  className,
}: ChipToggleProps) {
  return (
    <Toggle
      className={[styles.chip, className].filter(Boolean).join(' ')}
      data-with-icon={icon ? '' : undefined}
      value={value}
      disabled={disabled}
      pressed={pressed}
      defaultPressed={defaultPressed}
      // One argument out, whatever Base UI passes in — see the prop's doc.
      onPressedChange={onPressedChange ? (nextPressed) => onPressedChange(nextPressed) : undefined}
    >
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
      {showCheck ? (
        <span className={styles.check} aria-hidden="true">
          <CheckIcon />
        </span>
      ) : null}
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
  children,
  className,
}: ToggleChipProps) {
  return (
    <ChipToggle
      showCheck={false}
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
