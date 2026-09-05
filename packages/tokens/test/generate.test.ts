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
    expect(css).toContain('@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {');
    expect(css).toContain(`--color-surface-1: ${tokens.themes.dark.color.surface1};`);
  });

  it('emits shared tokens once', () => {
    expect(css).toContain(`--space-4: ${tokens.shared.space[4]};`);
    expect(css).toContain(`--font-sans: ${tokens.shared.font.sans};`);
    expect(css).toContain(`--size-touch: ${tokens.shared.size.touch};`);
    expect(css).toContain(`--motion-duration-2: ${tokens.shared.motion.duration[2]};`);
  });

  it('zeroes motion durations under reduced motion', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce) {');
    expect(css).toContain('--motion-duration-1: 0ms;');
    expect(css).toContain('--motion-duration-3: 0ms;');
    expect(css).toContain('--motion-duration-4: 0ms;');
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
});
