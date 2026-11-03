import { createContext, useContext, useEffect } from 'react';

/**
 * What a control hands `Form` when the value Base UI would read off its DOM element is not the one
 * a caller wants: an `Upload`'s `File`s rather than a file input's fake path, a `DatePicker`'s
 * `null` rather than an empty string. `null` here means no `Form` is around, which is also how
 * `FieldMessages` knows to leave a plain `<form>`'s frames exactly as they were. Internal: not
 * exported from `src/index.ts`, like `InsideToolbarContext`.
 */
export const FormValuesContext = createContext<Map<string, unknown> | null>(null);

/** Internal. True inside a `Form`, whose error entries only Base UI's own error part can read. */
export function useInsideForm(): boolean {
  return useContext(FormValuesContext) !== null;
}

/**
 * Internal. Submits `value` under `name` in place of what Base UI reads. Leave `name` undefined
 * for a disabled control: it submits nothing, as a disabled input does.
 */
export function useFormValue(name: string | undefined, value: unknown): void {
  const values = useContext(FormValuesContext);
  useEffect(() => {
    if (values === null || name === undefined) {
      return undefined;
    }
    values.set(name, value);
    return () => {
      values.delete(name);
    };
  }, [values, name, value]);
}
