import { useLayoutEffect, useState } from 'react';

/**
 * Internal, not exported from `src/index.ts`. Reports whether an element's content overflows its
 * box in either direction (`scrollHeight > clientHeight` or `scrollWidth > clientWidth`), so a
 * scrolling region with nothing focusable inside it can be made a Tab stop while, and only while,
 * it scrolls (WCAG 2.1.1: Safari does not make a scroller focusable on its own). Returns a
 * callback ref for the element and the current answer.
 *
 * The element is measured as it mounts, in a layout effect, so one that overflows then is a Tab
 * stop before the browser paints it. A ResizeObserver then watches the element and each of its
 * children, so the answer follows both the box (a resized viewport) and the content (a paragraph
 * that grows); a MutationObserver measures
 * again when text or children change, watching the children that arrive and letting go of the
 * ones that leave. Where there is no ResizeObserver the answer stays `false`, and the element is
 * left as it was.
 */
export function useOverflowFocusable<Target extends HTMLElement>(): [
  (element: Target | null) => void,
  boolean,
] {
  const [element, setElement] = useState<Target | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  useLayoutEffect(() => {
    if (element === null || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () =>
      setOverflowing(
        element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth,
      );
    // Measured now, not at the observer's first report, which comes a frame later: in between, an
    // overflowing element was a scroller with no Tab stop (an axe check run as a dialog mounts
    // caught it as `scrollable-region-focusable`). The first report measures again, unchanged.
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    for (const child of Array.from(element.children)) resizeObserver.observe(child);
    // Text set straight in the element, or children added or removed, change the content's size
    // without resizing a watched box, so those measure again.
    const mutationObserver =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver((records) => {
            for (const record of records) {
              if (record.target !== element) continue;
              for (const node of Array.from(record.addedNodes)) {
                if (node instanceof Element) resizeObserver.observe(node);
              }
              for (const node of Array.from(record.removedNodes)) {
                if (node instanceof Element) resizeObserver.unobserve(node);
              }
            }
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
