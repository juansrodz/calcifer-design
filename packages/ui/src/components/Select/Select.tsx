import { Field as BaseField } from '@base-ui/react/field';
import { Select as BaseSelect } from '@base-ui/react/select';
import type { ReactNode } from 'react';
import { CheckIcon } from '../../icons/CheckIcon';
import { ChevronDownIcon } from '../../icons/ChevronDownIcon';
import fieldStyles from '../../styles/field.module.css';
import popupStyles from '../../styles/popup.module.css';
import { FieldMessages } from '../Field/Field';
import type { PopupAlign, PopupSide } from '../Popover/Popover';
import styles from './Select.module.css';

export interface SelectOption {
  /** Submitted with the form, and what `value`/`onValueChange` speak in. */
  value: string;
  /** The visible text, on the option and — once chosen — on the trigger. */
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** The visible label, and the trigger's accessible name. */
  label: string;
  options: SelectOption[];
  /** Identifies the field when a form is submitted. */
  name?: string;
  /** Sits under the trigger and joins its `aria-describedby`. */
  description?: ReactNode;
  /** The validation message. Its presence is the error state — see `Field`. */
  error?: string;
  /**
   * Draws the required mark and puts `required` on the control. Base UI carries it on the
   * visually hidden, `aria-hidden`, `tabindex="-1"` companion input it submits with — the exact
   * shape a browser refuses to report a validation message on, so the native bubble blocks the
   * submit silently instead. A form driven by a form library must carry `noValidate` on the
   * `<form>`, as `Field`'s own `required` documents and the composed example does.
   */
  required?: boolean;
  disabled?: boolean;
  /** Shown on the trigger while nothing is chosen. */
  placeholder?: string;
  /**
   * `null` is a real state — a select that has been cleared — so it is in the type rather than
   * narrowed away. Use with `onValueChange` for a controlled select; `defaultValue` otherwise.
   */
  value?: string | null;
  defaultValue?: string | null;
  /**
   * The chosen value, or `null` once the select has been cleared. One argument, as on every
   * other control in the tier: Base UI calls its own callback `(value, eventDetails)` and this
   * wrapper drops the second, which no consumer can read without a cast.
   */
  onValueChange?: (value: string | null) => void;
  side?: PopupSide;
  align?: PopupAlign;
  /** Gap between the trigger and the popup, in pixels. */
  sideOffset?: number;
}

export function Select({
  label,
  options,
  name,
  description,
  error,
  required = false,
  disabled = false,
  placeholder = 'Select…',
  value,
  defaultValue,
  onValueChange,
  side = 'bottom',
  align = 'start',
  sideOffset = 8,
}: SelectProps) {
  return (
    <BaseField.Root
      className={fieldStyles.frame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      {/* `nativeLabel={false}` with a `<span>`: Base UI names `<Select.Trigger>` as the case
          this prop exists for. A native `<label for>` pointing at a button makes the button
          hover when the label is hovered and makes a click on the label fire it. The
          association survives — `getByLabelText` still finds the combobox. */}
      <BaseField.Label className={fieldStyles.label} nativeLabel={false} render={<span />}>
        {label}
        {required ? <span className={fieldStyles.required} aria-hidden="true" /> : null}
      </BaseField.Label>
      {/* `items` is what makes the trigger show "Sides" rather than "sides": Base UI resolves
          the chosen value to its label through this list. The explicit `<string>` pins the
          generic, which would otherwise infer `any` from the `items` array's own signature. */}
      <BaseSelect.Root<string>
        items={options}
        value={value}
        defaultValue={defaultValue}
        // One argument out, whatever Base UI passes in — see the prop's doc.
        onValueChange={(value) => onValueChange?.(value)}
        required={required}
      >
        <BaseSelect.Trigger className={[fieldStyles.control, styles.trigger].join(' ')}>
          <BaseSelect.Value className={styles.value} placeholder={placeholder} />
          <BaseSelect.Icon className={styles.icon}>
            <ChevronDownIcon />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner
            className={popupStyles.layer}
            side={side}
            align={align}
            sideOffset={sideOffset}
            // Off, so the popup sits below its trigger and grows out of it like every other
            // anchored surface in the library. Base UI defaults it to `true`, which overlays
            // the popup on the trigger and makes `side` and `align` mean nothing.
            alignItemWithTrigger={false}
          >
            <BaseSelect.Popup className={popupStyles.surface} data-popup="select">
              <BaseSelect.List>
                {options.map((option) => (
                  <BaseSelect.Item
                    key={option.value}
                    className={styles.option}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator className={styles.indicator}>
                      <CheckIcon />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
      <FieldMessages description={description} error={error} />
    </BaseField.Root>
  );
}
