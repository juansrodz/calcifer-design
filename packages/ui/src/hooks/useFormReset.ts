import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

function listenForReset(form: HTMLFormElement, onReset: () => void): () => void {
  let pendingTimer: ReturnType<typeof setTimeout> | undefined;
  const handleReset = (event: Event) => {
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => {
      if (!event.defaultPrevented) {
        onReset();
      }
    });
  };
  form.addEventListener('reset', handleReset);
  return () => {
    clearTimeout(pendingTimer);
    form.removeEventListener('reset', handleReset);
  };
}

/**
 * Internal, not exported from `src/index.ts`. Calls `onReset` after the form that owns `inputRef`'s
 * input has been reset, for a control whose state a browser's reset cannot reach by itself.
 *
 * After, and on a timer, because the `reset` event comes before the browser resets anything: a
 * value put in the input during the event would be wiped, and a later listener can still cancel it.
 * A microtask is too soon, since one runs between listeners when a user presses a reset button.
 */
export function useFormReset(
  inputRef: RefObject<HTMLInputElement | null>,
  onReset: () => void,
): void {
  const latestOnReset = useRef(onReset);
  const listening = useRef<{ form: HTMLFormElement; stop: () => void } | null>(null);

  // On every commit, since nothing announces that an input has come to be inside a form.
  useLayoutEffect(() => {
    latestOnReset.current = onReset;
    const form = inputRef.current?.form ?? null;
    if (form === (listening.current?.form ?? null)) {
      return;
    }
    listening.current?.stop();
    listening.current =
      form === null ? null : { form, stop: listenForReset(form, () => latestOnReset.current()) };
  });

  useEffect(
    () => () => {
      listening.current?.stop();
      listening.current = null;
    },
    [],
  );
}
