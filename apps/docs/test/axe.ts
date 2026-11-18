import { act } from 'react';
import { axe as runAxe } from 'vitest-axe';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

// jsdom has no layout or paint engine, so it cannot resolve computed colours (least of all
// through CSS custom properties) well enough for axe's contrast rule to mean anything here.
// That coverage lives in the tokens package's own contrast tests and in Storybook's a11y
// addon, which runs in a real browser — and, for this app specifically, in the contrast table
// `src/sections/TokenGallery.tsx` renders, which computes the same ratios from the same
// source.
//
// Base UI's Tabs schedules a real animation frame on mount, to clear the active panel's initial
// transition-status attribute (`useTransitionStatus` inside `@base-ui/react`). The scan below is
// the long `await` in every one of this app's tests that lets that frame land — a real update,
// reported honestly by React's "not wrapped in act(...)" warning when nothing here settles it
// first. Awaiting two frames inside `act()` — Base UI may schedule one frame's callback from
// inside another, so one frame is not a bound we can rely on — acts that update before axe looks
// at the DOM, which is also the DOM we want axe scanning: settled, not mid-transition.
//
// Only violations are asked for (`resultTypes`). By default axe also serialises every node that
// passed every rule — a CSS selector and an HTML snippet each — and on the token gallery's ~1,300
// elements that reporting was about two thirds of the scan (axe call 670 ms, 235 ms without it;
// the whole test went from 3.6-4.2 s to 1.7-2.0 s of its 5 s timeout on an oversubscribed machine).
// `toHaveNoViolations` reads nothing else, every rule still runs against every node, and
// `src/axe-helper.test.tsx` pins that a violation still shows.
export async function axe(container: Element) {
  await act(async () => {
    await nextFrame();
    await nextFrame();
  });
  return runAxe(container, {
    resultTypes: ['violations'],
    rules: { 'color-contrast': { enabled: false } },
  });
}
