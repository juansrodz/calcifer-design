import { Field as BaseField } from '@base-ui/react/field';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { ReactNode } from 'react';
import fieldStyles from '../../styles/field.module.css';
import { FieldMessages } from '../Field/Field';
import styles from './Switch.module.css';

export interface SwitchProps {
  /** The text beside the track, and the switch's accessible name. */
  label: string;
  /** Identifies the field when a form is submitted. */
  name?: string;
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
  /**
   * Draws the required mark and puts `required` on the control. Base UI carries it on the
   * visually hidden, `aria-hidden`, `tabindex="-1"` companion input it submits with — the exact
   * shape a browser refuses to report a validation message on, so the native bubble blocks the
   * submit silently instead. A form driven by a form library must carry `noValidate` on the
   * `<form>`, as `Field`'s own `required` documents and the composed example does.
   */
  required?: boolean;
  disabled?: boolean;
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
    <BaseField.Root
      className={fieldStyles.inlineFrame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      <BaseField.Label className={fieldStyles.optionLabel}>
        <BaseSwitch.Root
          className={styles.track}
          checked={checked}
          defaultChecked={defaultChecked}
          // One argument out, whatever Base UI passes in — see the prop's doc.
          onCheckedChange={(checked) => onCheckedChange?.(checked)}
          required={required}
        >
          <BaseSwitch.Thumb className={styles.thumb} />
        </BaseSwitch.Root>
        {label}
        {required ? <span className={fieldStyles.required} aria-hidden="true" /> : null}
      </BaseField.Label>
      <FieldMessages description={description} error={error} />
    </BaseField.Root>
  );
}
