import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { ReactNode } from 'react';
import { InlineField, type FieldFrameProps } from '../Field/Field';
import styles from './Switch.module.css';

export interface SwitchProps extends FieldFrameProps {
  /** The text beside the track, and the switch's accessible name. */
  label: string;
  /** Sits under the row and joins the switch's `aria-describedby`. */
  description?: ReactNode;
  /**
   * The validation message. It is rendered and announced; the track itself is not restyled,
   * because a switch's state is binary and already visible.
   */
  error?: string;
  /** Controlled. Pair it with `onCheckedChange`; use `defaultChecked` for an uncontrolled one. */
  checked?: boolean;
  defaultChecked?: boolean;
  /**
   * The new checked state. One argument, as on every other control in the tier: Base UI calls
   * its own callback `(checked, eventDetails)` and this wrapper drops the second, which no
   * consumer can read without a cast.
   */
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  label,
  name,
  description,
  error,
  checked,
  defaultChecked,
  onCheckedChange,
  required = false,
  disabled = false,
}: SwitchProps) {
  return (
    <InlineField
      label={label}
      name={name}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
    >
      <BaseSwitch.Root
        className={styles.track}
        checked={checked}
        defaultChecked={defaultChecked}
        // One argument out, whatever Base UI passes in — see the prop's doc.
        onCheckedChange={(nextChecked) => onCheckedChange?.(nextChecked)}
        required={required}
      >
        <BaseSwitch.Thumb className={styles.thumb} />
      </BaseSwitch.Root>
    </InlineField>
  );
}
