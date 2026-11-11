import { describe, expect, expectTypeOf, it } from 'vitest';
import { defineTheme, themeBrand } from '../src/theme';
import type { Theme } from '../src/theme';
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
    const theme = defineTheme({
      className: 'theme-x',
      custom: { prefix: 'demo', light: { halo: '#fff' }, dark: { halo: '#000' } },
      contrastExemptions: [['text', 'surface1']],
    });

    expect(Object.isFrozen(theme)).toBe(true);
    expect(Object.isFrozen(theme.light.color)).toBe(true);
    expect(Object.isFrozen(theme.shared.radius)).toBe(true);
    expect(Object.isFrozen(theme.custom)).toBe(true);
    expect(Object.isFrozen(theme.custom.light)).toBe(true);
    expect(Object.isFrozen(theme.contrastExemptions)).toBe(true);
    expect(Object.isFrozen(theme.contrastExemptions[0])).toBe(true);
    expect(Object.isFrozen(tokens.shared.radius)).toBe(false);
  });

  it('rejects a className outside /^[a-z][a-z0-9-]*$/', () => {
    expect(() => defineTheme({ className: 'Theme-X' })).toThrow(
      new Error('defineTheme: className "Theme-X" must match /^[a-z][a-z0-9-]*$/'),
    );
    expect(() => defineTheme({ className: '' })).toThrow(/className ""/);
    expect(() => defineTheme({ className: '1theme' })).toThrow(/className "1theme"/);
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
