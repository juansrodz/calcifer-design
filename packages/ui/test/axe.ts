import { axe as runAxe } from 'vitest-axe';

export function axe(container: Element) {
  return runAxe(container, { rules: { 'color-contrast': { enabled: false } } });
}
