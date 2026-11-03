import { Form as BaseForm } from '@base-ui/react/form';
import { useState, type ReactNode } from 'react';
import { FormValuesContext } from './FormContext';
import styles from './Form.module.css';

export interface FormProps<Values extends object = Record<string, unknown>> {
  /**
   * The values as a plain object keyed by field `name`, once nothing is invalid. A text control
   * or a `Select` gives a string, `''` when empty; a `RadioGroup` a string or `null`; `Checkbox`
   * and `Switch` a boolean; `DatePicker` a `YYYY-MM-DD` string or `null`; and `Upload` an array of
   * `File`s, empty when none is chosen and an array even without `multiple`. A disabled control
   * is left out, as a browser leaves it out, and so is an input that is not one of the library's:
   * a raw `<input name>` has no field frame to report through. The browser's own submit never
   * happens, so `Form` takes no `action`.
   */
  onSubmit: (values: Values) => void;
  /**
   * Messages keyed by field `name`, typically from a server. Each shows on the matching control,
   * marks it invalid and goes away when that control's value changes. While one is showing the
   * form does not submit: submitting moves focus to the first such control instead, so a message
   * the user cannot fix by editing that field belongs in an `Alert`. Pass a new object to set them
   * again; an object with the same messages, as an inline literal makes on every render, does not
   * bring back one that was cleared, until the form has been submitted since.
   *
   * So the parent must drop an entry once a submit succeeds: a stale one comes back on its next
   * render, and then blocks the following submit.
   *
   * A disabled control shows no message and does not stop the submit, which is Base UI's rule.
   */
  errors?: Record<string, string>;
  /**
   * Leave this on. `false` hands validation to the browser's bubble, which cannot report on the
   * hidden inputs `Select`, `Checkbox`, `RadioGroup` and `Switch` submit with: `required` on one
   * of those then blocks the submit with nothing on screen. On, `required` and the other
   * constraints still block, and the message shows on the control's own frame.
   */
  noValidate?: boolean;
  children: ReactNode;
  /** Lets a submit button outside the form point at it with `form`. */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

function holdsSameMessages(
  first: Record<string, string> | undefined,
  second: Record<string, string> | undefined,
): boolean {
  const firstEntries = Object.entries(first ?? {});
  return (
    firstEntries.length === Object.keys(second ?? {}).length &&
    firstEntries.every(([name, message]) => second?.[name] === message)
  );
}

/**
 * Collects values, shows validation messages and moves focus to the first invalid control. Every
 * field frame in the library works inside it; no field needs telling.
 *
 * A `type="reset"` button does not reset every control here: messages stay, and a `Select` or a
 * `Checkbox` keeps its state where a text input does not. To start over, remount the form with a
 * new `key`, which is the supported way and clears all of it.
 */
export function Form<Values extends object = Record<string, unknown>>({
  onSubmit,
  errors,
  noValidate = true,
  children,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: FormProps<Values>) {
  const [overriddenValues] = useState(() => new Map<string, unknown>());
  // Base UI copies `errors` into state whenever the object's identity changes, so an inline
  // literal would restore every cleared message on the parent's next render, which a controlled
  // field causes on each keystroke. Same messages, same object, until a submit says otherwise:
  // a server can answer two submits with the same message, and the second must show too.
  const [heldErrors, setHeldErrors] = useState(errors);
  const [submittedSinceHeld, setSubmittedSinceHeld] = useState(false);
  if (errors !== heldErrors && (submittedSinceHeld || !holdsSameMessages(errors, heldErrors))) {
    setHeldErrors(errors);
    setSubmittedSinceHeld(false);
  }
  return (
    <FormValuesContext.Provider value={overriddenValues}>
      <BaseForm<Values>
        className={styles.root}
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        noValidate={noValidate}
        errors={heldErrors}
        onFormSubmit={(values) => {
          setSubmittedSinceHeld(true);
          onSubmit({ ...values, ...Object.fromEntries(overriddenValues) });
        }}
      >
        {children}
      </BaseForm>
    </FormValuesContext.Provider>
  );
}
