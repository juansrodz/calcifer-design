import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';
import { AffixInput } from '../Field/AffixInput';
import { useFieldRequired } from '../Field/Field';

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
  /**
   * A decorative glyph inside the field, before the text: an icon from your own set, sized to 1rem
   * and coloured by the text-muted role. The field's label still names the input. Ignored when
   * `render` is given, as `type` is: the caller's element is the control and has no pill to hold it.
   */
  startIcon?: ReactNode;
}

export function TextInput({
  type = 'text',
  value,
  defaultValue,
  onValueChange,
  render,
  startIcon,
  ...rest
}: TextInputProps) {
  // `name`, `disabled` and the id come from the surrounding `Field.Root` through Base UI's own
  // context, and `Field.Root`'s values take precedence over a control's, so none of them is a
  // prop here. `required` is the exception: `Field.Root` has no such prop to propagate.
  const required = useFieldRequired();
  return (
    <AffixInput
      {...rest}
      startIcon={render === undefined ? startIcon : undefined}
      type={render === undefined ? type : undefined}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      required={required}
      render={render}
    />
  );
}
