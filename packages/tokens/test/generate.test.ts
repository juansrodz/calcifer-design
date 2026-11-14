import { describe, expect, it } from 'vitest';
import { customPropertyNamesOf } from '../src/custom-property-scan';
import { tokensToCss, toKebab } from '../src/generate';
import { tokens } from '../src/tokens';

describe('toKebab', () => {
  it('converts camelCase and digits to kebab-case', () => {
    expect(toKebab('surface1')).toBe('surface-1');
    expect(toKebab('textMuted')).toBe('text-muted');
    expect(toKebab('accentText')).toBe('accent-text');
    expect(toKebab('sm')).toBe('sm');
  });

  it('leaves a leading digit followed by letters alone', () => {
    expect(toKebab('2xs')).toBe('2xs');
  });

  it('keeps a single-letter prefix attached to its digit', () => {
    expect(toKebab('h1')).toBe('h1');
    expect(toKebab('h3')).toBe('h3');
    expect(toKebab('h2Feature')).toBe('h2-feature');
    expect(toKebab('chartPhase1')).toBe('chart-phase-1');
  });
});

describe('tokensToCss', () => {
  const css = tokensToCss(tokens);

  it('emits light theme colours on :root', () => {
    expect(css).toContain(':root {');
    expect(css).toContain(`--color-surface-1: ${tokens.themes.light.color.surface1};`);
    expect(css).toContain('color-scheme: light dark;');
  });

  it('emits dark theme under both the data-theme override and the media query', () => {
    expect(css).toContain(':root[data-theme="dark"] {');
    expect(css).toContain(
      '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {',
    );
    expect(css).toContain(`--color-surface-1: ${tokens.themes.dark.color.surface1};`);
  });

  it('follows the explicit theme override for color-scheme', () => {
    const darkThemeBlock = css.match(/:root\[data-theme="dark"\] \{([\s\S]*?)\n\}/);
    expect(darkThemeBlock?.[1]).toContain('color-scheme: dark;');
    expect(css).toContain(':root[data-theme="light"] {\n  color-scheme: light;\n}');
  });

  it('emits shared tokens once', () => {
    const propertiesEmittedOnce = [
      `--space-4: ${tokens.shared.space[4]};`,
      `--font-sans: ${tokens.shared.font.sans};`,
      `--size-touch: ${tokens.shared.size.touch};`,
      `--motion-duration-2: ${tokens.shared.motion.duration[2]};`,
      `--font-weight-button: ${tokens.shared.fontWeight.button};`,
      `--radius-control: ${tokens.shared.radius.control};`,
    ];
    for (const property of propertiesEmittedOnce) {
      const occurrences = css.split(property).length - 1;
      expect(occurrences).toBe(1);
    }
  });

  it('zeroes motion durations under reduced motion', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce) {');
    expect(css).toContain('--motion-duration-1: 0ms;');
    expect(css).toContain('--motion-duration-3: 0ms;');
    expect(css).toContain('--motion-duration-4: 0ms;');
  });

  it('disables spring overshoot under reduced motion', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce) {');
    expect(css).toContain('--motion-spring-default-damping: 1;');
    expect(css).toContain('--motion-spring-momentum-damping: 1;');
  });

  it('never emits a nested object as a value', () => {
    expect(css).not.toContain('[object Object]');
  });

  it('emits the new colour roles and the material family', () => {
    expect(css).toContain(`--color-link: ${tokens.themes.light.color.link};`);
    expect(css).toContain(`--color-chart-phase-1: ${tokens.themes.light.color.chartPhase1};`);
    expect(css).toContain(`--material-glass-bg: ${tokens.themes.light.material.glassBg};`);
    expect(css).toContain(`--material-glass-blur: ${tokens.shared.material.glassBlur};`);
    expect(css).toContain(`--elevation-3: ${tokens.themes.dark.elevation[3]};`);
  });

  it('emits the scrim in both themes, so a modal backdrop does not invert between them', () => {
    expect(css).toContain(`--color-scrim: ${tokens.themes.light.color.scrim};`);
    expect(css).toContain(`--color-scrim: ${tokens.themes.dark.color.scrim};`);
    expect(tokens.themes.light.color.scrim).not.toBe(tokens.themes.dark.color.scrim);
  });

  it('emits the extended scales', () => {
    expect(css).toContain(`--space-9: ${tokens.shared.space[9]};`);
    expect(css).toContain(`--radius-xl: ${tokens.shared.radius.xl};`);
    expect(css).toContain(`--text-2xs: ${tokens.shared.text['2xs']};`);
    expect(css).toContain(`--leading-prose: ${tokens.shared.leading.prose};`);
    expect(css).toContain(`--focus-ring-offset: ${tokens.shared.focusRingOffset};`);
  });

  it('emits the border-width scale', () => {
    expect(css).toContain(`--border-width-emphasis: ${tokens.shared.borderWidth.emphasis};`);
    expect(css).toContain(`--border-width-strong: ${tokens.shared.borderWidth.strong};`);
  });

  it('keeps single-letter heading prefixes intact in custom property names', () => {
    expect(css).toContain(`--text-h1: ${tokens.shared.text.h1};`);
    expect(css).toContain(`--text-h2: ${tokens.shared.text.h2};`);
    expect(css).toContain(`--text-h2-feature: ${tokens.shared.text.h2Feature};`);
    expect(css).not.toContain('--text-h-1');
  });

  it('emits the page-frame tokens the shell reads at the wide tier', () => {
    const css = tokensToCss(tokens);
    expect(css).toContain('--size-page-max: 75rem;');
    expect(css).toContain('--size-page-max-wide: min(112.5rem, 90vw);');
    expect(css).toContain('--space-page-inline-wide: clamp(4rem, 5vw, 8rem);');
    expect(css).toContain('--text-display: clamp(2.75rem, 2rem + 3.5vw, 4.5rem);');
    expect(css).toContain('--text-display-wide: 5.5rem;');
  });

  it('emits the display and body font roles as the sans stack', () => {
    expect(css).toContain(`--font-display: ${tokens.shared.font.sans};`);
    expect(css).toContain(`--font-body: ${tokens.shared.font.sans};`);
  });

  it('emits the font weight family', () => {
    expect(css).toContain('--font-weight-body: 400;');
    expect(css).toContain('--font-weight-nav-selected: 500;');
    expect(css).toContain('--font-weight-display: 600;');
  });

  it('emits the display font stretch', () => {
    expect(css).toContain('--font-stretch-display: normal;');
  });

  it('emits the display text transform', () => {
    expect(css).toContain('--text-transform-display: none;');
  });

  it('emits the role radii', () => {
    expect(css).toContain('--radius-control: 0.625rem;');
    expect(css).toContain('--radius-option: 0.5rem;');
    expect(css).toContain('--radius-panel: 0.625rem;');
    expect(css).toContain('--radius-popup: 0.75rem;');
    expect(css).toContain('--radius-card: 1rem;');
    expect(css).toContain('--radius-dialog: 1rem;');
  });

  it('emits the role sizes', () => {
    expect(css).toContain('--size-drawer: 28rem;');
    expect(css).toContain('--size-control: 44px;');
    expect(css).toContain('--size-control-sm: 2.5rem;');
    expect(css).toContain('--size-close: 2.25rem;');
  });

  it('emits the selected colour roles in both themes', () => {
    expect(css).toContain(`--color-selected: ${tokens.themes.light.color.accent};`);
    expect(css).toContain(`--color-selected: ${tokens.themes.dark.color.accent};`);
  });

  it('emits a transparent nav selection fill', () => {
    expect(css).toContain('--color-nav-selected: transparent;');
  });

  it('emits all six avatar fills and inks', () => {
    expect(css).toContain('--color-avatar-fill-6:');
    expect(css).toContain('--color-avatar-ink-6:');
  });

  it('emits the shadow family beside the elevations in both themes', () => {
    expect(css).toContain(`--shadow-soft: ${tokens.themes.light.elevation[1]};`);
    expect(css).toContain(`--shadow-sheet: ${tokens.themes.dark.elevation[3]};`);
    expect(css).toContain('--shadow-action: none;');
  });
});

/** The custom property of every leaf in `tree`, named the way the generator names it: `--` plus each key in kebab-case, joined by `-`. */
function leafPropertyNamesOf(tree: object, path: readonly string[] = []): string[] {
  const names: string[] = [];
  for (const [key, value] of Object.entries(tree)) {
    const keyPath = [...path, toKebab(key)];
    if (typeof value === 'object' && value !== null) {
      names.push(...leafPropertyNamesOf(value, keyPath));
    } else {
      names.push(`--${keyPath.join('-')}`);
    }
  }
  return names;
}

describe('tokensToCss completeness', () => {
  const declaredNames = customPropertyNamesOf(tokensToCss(tokens));

  // `tokens.breakpoint` is not walked: it is not part of `shared` or either mode, and the
  // generator never emits it (breakpoints are not custom properties; `findWidthQueryViolations`
  // guards the media queries instead).
  const trees = [
    ['tokens.shared', tokens.shared],
    ['tokens.themes.light', tokens.themes.light],
    ['tokens.themes.dark', tokens.themes.dark],
  ] as const;

  it.each(trees)('declares a custom property for every leaf of %s', (_label, tree) => {
    const leafNames = leafPropertyNamesOf(tree);
    expect(leafNames.length).toBeGreaterThan(0);
    const undeclared = leafNames.filter((name) => !declaredNames.has(name));
    expect(undeclared).toEqual([]);
  });
});
