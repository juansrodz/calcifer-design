import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import type { ReactNode } from 'react';
import { CheckIcon } from '../../icons/CheckIcon';
import { MinusIcon } from '../../icons/MinusIcon';
import { InlineField } from '../Field/Field';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  /** The text beside the box, and the checkbox's accessible name. */
  label: string;
  /** Identifies the field when a form is submitted. */
  name?: string;
  /** Sits under the row and joins the checkbox's `aria-describedby`. */
  description?: ReactNode;
  /** The validation message. Its presence is the error state — see `Field`. */
  error?: string;
  /** Controlled. Pair it with `onCheckedChange`; use `defaultChecked` for an uncontrolled box. */
  checked?: boolean;
  defaultChecked?: boolean;
  /**
   * Neither ticked nor unticked: `aria-checked="mixed"`, and a bar instead of a tick. The
   * "select all" state above a list of boxes.
   */
  indeterminate?: boolean;
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

export function Checkbox({
  label,
  name,
  description,
  error,
  checked,
  defaultChecked,
  indeterminate = false,
  onCheckedChange,
  required = false,
  disabled = false,
}: CheckboxProps) {
  return (
    <InlineField
      label={label}
      name={name}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
    >
      <BaseCheckbox.Root
        className={styles.box}
        checked={checked}
        defaultChecked={defaultChecked}
        indeterminate={indeterminate}
        // One argument out, whatever Base UI passes in — see the prop's doc.
        onCheckedChange={(nextChecked) => onCheckedChange?.(nextChecked)}
        required={required}
      >
        <BaseCheckbox.Indicator className={styles.indicator}>
          {indeterminate ? <MinusIcon /> : <CheckIcon />}
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
    </InlineField>
  );
}
