import { axe as runAxe } from 'vitest-axe';

// jsdom has no layout/paint engine, so it cannot resolve computed colours (including
// through CSS custom properties) well enough for axe's contrast check to be meaningful
// here; that coverage instead comes from packages/tokens' contrast tests (every themed
// colour pairing) and the Storybook a11y addon (a real browser, via addon-a11y).
//
// Only violations are asked for (`resultTypes`). Unless it narrows the report, axe serialises every
// node that passed every rule — a CSS selector and an HTML snippet each — and the matcher
// (`toHaveNoViolations`, the only thing any test here reads) looks only at `violations`. That
// reporting is most of the cost on a very large tree, such as the docs app's token gallery; on this
// package's small trees the gain is modest, and the option stays so both helpers match. Every rule
// still runs against every node; `src/axe-helper.test.tsx` pins that a violation still shows, here
// and in `axeDocument`, and that a passing rule is still cut to one node.
export function axe(container: Element) {
  return runAxe(container, {
    resultTypes: ['violations'],
    rules: { 'color-contrast': { enabled: false } },
  });
}

/**
 * axe over the whole document, for a component whose surface is portalled to `document.body`
 * and therefore never appears inside the container `render()` returns.
 *
 * The `region` rule is disabled here and only here: it asks that every node sit inside a
 * landmark, which is a page-level requirement a component test's bare render cannot satisfy —
 * an open menu or tooltip raises it every time, and nothing else.
 */
export function axeDocument() {
  return runAxe(document.body, {
    resultTypes: ['violations'],
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
}
