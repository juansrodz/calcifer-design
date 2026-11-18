import { Field as BaseField } from '@base-ui/react/field';
import { Select as BaseSelect } from '@base-ui/react/select';
import type { ReactNode } from 'react';
import { CheckIcon } from '../../icons/CheckIcon';
import { ChevronDownIcon } from '../../icons/ChevronDownIcon';
import { hasContent } from '../../utils/hasContent';
import { usePortalContainer } from '../ThemeScope/PortalContainerContext';
import fieldStyles from '../../styles/field.module.css';
import popupStyles from '../../styles/popup.module.css';
import { FieldMessages, RequiredMark, type FieldFrameProps } from '../Field/Field';
import type { PopupAlign, PopupSide } from '../Popover/Popover';
import styles from './Select.module.css';

export interface SelectOption {
  /** Submitted with the form, and what `value`/`onValueChange` speak in. */
  value: string;
  /** The visible text, on the option and — once chosen — on the trigger. */
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends FieldFrameProps {
  /** The visible label, and the trigger's accessible name. */
  label: string;
  options: SelectOption[];
  /** Sits under the trigger and joins its `aria-describedby`. */
  description?: ReactNode;
  /** Shown on the trigger while nothing is chosen. */
  placeholder?: string;
  /**
   * Content inside the trigger, before the value: an icon from your own set (an `<svg>` is sized
   * to 1rem and coloured by the text-muted role, as on `TextInput`) or a small avatar, such as an
   * `<Avatar size="xs" />` for the person the value names. Update it from `onValueChange` so it
   * follows the value. Absent (or `null`, `false`, `''`), the trigger is exactly what it is without
   * the prop.
   *
   * It is decorative: the slot is `aria-hidden`, so nothing in it (an avatar's hidden name
   * included) joins the trigger's accessible name, which stays the `label`, or the value announced
   * with it. A press on it opens the select like any other press on the trigger. Keep it phrasing content with nothing focusable inside, since it
   * sits in a `<button>`. When it carries meaning the value text does not, say it in words the
   * trigger already reads: the option's `label` (`'Sebastian (host)'`) or the `description`.
   *
   * The trigger keeps its 44 px floor; content up to 26 px tall fits inside it unchanged, and
   * taller content grows the trigger.
   */
  startIcon?: ReactNode;
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
  /**
   * Called when the focus leaves the trigger — including when the popup opens and takes it.
   * A form library marks a field touched on blur, and the adapter in `FormExample` spreads one
   * `onBlur` onto every control; without this prop the select silently dropped it.
   */
  onBlur?: () => void;
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
  startIcon,
  value,
  defaultValue,
  onValueChange,
  onBlur,
  side = 'bottom',
  align = 'start',
  sideOffset = 8,
}: SelectProps) {
  const container = usePortalContainer();
  const valueText = <BaseSelect.Value className={styles.value} placeholder={placeholder} />;
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
        <RequiredMark when={required} />
      </BaseField.Label>
      {/* `items` is what makes the trigger show "Sides" rather than "sides": Base UI resolves
          the chosen value to its label through this list. The explicit `<string>` pins the
          generic, which would otherwise infer `any` from the `items` array's own signature. */}
      <BaseSelect.Root<string>
        items={options}
        value={value}
        defaultValue={defaultValue}
        // One argument out, whatever Base UI passes in — see the prop's doc. The wrapper is
        // unconditional on all four controls in the tier, so Base UI always sees a handler.
        onValueChange={(nextValue) => onValueChange?.(nextValue)}
        required={required}
      >
        <BaseSelect.Trigger
          className={[fieldStyles.control, styles.trigger].join(' ')}
          onBlur={onBlur}
        >
          {hasContent(startIcon) ? (
            // The slot and the value share a row of their own, so the slot sits right before the
            // value at the affix gap while the trigger's `space-between` keeps the chevron at the
            // end. Without a slot the value stays the trigger's own child, as before the prop.
            <span className={styles.lead}>
              <span className={fieldStyles.affixIcon} aria-hidden="true">
                {startIcon}
              </span>
              {valueText}
            </span>
          ) : (
            valueText
          )}
          <BaseSelect.Icon className={styles.icon}>
            <ChevronDownIcon />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal container={container}>
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
