import { axe as runAxe } from 'vitest-axe';

// jsdom has no layout/paint engine, so it cannot resolve computed colours (including
// through CSS custom properties) well enough for axe's contrast check to be meaningful
// here; that coverage instead comes from packages/tokens' contrast tests (every themed
// colour pairing) and the Storybook a11y addon (a real browser, via addon-a11y).
export function axe(container: Element) {
  return runAxe(container, { rules: { 'color-contrast': { enabled: false } } });
}
