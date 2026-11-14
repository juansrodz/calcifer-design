import { useId, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent } from 'react';
import { CloseIcon } from '../../icons/CloseIcon';
import { SearchIcon } from '../../icons/SearchIcon';
import a11yStyles from '../../styles/a11y.module.css';
import fieldStyles from '../../styles/field.module.css';
import { IconButton } from '../IconButton/IconButton';
import styles from './SearchField.module.css';

export interface SearchFieldProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'className' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'onSubmit' | 'size' | 'disabled'
> {
  /** The accessible name; visible unless `hideLabel`. */
  label: string;
  /** Hides the label from the eye and keeps it as the field's name. */
  hideLabel?: boolean;
  /** Controlled. Pair it with `onValueChange`; use `defaultValue` for an uncontrolled field. */
  value?: string;
  defaultValue?: string;
  /** One argument, as on every other control in the library: the new value, `''` after a clear. */
  onValueChange?: (value: string) => void;
  /**
   * Enter, or the clear control or Escape: the current value, `''` after a clear. Enter is left
   * alone, so an enclosing `<form>` submits as well.
   */
  onSubmit?: (value: string) => void;
  /** The accessible name of the clear control. */
  clearLabel?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

/**
 * A pill search field with a leading search glyph and, while it holds a value, a clear control.
 *
 * Escape with a value clears it exactly as the clear control does and says so with `preventDefault`
 * and `stopPropagation`: the first stops the browser's own clearing of a `type="search"` input,
 * whose `input` event would call `onValueChange('')` a second time, and the second keeps an
 * enclosing `Dialog` open, which Base UI dismisses on the document's Escape. Escape in an empty
 * field does neither, so a dialog around it still closes.
 */
export function SearchField({
  label,
  hideLabel = false,
  value,
  defaultValue,
  onValueChange,
  onSubmit,
  clearLabel = 'Clear search',
  size = 'md',
  disabled = false,
  className,
  ...inputProps
}: SearchFieldProps) {
  const generatedId = useId();
  const inputId = inputProps.id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = value !== undefined;
  const [heldValue, setHeldValue] = useState(defaultValue ?? '');
  const current = isControlled ? value : heldValue;

  function change(nextValue: string) {
    if (!isControlled) setHeldValue(nextValue);
    onValueChange?.(nextValue);
  }

  function clear() {
    change('');
    onSubmit?.('');
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    inputProps.onKeyDown?.(event);
    if (event.key === 'Enter') {
      onSubmit?.(current);
    } else if (event.key === 'Escape' && current !== '') {
      event.preventDefault();
      event.stopPropagation();
      clear();
    }
  }

  return (
    <div
      role="search"
      className={[fieldStyles.frame, styles.root, className].filter(Boolean).join(' ')}
      data-size={size}
    >
      <label
        htmlFor={inputId}
        className={hideLabel ? a11yStyles.visuallyHidden : fieldStyles.label}
        data-disabled={disabled ? '' : undefined}
      >
        {label}
      </label>
      <div
        className={[fieldStyles.control, fieldStyles.affix, styles.box].join(' ')}
        data-disabled={disabled ? '' : undefined}
      >
        <span className={fieldStyles.affixIcon} aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          {...inputProps}
          ref={inputRef}
          id={inputId}
          type="search"
          className={[fieldStyles.affixInput, styles.input].join(' ')}
          value={current}
          disabled={disabled}
          onChange={(event) => change(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        {current !== '' && !disabled ? (
          <IconButton
            variant="ghost"
            size="sm"
            label={clearLabel}
            className={styles.clear}
            onClick={clear}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </div>
    </div>
  );
}
