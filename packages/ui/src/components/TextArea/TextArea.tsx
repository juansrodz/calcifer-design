import { Input as BaseInput } from '@base-ui/react/input';
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import fieldStyles from '../../styles/field.module.css';
import { useFieldRequired } from '../Field/Field';
import styles from './TextArea.module.css';

export interface TextAreaProps extends Omit<
  ComponentPropsWithoutRef<'textarea'>,
  | 'className'
  | 'style'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'required'
  | 'name'
  | 'disabled'
  | 'children'
> {
  value?: string;
  defaultValue?: string;
  /** Base UI reports the new value directly; there is no event to read `.target.value` off. */
  onValueChange?: (value: string) => void;
  /** The visible height in lines; with `autoResize`, the height it starts from and never shrinks under. */
  rows?: number;
  /**
   * Grows with the content through CSS `field-sizing: content`. A browser without it keeps a
   * normal textarea that the user can drag taller, so nothing is lost and no script measures.
   */
  autoResize?: boolean;
}

/** Goes inside `Field`, which supplies `name`, `disabled`, `required`, the label and the messages. */
export function TextArea({
  value,
  defaultValue,
  onValueChange,
  rows = 4,
  autoResize = false,
  ...rest
}: TextAreaProps) {
  const required = useFieldRequired();
  // `field-sizing: content` makes the browser ignore `rows`, so the stylesheet needs the count.
  const rowsStyle = autoResize ? ({ '--text-area-rows': rows } as CSSProperties) : undefined;
  return (
    <BaseInput
      className={[fieldStyles.control, styles.root].join(' ')}
      value={value}
      defaultValue={defaultValue}
      // One argument out, whatever Base UI passes in.
      onValueChange={(nextValue) => onValueChange?.(nextValue)}
      required={required}
      render={
        <textarea
          {...rest}
          rows={rows}
          style={rowsStyle}
          data-auto-resize={autoResize ? '' : undefined}
        />
      }
    />
  );
}
