import { Field as BaseField } from '@base-ui/react/field';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { useId, type ReactNode } from 'react';
import fieldStyles from '../../styles/field.module.css';
import type { FieldFrameProps } from '../Field/Field';
import { GroupFrame } from '../Field/GroupFrame';
import styles from './RadioGroup.module.css';

export interface RadioOption {
  /** Submitted with the form, and what `value`/`onValueChange` speak in. */
  value: string;
  /** The visible text, and that one radio's accessible name. */
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends FieldFrameProps {
  /** Names the group. Rendered as a plain element, not a `<label>` — see the note below. */
  label: string;
  options: RadioOption[];
  /** Sits under the options and joins the group's `aria-describedby`. */
  description?: ReactNode;
  /** Controlled. Pair it with `onValueChange`; use `defaultValue` for an uncontrolled group. */
  value?: string;
  defaultValue?: string;
  /**
   * The newly chosen option's value. One argument, as on every other control in the tier:
   * Base UI calls its own callback `(value, eventDetails)` and this wrapper drops the second,
   * which no consumer can read without a cast.
   */
  onValueChange?: (value: string) => void;
  /**
   * Called when the focus leaves a radio. A form library marks a field touched on blur, and the
   * adapter in `FormExample` spreads one `onBlur` onto every control; without this prop the
   * group silently dropped it. React's blur bubbles, so moving between the options with the
   * arrow keys fires it too — a form library counts that as touched either way.
   */
  onBlur?: () => void;
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
  onBlur,
  required = false,
  disabled = false,
  orientation = 'vertical',
}: RadioGroupProps) {
  const labelId = useId();
  return (
    <GroupFrame
      labelId={labelId}
      label={label}
      name={name}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
    >
      <BaseRadioGroup<string>
        className={fieldStyles.options}
        data-orientation={orientation}
        aria-labelledby={labelId}
        value={value}
        defaultValue={defaultValue}
        // One argument out, whatever Base UI passes in — see the prop's doc.
        onValueChange={(nextValue) => onValueChange?.(nextValue)}
        onBlur={onBlur}
        required={required}
      >
        {options.map((option) => (
          // `Field.Item` is what scopes a control id per option. Without it every option's
          // label and hidden input share one id — the other half of the measurement `GroupFrame`
          // records.
          <BaseField.Item key={option.value} disabled={option.disabled}>
            <BaseField.Label className={fieldStyles.optionLabel}>
              <BaseRadio.Root
                className={[fieldStyles.controlBox, styles.dot].join(' ')}
                value={option.value}
              >
                <BaseRadio.Indicator className={styles.mark} />
              </BaseRadio.Root>
              {option.label}
            </BaseField.Label>
          </BaseField.Item>
        ))}
      </BaseRadioGroup>
    </GroupFrame>
  );
}
