import { describe, expect, it } from 'vitest';
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
});
