import { Input as BaseInput } from '@base-ui/react/input';
import { useRef, type MouseEvent, type ReactNode } from 'react';
import fieldStyles from '../../styles/field.module.css';

export interface AffixInputProps extends Omit<BaseInput.Props, 'className' | 'ref'> {
  /**
   * A glyph before the text, decorative: the wrapper marks it `aria-hidden`, and the field's label
   * names the input. Absent (or `null`, `false`), there is no wrapper and the input wears the skin
   * itself.
   */
  startIcon?: ReactNode;
  /**
   * With `startIcon`, the browser's own picker button is hidden (the icon sits where it would be
   * looked for) and a press on the icon opens the picker instead. `TimePicker` asks for it; typing
   * in the input is unchanged.
   */
  iconOpensPicker?: boolean;
}

/**
 * Opens the input's native picker, where the browser has one. `showPicker` refuses without a user
 * gesture (`NotAllowedError`) and on a disabled or read-only input (`InvalidStateError`), and a
 * refusal leaves the press as a plain focus.
 */
function showPickerOf(input: HTMLInputElement) {
  try {
    input.showPicker?.();
  } catch (error) {
    if (
      !(error instanceof DOMException) ||
      (error.name !== 'NotAllowedError' && error.name !== 'InvalidStateError')
    ) {
      throw error;
    }
  }
}

/**
 * The `Input` that `TextInput` and `TimePicker` share, with room for a leading icon. Internal: not
 * exported from `src/index.ts`.
 *
 * With an icon, the skin moves to a pill around the icon and the input (`.control` and `.affix`),
 * and the input drops to `.affixInput`: borderless and stretched across what the icon leaves. Every
 * other prop reaches the input exactly as it does without an icon, so the surrounding `Field`'s
 * label, `aria-describedby`, `aria-invalid` and `data-invalid` land on the input and not on the
 * pill. The pill reads the input's `data-invalid` and `data-disabled` through `:has`, because the
 * state Base UI writes is on the input.
 */
export function AffixInput({ startIcon, iconOpensPicker = false, ...inputProps }: AffixInputProps) {
  const inputRef = useRef<HTMLElement>(null);

  if (!startIcon) {
    return <BaseInput {...inputProps} className={fieldStyles.control} />;
  }

  // The input is one line tall inside a taller pill, so a press on the icon or above and below the
  // text would focus nothing. Cancelling the press and focusing the input puts the caret where a
  // bare input's whole-box press would. The input keeps its own presses, so a caret placed by
  // pointer, a selection drag and a native picker button all behave as they do without an icon.
  function focusInputFromPill(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest('input, button') !== null) return;
    event.preventDefault();
    const input = inputRef.current;
    input?.focus();
    if (
      iconOpensPicker &&
      input instanceof HTMLInputElement &&
      event.target instanceof Element &&
      event.target.closest(`.${fieldStyles.affixIcon}`) !== null
    ) {
      showPickerOf(input);
    }
  }

  return (
    // A pointer convenience only: the input inside is the focusable, keyboard-reachable control.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={[fieldStyles.control, fieldStyles.affix].join(' ')}
      data-icon-opens-picker={iconOpensPicker ? '' : undefined}
      onMouseDown={focusInputFromPill}
    >
      <span className={fieldStyles.affixIcon} aria-hidden="true">
        {startIcon}
      </span>
      <BaseInput {...inputProps} ref={inputRef} className={fieldStyles.affixInput} />
    </div>
  );
}
