import { Field as BaseField } from '@base-ui/react/field';
import type { ReactNode } from 'react';
import fieldStyles from '../../styles/field.module.css';
import { FieldMessages, RequiredMark } from './Field';

export interface GroupFrameProps {
  /** The legend's id. The group inside points its `aria-labelledby` at it. */
  labelId: string;
  label: string;
  name?: string;
  description?: ReactNode;
  error?: string;
  required: boolean;
  disabled: boolean;
  /** The group itself, and anything that sits between it and the messages. */
  children: ReactNode;
}

/**
 * Internal, not exported from `src/index.ts`. The frame of a field whose control is a group of
 * options (`RadioGroup`, `ChoiceCard`, `ToggleChipGroup`): the `Field.Root`, a legend naming the
 * group, the group, then the description and error.
 */
export function GroupFrame({
  labelId,
  label,
  name,
  description,
  error,
  required,
  disabled,
  children,
}: GroupFrameProps) {
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
      {/* Base UI writes `data-disabled` on the parts it owns; this span is hand-rolled, so the
          skin's `.legend[data-disabled]` rule only fires because the attribute is written here.
          Without it a disabled form dims five labels and leaves the group's at full contrast.
          The boolean idiom is the library's: `'' : undefined`. */}
      <span className={fieldStyles.legend} id={labelId} data-disabled={disabled ? '' : undefined}>
        {label}
        <RequiredMark when={required} />
      </span>
      {children}
      <FieldMessages description={description} error={error} />
    </BaseField.Root>
  );
}
