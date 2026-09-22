import { axe as runAxe } from 'vitest-axe';

// jsdom has no layout or paint engine, so it cannot resolve computed colours (least of all
// through CSS custom properties) well enough for axe's contrast rule to mean anything here.
// That coverage lives in the tokens package's own contrast tests and in Storybook's a11y
// addon, which runs in a real browser — and, for this app specifically, in the contrast table
// Task 3 renders, which computes the same ratios from the same source.
export function axe(container: Element) {
  return runAxe(container, { rules: { 'color-contrast': { enabled: false } } });
}
