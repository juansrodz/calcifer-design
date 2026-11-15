import { Field as BaseField } from '@base-ui/react/field';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useId, useState, type ReactNode } from 'react';
import fieldStyles from '../../styles/field.module.css';
import { FieldMessages, RequiredMark, type FieldFrameProps } from '../Field/Field';
import { useFormValue } from '../Form/FormContext';
import { ChipToggle } from './ToggleChip';
import styles from './ToggleChip.module.css';

export interface ToggleChipOption {
  /** What `value` and `onValueChange` speak in. The empty string is a value like any other. */
  value: string;
  /** The visible text, and the chip's accessible name. */
  label: string;
  /** Sits at the chip's start. Decorative: it stays out of the accessible name. */
  icon?: ReactNode;
  disabled?: boolean;
}

interface ToggleChipGroupBaseProps extends FieldFrameProps {
  /** Names the group. Rendered as a plain element, not a `<label>`, as `RadioGroup` does. */
  label: string;
  options: readonly ToggleChipOption[];
  /** Called when the focus leaves a chip, as `RadioGroup`'s `onBlur` is. */
  onBlur?: () => void;
}

export interface ToggleChipGroupSingleProps extends ToggleChipGroupBaseProps {
  selectionMode: 'single';
  /** Controlled; `null` presses nothing. Pair it with `onValueChange`, or use `defaultValue`. */
  value?: string | null;
  defaultValue?: string | null;
  /**
   * The newly pressed chip's value. One argument, as on every other control in the library. It
   * fires only for a change: pressing the pressed chip again reports nothing and leaves it pressed.
   */
  onValueChange?: (value: string) => void;
}

export interface ToggleChipGroupMultipleProps extends ToggleChipGroupBaseProps {
  selectionMode: 'multiple';
  /** Controlled. Pair it with `onValueChange`, or use `defaultValue`. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  /** Every pressed value, in the options' order and not the order they were pressed in. */
  onValueChange?: (value: string[]) => void;
}

export type ToggleChipGroupProps = ToggleChipGroupSingleProps | ToggleChipGroupMultipleProps;

/** The pressed values a `value` or `defaultValue` of either mode names. */
function valuesOf(value: string | readonly string[] | null | undefined): readonly string[] {
  if (value === undefined || value === null) {
    return [];
  }
  return typeof value === 'string' ? [value] : value;
}

/**
 * A row of chips that choose one value (`selectionMode="single"`) or any number (`"multiple"`).
 * Each chip is a toggle button, and the group is one tab stop whose arrow keys move focus without
 * pressing anything. A pressed chip of a multiple group draws a check.
 *
 * Base UI's `ToggleGroup` and `Toggle`, unlike its `RadioGroup`, read no `Field` context, so what
 * `RadioGroup` gets for free is wired here by hand: the description and error ids, the group's
 * `aria-describedby` and `aria-invalid`, and the frame's `disabled`.
 */
export function ToggleChipGroup(props: ToggleChipGroupProps) {
  const {
    label,
    options,
    name,
    description,
    error,
    onBlur,
    required = false,
    disabled = false,
  } = props;
  const labelId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const [heldValues, setHeldValues] = useState(() => valuesOf(props.defaultValue));
  const controlled = props.value !== undefined;
  const pressedValues = controlled ? valuesOf(props.value) : heldValues;
  const multiple = props.selectionMode === 'multiple';
  // Base UI hears each chip by its index, because its `Toggle` takes `''` for no value at all and
  // generates an id instead (`Segmented` does the same).
  const pressedChips = options.flatMap((option, index) =>
    pressedValues.includes(option.value) ? [{ option, index }] : [],
  );
  // Base UI's `Form` cannot read a toggle group, so the group hands `Form` its value as `PickerField`
  // and `Upload` do: the pressed value (or `null`) of a single group, the list of a multiple one.
  // A disabled group submits nothing, as a disabled control does.
  useFormValue(
    disabled ? undefined : name,
    multiple
      ? pressedChips.map(({ option }) => option.value)
      : (pressedChips[0]?.option.value ?? null),
  );
  // The same test `FieldMessages` applies, so the group names only a node that renders.
  const hasDescription = description !== undefined && description !== null && description !== false;
  const describedBy = [hasDescription ? descriptionId : null, error === undefined ? null : errorId]
    .filter(Boolean)
    .join(' ');
  return (
    <BaseField.Root
      className={fieldStyles.frame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      {/* Not a `Field.Label`, for the reason `RadioGroup` records: a plain element the group points
          at with `aria-labelledby` names the group and leaves each chip's own name alone. The
          `data-disabled` is written by hand because this span is not a Base UI part. */}
      <span className={fieldStyles.legend} id={labelId} data-disabled={disabled ? '' : undefined}>
        {label}
        <RequiredMark when={required} />
      </span>
      <ToggleGroup
        className={styles.group}
        aria-labelledby={labelId}
        aria-describedby={describedBy || undefined}
        aria-invalid={error === undefined ? undefined : 'true'}
        disabled={disabled}
        multiple={multiple}
        // Always controlled, so that what is pressed follows `options` past the first render and
        // `value` may arrive late.
        value={pressedChips.map(({ index }) => String(index))}
        onBlur={onBlur}
        onValueChange={(nextIndexes) => {
          const nextValues = nextIndexes
            .map(Number)
            .sort((first, second) => first - second)
            .flatMap((index) => {
              const option = options[index];
              return option ? [option.value] : [];
            });
          if (props.selectionMode === 'multiple') {
            if (!controlled) {
              setHeldValues(nextValues);
            }
            props.onValueChange?.(nextValues);
            return;
          }
          const [chosenValue] = nextValues;
          // An empty array is the pressed chip being pressed again, which changes nothing.
          if (chosenValue === undefined) {
            return;
          }
          if (!controlled) {
            setHeldValues([chosenValue]);
          }
          props.onValueChange?.(chosenValue);
        }}
      >
        {options.map((option, index) => (
          <ChipToggle
            key={option.value}
            value={String(index)}
            showCheck={multiple && pressedValues.includes(option.value)}
            icon={option.icon}
            disabled={option.disabled}
          >
            {option.label}
          </ChipToggle>
        ))}
      </ToggleGroup>
      {/* One input per pressed value, in the options' order, so a native form submits the group;
          without a `name` there is nothing to submit under. Disabled, as a disabled control is. */}
      {name === undefined
        ? null
        : pressedChips.map(({ option }) => (
            <input
              key={option.value}
              type="hidden"
              name={name}
              value={option.value}
              disabled={disabled}
            />
          ))}
      <FieldMessages
        description={description}
        descriptionId={descriptionId}
        error={error}
        errorId={errorId}
      />
    </BaseField.Root>
  );
}
