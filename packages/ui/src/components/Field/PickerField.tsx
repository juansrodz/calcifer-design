import { Field as BaseField } from '@base-ui/react/field';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { useId, useRef, type ReactNode } from 'react';
import { useFormReset } from '../../hooks/useFormReset';
import { CloseIcon } from '../../icons/CloseIcon';
import fieldStyles from '../../styles/field.module.css';
import { useFormValue } from '../Form/FormContext';
import { IconButton } from '../IconButton/IconButton';
import { FieldMessages, RequiredMark, type FieldFrameProps } from './Field';
import styles from './PickerField.module.css';

export interface PickerFieldProps extends FieldFrameProps {
  /** Submitted through the hidden input and given to `Form`. `null` is nothing chosen. */
  value: string | null;
  /** The trigger's words: the value as it reads, or the placeholder. */
  valueText: string;
  /** Sits at the end of the trigger. */
  icon: ReactNode;
  /** Added to the icon's wrapper, for a picker whose icon reacts to the popup. */
  iconClassName?: string;
  /** Joins the trigger's accessible name when the field is `required`. */
  requiredWord: string;
  /** What `Form` asks before it submits: the message to refuse with, or `null`. */
  validate: () => string | null;
  /** Called after a native reset of the surrounding form. */
  onReset: () => void;
  /** Shows a button that clears the value, while there is one. */
  clearable: boolean;
  clearLabel: string;
  /** Focus goes to the trigger after this, as the button is about to go. */
  onClear: () => void;
  onBlur?: () => void;
  onTriggerKeyDown?: BaseField.Control.Props['onKeyDown'];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modal?: BasePopover.Root.Props['modal'];
  /** The popover's `Portal` and all it holds, which is each picker's own. */
  children: ReactNode;
}

/**
 * The frame `DatePicker` and `TreeSelect` share: a button that opens a popover, a clear button
 * beside it, and a value that travels in a hidden input. Internal: not exported from `src/index.ts`.
 *
 * The trigger is the frame's `Field.Control`, holding the value as a button's `value`. That one
 * element gets the name, the description, `aria-invalid`, `Form`'s focus and the clearing of a
 * `Form` error as any Base UI control does, none of which a hidden input could use.
 */
export function PickerField({
  label,
  name,
  description,
  error,
  required = false,
  disabled = false,
  value,
  valueText,
  icon,
  iconClassName,
  requiredWord,
  validate,
  onReset,
  clearable,
  clearLabel,
  onClear,
  onBlur,
  onTriggerKeyDown,
  open,
  onOpenChange,
  modal,
  children,
}: PickerFieldProps) {
  const labelId = useId();
  const valueId = useId();
  const requiredId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useFormValue(disabled ? undefined : name, value);
  useFormReset(hiddenInputRef, onReset);

  return (
    <BaseField.Root
      className={fieldStyles.frame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
      validate={validate}
    >
      {/* `nativeLabel={false}` with a `<span>`, as `Select` does for its button. */}
      <BaseField.Label
        id={labelId}
        className={fieldStyles.label}
        nativeLabel={false}
        render={<span />}
      >
        {label}
        <RequiredMark when={required} />
      </BaseField.Label>
      <div className={styles.row}>
        <BasePopover.Root open={open} onOpenChange={onOpenChange} modal={modal}>
          <BasePopover.Trigger
            ref={triggerRef}
            disabled={disabled}
            render={
              <BaseField.Control
                className={[fieldStyles.control, styles.trigger].join(' ')}
                value={value ?? ''}
                onBlur={onBlur}
                onKeyDown={onTriggerKeyDown}
                // A button cannot be `aria-required`, so the word goes in its name, from a node
                // `hidden` keeps out of everything except that reference.
                aria-labelledby={[labelId, required ? requiredId : null, valueId]
                  .filter(Boolean)
                  .join(' ')}
                render={<button type="button" />}
              />
            }
          >
            <span
              id={valueId}
              className={styles.value}
              data-placeholder={value === null ? '' : undefined}
            >
              {valueText}
            </span>
            <span className={[styles.icon, iconClassName].filter(Boolean).join(' ')}>{icon}</span>
          </BasePopover.Trigger>
          {children}
        </BasePopover.Root>
        {clearable && value !== null && !disabled ? (
          <IconButton
            label={clearLabel}
            onClick={() => {
              onClear();
              triggerRef.current?.focus();
            }}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </div>
      {required ? (
        <span id={requiredId} hidden>
          {requiredWord}
        </span>
      ) : null}
      <input
        ref={hiddenInputRef}
        type="hidden"
        name={name}
        value={value ?? ''}
        disabled={disabled}
      />
      <FieldMessages description={description} error={error} />
    </BaseField.Root>
  );
}
