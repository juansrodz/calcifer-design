import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Field as BaseField } from '@base-ui/react/field';
import type { ReactNode } from 'react';
import { CheckIcon } from '../../icons/CheckIcon';
import { MinusIcon } from '../../icons/MinusIcon';
import fieldStyles from '../../styles/field.module.css';
import { FieldMessages } from '../Field/Field';
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
  /** Base UI calls this as `(checked, eventDetails)`; the second argument is passed through. */
  onCheckedChange?: (checked: boolean, eventDetails: unknown) => void;
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
    <BaseField.Root
      className={fieldStyles.inlineFrame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      {/* The label wraps the control and the text: that is the whole difference between this
          frame and `Field`'s, and it is why a checkbox is not composed inside `Field`. */}
      <BaseField.Label className={fieldStyles.optionLabel}>
        <BaseCheckbox.Root
          className={styles.box}
          checked={checked}
          defaultChecked={defaultChecked}
          indeterminate={indeterminate}
          onCheckedChange={onCheckedChange}
          required={required}
        >
          <BaseCheckbox.Indicator className={styles.indicator}>
            {indeterminate ? <MinusIcon /> : <CheckIcon />}
          </BaseCheckbox.Indicator>
        </BaseCheckbox.Root>
        {label}
        {required ? <span className={fieldStyles.required} aria-hidden="true" /> : null}
      </BaseField.Label>
      <FieldMessages description={description} error={error} />
    </BaseField.Root>
  );
}
