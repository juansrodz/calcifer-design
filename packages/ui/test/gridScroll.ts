import { act } from 'react';

/**
 * The scrolling helpers the DataGrid test files share. jsdom lays nothing out and has no
 * `scrollTo`, so with `installElementSize` these stand in for a browser scrolling the grid's
 * `[data-grid-scroll]` area.
 */

/** The grid's scroll area, the element `installElementSize` gives a size. */
export function scrollArea(): HTMLElement {
  return document.querySelector('[data-grid-scroll]') as HTMLElement;
}

/** Scrolls the body to `scrollTop` and fires the scroll event a browser would. */
export function scrollGridTo(scrollTop: number) {
  act(() => {
    scrollArea().scrollTop = scrollTop;
    scrollArea().dispatchEvent(new Event('scroll'));
  });
}

/** jsdom has no `scrollTo`; a browser scrolls and then fires a scroll event, and so does this. */
export function emulateScrollTo() {
  const scrollElement = scrollArea();
  scrollElement.scrollTo = ((options: ScrollToOptions) => {
    scrollElement.scrollTop = options.top ?? 0;
    scrollElement.dispatchEvent(new Event('scroll'));
  }) as typeof scrollElement.scrollTo;
}
