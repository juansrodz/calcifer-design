import { Input as BaseInput } from '@base-ui/react/input';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import { useFieldRequired } from '../Field/Field';
import fieldStyles from '../../styles/field.module.css';

export type TextInputType =
  'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'date' | 'number';

export interface TextInputProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'className' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'required' | 'name' | 'disabled'
> {
  /** Ignored when `render` is given: the caller's element brings its own. */
  type?: TextInputType;
  value?: string;
  defaultValue?: string;
  /** Base UI reports the new value directly; there is no event to read `.target.value` off. */
  onValueChange?: (value: string) => void;
  /**
   * Render a different element in place of the `<input>`, keeping the field wiring and the
   * control skin: a `<textarea rows={4} />`, an `<input type="file" />`, a masked input. This
   * is the tier's escape hatch for a control the library does not ship.
   */
  render?: ReactElement;
}

export function TextInput({
  type = 'text',
  value,
  defaultValue,
  onValueChange,
  render,
  ...rest
}: TextInputProps) {
  // `name`, `disabled` and the id come from the surrounding `Field.Root` through Base UI's own
  // context, and `Field.Root`'s values take precedence over a control's, so none of them is a
  // prop here. `required` is the exception: `Field.Root` has no such prop to propagate.
  const required = useFieldRequired();
  return (
    <BaseInput
      {...rest}
      className={fieldStyles.control}
      type={render === undefined ? type : undefined}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      required={required}
      render={render}
    />
  );
}
