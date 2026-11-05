import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * The newest value, for an effect or handler that must read it without re-running when it changes.
 * It is set in a layout effect, so it is current by the time any effect of the same commit runs.
 * (`useEffectEvent` does this, but only React 19.2 has it, and the peer range starts at 19.0.)
 */
export function useLatest<Value>(value: Value): RefObject<Value> {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
