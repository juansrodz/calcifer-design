import { Field as BaseField } from '@base-ui/react/field';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { useId, type ReactNode } from 'react';
import fieldStyles from '../../styles/field.module.css';
import { FieldMessages } from '../Field/Field';
import styles from './RadioGroup.module.css';

export interface RadioOption {
  /** Submitted with the form, and what `value`/`onValueChange` speak in. */
  value: string;
  /** The visible text, and that one radio's accessible name. */
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** Names the group. Rendered as a plain element, not a `<label>` — see the note below. */
  label: string;
  options: RadioOption[];
  /** Identifies the field when a form is submitted. */
  name?: string;
  /** Sits under the options and joins the group's `aria-describedby`. */
  description?: ReactNode;
  /** The validation message. Its presence is the error state — see `Field`. */
  error?: string;
  /** Controlled. Pair it with `onValueChange`; use `defaultValue` for an uncontrolled group. */
  value?: string;
  defaultValue?: string;
  /** Base UI calls this as `(value, eventDetails)`; the second argument is passed through. */
  onValueChange?: (value: string, eventDetails: unknown) => void;
  required?: boolean;
  disabled?: boolean;
  /** `horizontal` wraps the options along a row; the arrow keys work on both axes either way. */
  orientation?: 'vertical' | 'horizontal';
}

export function RadioGroup({
  label,
  options,
  name,
  description,
  error,
  value,
  defaultValue,
  onValueChange,
  required = false,
  disabled = false,
  orientation = 'vertical',
}: RadioGroupProps) {
  const labelId = useId();
  return (
    <BaseField.Root
      className={fieldStyles.frame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      {/* Deliberately NOT a `Field.Label`. Measured: a `Field.Label` anywhere in this frame —
          native or rendered as a span — gives every `Radio.Root` an `aria-labelledby` pointing
          at it and gives every option the one control id `Field.Root` owns, so every radio ends
          up named after the group and sharing an id with its siblings. A plain element the
          group points at with `aria-labelledby` keeps the group named and leaves each option's
          own name alone. */}
      <span className={fieldStyles.legend} id={labelId}>
        {label}
        {required ? <span className={fieldStyles.required} aria-hidden="true" /> : null}
      </span>
      <BaseRadioGroup<string>
        className={fieldStyles.options}
        data-orientation={orientation}
        aria-labelledby={labelId}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        required={required}
      >
        {options.map((option) => (
          // `Field.Item` is what scopes a control id per option. Without it every option's
          // label and hidden input share one id — the other half of the measurement above.
          <BaseField.Item key={option.value} disabled={option.disabled}>
            <BaseField.Label className={fieldStyles.optionLabel}>
              <BaseRadio.Root className={styles.dot} value={option.value}>
                <BaseRadio.Indicator className={styles.mark} />
              </BaseRadio.Root>
              {option.label}
            </BaseField.Label>
          </BaseField.Item>
        ))}
      </BaseRadioGroup>
      <FieldMessages description={description} error={error} />
    </BaseField.Root>
  );
}
