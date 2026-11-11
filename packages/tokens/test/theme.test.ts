import { describe, expect, expectTypeOf, it } from 'vitest';
import { themeToCss, tokensToCss } from '../src/generate';
import { defineTheme, themeBrand } from '../src/theme';
import type { ContrastPair, Theme } from '../src/theme';
import { tokens } from '../src/tokens';
import type { ElevationName, FontName, RadiusName, ShadowName, SizeName } from '../src/tokens';

describe('theme names', () => {
  it('the name types', () => {
    expectTypeOf<FontName>().toEqualTypeOf<'sans' | 'mono' | 'display' | 'body'>();
    expectTypeOf<'dialog'>().toExtend<RadiusName>();
    expectTypeOf<'controlSm'>().toExtend<SizeName>();
    expectTypeOf<ElevationName>().toEqualTypeOf<1 | 2 | 3>();
    expectTypeOf<ShadowName>().toEqualTypeOf<
      | 'soft'
      | 'chip'
      | 'raised'
      | 'dialog'
      | 'drawer'
      | 'sheet'
      | 'tabBar'
      | 'action'
      | 'actionInverse'
      | 'segmented'
    >();
    // @ts-expect-error a dark shadow set missing a key does not compile
    const _brokenDarkShadow = { soft: 'x' } as const satisfies Record<ShadowName, string>;
  });
});

describe('defineTheme', () => {
  it('fills every absent part with the package defaults', () => {
    const theme = defineTheme({ className: 'theme-x' });

    expect(theme.className).toBe('theme-x');
    expect(theme.shared).toEqual(tokens.shared);
    expect(theme.light.color.accent).toBe(tokens.themes.light.color.accent);
    expect(theme.dark).toEqual(tokens.themes.dark);
    expect(theme.custom).toEqual({ prefix: null, shared: {}, light: {}, dark: {} });
    expect(theme.contrastExemptions).toEqual([]);
    expect(theme[themeBrand]).toBe(true);
  });

  it('replaces only the overridden leaves and never mutates the package tokens', () => {
    const theme = defineTheme({
      className: 'theme-x',
      shared: { radius: { control: '999px' } },
      light: { color: { accent: '#1F7A3E' } },
    });

    expect(theme.shared.radius.control).toBe('999px');
    expect(theme.shared.radius.md).toBe(tokens.shared.radius.md);
    expect(theme.light.color.accent).toBe('#1F7A3E');
    expect(theme.light.color.accentHover).toBe(tokens.themes.light.color.accentHover);
    expect(theme.dark.color.accent).toBe(tokens.themes.dark.color.accent);
    expect(tokens.shared.radius.control).toBe('0.625rem');
    expect(tokens.themes.light.color.accent).not.toBe('#1F7A3E');
  });

  it('deep-freezes the result', () => {
    const exemptionPair: ContrastPair = ['text', 'surface1'];
    const exemptions: ContrastPair[] = [exemptionPair];
    const theme = defineTheme({
      className: 'theme-x',
      custom: { prefix: 'demo', light: { halo: '#fff' }, dark: { halo: '#000' } },
      contrastExemptions: exemptions,
    });

    expect(Object.isFrozen(theme)).toBe(true);
    expect(Object.isFrozen(theme.light.color)).toBe(true);
    expect(Object.isFrozen(theme.shared.radius)).toBe(true);
    expect(Object.isFrozen(theme.custom)).toBe(true);
    expect(Object.isFrozen(theme.custom.light)).toBe(true);
    expect(theme.contrastExemptions).toEqual([['text', 'surface1']]);
    expect(Object.isFrozen(theme.contrastExemptions)).toBe(true);
    expect(Object.isFrozen(theme.contrastExemptions[0])).toBe(true);
    expect(Object.isFrozen(tokens.shared.radius)).toBe(false);
  });

  it("leaves the caller's exemptions unfrozen", () => {
    const exemptionPair: ContrastPair = ['text', 'surface1'];
    const exemptions: ContrastPair[] = [exemptionPair];
    const theme = defineTheme({ className: 'theme-x', contrastExemptions: exemptions });

    expect(theme.contrastExemptions).not.toBe(exemptions);
    expect(theme.contrastExemptions[0]).not.toBe(exemptionPair);
    expect(Object.isFrozen(exemptions)).toBe(false);
    expect(Object.isFrozen(exemptionPair)).toBe(false);
  });

  it('rejects a className outside /^[a-z][a-z0-9-]*$/', () => {
    expect(() => defineTheme({ className: 'Theme-X' })).toThrow(
      new Error('defineTheme: className "Theme-X" must match /^[a-z][a-z0-9-]*$/'),
    );
    expect(() => defineTheme({ className: '' })).toThrow(/className ""/);
    expect(() => defineTheme({ className: '1theme' })).toThrow(/className "1theme"/);
  });

  it('rejects a className that is not a string, with the same sentence', () => {
    expect(() => defineTheme({ className: undefined as unknown as string })).toThrow(
      new Error('defineTheme: className "undefined" must match /^[a-z][a-z0-9-]*$/'),
    );
    expect(() => defineTheme({ className: null as unknown as string })).toThrow(/className "null"/);
  });

  it('rejects a custom.prefix that is not a string, with the same sentence', () => {
    expect(() =>
      defineTheme({
        className: 'theme-x',
        custom: { prefix: 42 as unknown as string, light: {}, dark: {} },
      }),
    ).toThrow(new Error('defineTheme: custom.prefix "42" must match /^[a-z][a-z0-9]*$/'));
    expect(() =>
      defineTheme({
        className: 'theme-x',
        custom: { prefix: undefined as unknown as string, light: {}, dark: {} },
      }),
    ).toThrow(/custom\.prefix "undefined"/);
  });

  it('rejects a custom.prefix outside /^[a-z][a-z0-9]*$/', () => {
    expect(() =>
      defineTheme({ className: 'theme-x', custom: { prefix: 'my-brand', light: {}, dark: {} } }),
    ).toThrow(new Error('defineTheme: custom.prefix "my-brand" must match /^[a-z][a-z0-9]*$/'));
  });

  it('carries the custom tokens under custom.light and custom.dark', () => {
    const theme = defineTheme({
      className: 'theme-x',
      custom: { prefix: 'demo', light: { halo: '#fff' }, dark: { halo: '#000' } },
    });

    expect(theme.custom.prefix).toBe('demo');
    expect(theme.custom.light.halo).toBe('#fff');
    expect(theme.custom.dark.halo).toBe('#000');
  });

  it('gives a custom without shared an empty shared, never undefined (L1-5)', () => {
    const theme = defineTheme({
      className: 'theme-x',
      custom: { prefix: 'demo', light: { halo: '#fff' }, dark: { halo: '#000' } },
    });

    expect(theme.custom.shared).toEqual({});
  });

  it('keeps the custom shared tokens when given', () => {
    const theme = defineTheme({
      className: 'theme-x',
      custom: { prefix: 'demo', shared: { glow: '0 0 4px red' }, light: {}, dark: {} },
    });

    expect(theme.custom.shared).toEqual({ glow: '0 0 4px red' });
  });

  it('is branded with a plain Symbol, not a registry symbol (L1-13)', () => {
    expect(themeBrand.description).toBe('calcifer-design-theme');
    expect(Symbol.keyFor(themeBrand)).toBeUndefined();
  });

  it('rejects what only the types can see', () => {
    // @ts-expect-error a misspelt shared key does not compile
    defineTheme({ className: 'theme-x', shared: { radius: { contorl: '1rem' } } });

    // A spread is not a fresh literal, so only NoExtraKeys can reject the misspelling beside a valid key.
    const overrides = { ...{ radius: { md: '1rem', contorl: '1rem' } } };
    // @ts-expect-error a misspelt key on a spread object does not compile
    defineTheme({ className: 'theme-x', shared: overrides });

    defineTheme({
      className: 'theme-x',
      // @ts-expect-error a custom key missing on one side does not compile
      custom: { prefix: 'p', light: { halo: '#fff' }, dark: {} },
    });

    const custom = { ...{ prefix: 'p', light: { halo: '#fff' }, dark: {} } };
    // @ts-expect-error a custom key missing on one side of a spread does not compile
    defineTheme({ className: 'theme-x', custom });

    // @ts-expect-error a number leaf does not compile
    defineTheme({ className: 'theme-x', light: { color: { accent: 1 } } });

    const validOverrides = { ...{ radius: { md: '1rem' } } };
    expect(defineTheme({ className: 'theme-x', shared: validOverrides }).shared.radius.md).toBe(
      '1rem',
    );

    const themed = defineTheme({
      className: 'theme-x',
      custom: { prefix: 'p', light: { halo: '#fff' }, dark: { halo: '#000' } },
    });
    expectTypeOf(themed).toEqualTypeOf<Theme<'halo'>>();
  });
});

describe('themeToCss', () => {
  const css = themeToCss(
    defineTheme({
      className: 'theme-x',
      light: { color: { accent: '#1F7A3E' } },
      dark: { color: { accent: '#6FCF8E' } },
      custom: {
        prefix: 'demo',
        shared: { glow: '0 0 4px red' },
        light: { halo: '#FDE68A' },
        dark: { halo: '#4A3A00' },
      },
    }),
  );

  const baseSelector = '.theme-x';
  const hostDarkSelector = ':root[data-theme="dark"] .theme-x';
  const mediaDarkSelector = ':root:not([data-theme="light"]) .theme-x';
  const pinnedLightSelector = ':root .theme-x[data-theme="light"]';
  const pinnedDarkSelector = ':root .theme-x[data-theme="dark"]';

  function escapePattern(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** The body of the block opened by `selector` at `indent`, up to its closing brace. */
  function bodyOf(sheet: string, selector: string, indent = ''): string {
    const pattern = new RegExp(
      `(?:^|\n)${escapePattern(indent + selector)} \\{\n([\\s\\S]*?)\n${indent}\\}`,
    );
    const match = pattern.exec(sheet);
    if (match === null) throw new Error(`no block for ${selector}`);
    return match[1] ?? '';
  }

  function colorSchemesIn(body: string): string[] {
    return [...body.matchAll(/^\s*color-scheme: ([a-z ]+);$/gm)].map((match) => match[1] ?? '');
  }

  function declaredNamesIn(sheet: string): Set<string> {
    return new Set([...sheet.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((match) => match[1] ?? ''));
  }

  it('opens with the generated header naming the scope class', () => {
    expect(css.split('\n')[0]).toBe(
      '/* Generated by @calcifer-design/tokens themeToCss for ".theme-x". Do not edit. */',
    );
  });

  it('writes the six selectors in the stated order', () => {
    const positions = [
      '\n.theme-x {',
      '\n:root[data-theme="dark"] .theme-x {',
      '\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) .theme-x {',
      '\n:root .theme-x[data-theme="light"] {',
      '\n:root .theme-x[data-theme="dark"] {',
      '\n@media (prefers-reduced-motion: reduce) {\n  .theme-x {',
    ].map((selector) => css.indexOf(selector));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((first, second) => first - second));
    expect(new Set(positions).size).toBe(6);
  });

  it('resolves color-scheme per block, and leaves it out of the reduced-motion block', () => {
    expect(colorSchemesIn(bodyOf(css, baseSelector))).toEqual(['light']);
    expect(colorSchemesIn(bodyOf(css, hostDarkSelector))).toEqual(['dark']);
    expect(colorSchemesIn(bodyOf(css, mediaDarkSelector, '  '))).toEqual(['dark']);
    expect(colorSchemesIn(bodyOf(css, pinnedLightSelector))).toEqual(['light']);
    expect(colorSchemesIn(bodyOf(css, pinnedDarkSelector))).toEqual(['dark']);
    expect(colorSchemesIn(bodyOf(css, baseSelector, '  '))).toEqual([]);
  });

  it('puts the whole shared set, the light mode and the custom tokens in the base block', () => {
    const base = bodyOf(css, baseSelector);
    expect(base).toContain('--color-accent: #1F7A3E;');
    expect(base).toContain('--demo-glow: 0 0 4px red;');
    expect(base).toContain('--demo-halo: #FDE68A;');
    expect(base).toContain('--space-4: 1rem;');
  });

  it('puts only the dark mode and the custom dark tokens in the three dark blocks', () => {
    for (const body of [
      bodyOf(css, hostDarkSelector),
      bodyOf(css, mediaDarkSelector, '  '),
      bodyOf(css, pinnedDarkSelector),
    ]) {
      expect(body).toContain('--color-accent: #6FCF8E;');
      expect(body).toContain('--demo-halo: #4A3A00;');
      expect(body).not.toContain('--space-');
      expect(body).not.toContain('--demo-glow');
    }
  });

  it('puts only the light mode and the custom light tokens in the pinned light block', () => {
    const pinnedLight = bodyOf(css, pinnedLightSelector);
    expect(pinnedLight).toContain('--color-accent: #1F7A3E;');
    expect(pinnedLight).toContain('--demo-halo: #FDE68A;');
    expect(pinnedLight).not.toContain('--space-');
  });

  it('declares exactly the names tokens.css declares in the base block (C13)', () => {
    const baseOfDefault = bodyOf(themeToCss(defineTheme({ className: 'theme-x' })), baseSelector);
    const scoped = declaredNamesIn(baseOfDefault);
    const global = declaredNamesIn(tokensToCss(tokens));
    expect([...global].filter((name) => !scoped.has(name))).toEqual([]);
    expect([...scoped].filter((name) => !global.has(name))).toEqual([]);
  });

  it('emits no custom line for a theme without custom tokens', () => {
    const plain = themeToCss(defineTheme({ className: 'theme-x' }));
    expect(plain).not.toContain('null');
    expect(plain).not.toMatch(/\n\n\n|\{\n\n|\n\n\s*\}/);
  });

  it('leaves no blank line behind an empty custom set', () => {
    const onlyShared = themeToCss(
      defineTheme({
        className: 'theme-x',
        custom: { prefix: 'demo', shared: { glow: '0 0 4px red' }, light: {}, dark: {} },
      }),
    );
    expect(bodyOf(onlyShared, baseSelector)).toContain('--demo-glow: 0 0 4px red;');
    expect(onlyShared).not.toMatch(/\n\n\n|\{\n\n|\n\n\s*\}/);
    expect(bodyOf(onlyShared, hostDarkSelector)).not.toContain('--demo-');
    expect(bodyOf(onlyShared, pinnedLightSelector)).not.toContain('--demo-');

    const onlyLightAndDark = themeToCss(
      defineTheme({
        className: 'theme-x',
        custom: { prefix: 'demo', light: { halo: '#FDE68A' }, dark: { halo: '#4A3A00' } },
      }),
    );
    expect(onlyLightAndDark).toContain('--demo-halo: #FDE68A;');
    expect(onlyLightAndDark).not.toMatch(/\n\n\n|\{\n\n|\n\n\s*\}/);
    expect(onlyLightAndDark).not.toContain('--demo-glow');
  });

  it('ends with a single newline', () => {
    expect(css.endsWith('}\n')).toBe(true);
    expect(css.endsWith('\n\n')).toBe(false);
  });

  it('refuses an object defineTheme did not make', () => {
    expect(() => themeToCss({ className: 'theme-x' } as unknown as Theme)).toThrow(
      'themeToCss: not a theme made by defineTheme',
    );
  });
});
