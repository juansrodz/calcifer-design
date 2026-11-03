import { Input as BaseInput } from '@base-ui/react/input';
import type { ComponentPropsWithoutRef } from 'react';
import fieldStyles from '../../styles/field.module.css';
import { useFieldRequired } from '../Field/Field';

export interface TimePickerProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  | 'className'
  | 'style'
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'required'
  | 'name'
  | 'disabled'
  | 'min'
  | 'max'
  | 'step'
  | 'children'
> {
  /** `HH:mm`, or `''` for no time. A string the browser cannot read as a time shows as empty. */
  value?: string;
  defaultValue?: string;
  /** `HH:mm`, or `''` once cleared. A `step` under 60 adds seconds: `HH:mm:ss`. */
  onValueChange?: (value: string) => void;
  /** The earliest time, `HH:mm`. A later one is `rangeUnderflow` to the browser and to `Form`. */
  min?: string;
  /** The latest time, `HH:mm`. */
  max?: string;
  /** The granularity in seconds, as the native attribute has it: 900 is every quarter hour. */
  step?: number;
}

/**
 * Goes inside `Field`. The native control is the choice here: it handles locale, 12 or 24-hour
 * entry, the keyboard and mobile wheels, and none of that is worth rebuilding.
 */
export function TimePicker({ value, defaultValue, onValueChange, ...rest }: TimePickerProps) {
  const required = useFieldRequired();
  return (
    <BaseInput
      {...rest}
      className={fieldStyles.control}
      type="time"
      value={value}
      defaultValue={defaultValue}
      // One argument out, whatever Base UI passes in.
      onValueChange={(nextValue) => onValueChange?.(nextValue)}
      required={required}
    />
  );
}
