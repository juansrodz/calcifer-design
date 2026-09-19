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
  /** Base UI calls this as `(checked, eventDetails)`; the second argument is passed through. */
  onCheckedChange?: (checked: boolean, eventDetails: unknown) => void;
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
          onCheckedChange={onCheckedChange}
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
