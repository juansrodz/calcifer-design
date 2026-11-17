import { useEffect, useState } from 'react';

/**
 * Internal, not exported from `src/index.ts`. Reports whether an element's content overflows its
 * height (`scrollHeight > clientHeight`), so a scrolling region with nothing focusable inside it
 * can be made a Tab stop while, and only while, it scrolls (WCAG 2.1.1: Safari does not make a
 * scroller focusable on its own). Returns a callback ref for the element and the current answer.
 *
 * A ResizeObserver watches the element and each of its children, so the answer follows both the
 * box (a resized viewport) and the content (a paragraph that grows); a MutationObserver measures
 * again when text or children change, and watches the children that arrive later. Where there is
 * no ResizeObserver the answer stays `false`, and the element is left as it was.
 */
export function useOverflowFocusable<Target extends HTMLElement>(): [
  (element: Target | null) => void,
  boolean,
] {
  const [element, setElement] = useState<Target | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    if (element === null || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setOverflowing(element.scrollHeight > element.clientHeight);
    // The observer reports each target once on `observe`, so the first measure needs no call here.
    const resizeObserver = new ResizeObserver(measure);
    const observeChildren = () => {
      for (const child of Array.from(element.children)) resizeObserver.observe(child);
    };
    resizeObserver.observe(element);
    observeChildren();
    // Text set straight in the element, or children added or removed, change the content's height
    // without resizing a watched box, so those measure again (and watch the new children).
    const mutationObserver =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => {
            observeChildren();
            measure();
          });
    mutationObserver?.observe(element, { childList: true, characterData: true, subtree: true });
    return () => {
      // The element is gone or replaced: the next one starts from "fits" until it is measured, so
      // a reopened dialog never opens with the last body's Tab stop.
      setOverflowing(false);
      resizeObserver.disconnect();
      mutationObserver?.disconnect();
    };
  }, [element]);
  // A detached element reports nothing, whatever the last measure said.
  return [setElement, element !== null && overflowing];
}
