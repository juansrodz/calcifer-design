import { useState } from 'react';

/**
 * Internal, not exported from `src/index.ts`. A value the caller may control: theirs while
 * `controlledValue` is defined (`null` included, which is a value), otherwise one held here from
 * `defaultValue`. A component that must know its value even when it does not own it (to mark the
 * chosen card, to submit to a `Form`) reads it from here.
 *
 * The setter changes the held value and does nothing while the caller controls it, so a change
 * handler sets it and reports the change without a branch of its own. The setter is a new function
 * every render, so it must not go in a dependency array.
 */
export function useControllable<Value>(
  controlledValue: Value | undefined,
  defaultValue: Value,
): [Value, (nextValue: Value) => void] {
  const [heldValue, setHeldValue] = useState(defaultValue);
  const controlled = controlledValue !== undefined;
  function setValue(nextValue: Value) {
    if (!controlled) {
      setHeldValue(nextValue);
    }
  }
  return [controlled ? controlledValue : heldValue, setValue];
}
