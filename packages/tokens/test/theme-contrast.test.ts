import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../src/contrast';
import { defineTheme, themeBrand } from '../src/theme';
import type { Theme } from '../src/theme';
import { checkThemeContrast } from '../src/theme-contrast';

const surfaceNames = ['surface1', 'surface2', 'surface3', 'surfaceRaised'] as const;

/** What a light `accent` that is not an opaque six-digit hex reports, in list order (text list first). */
const accentNotHexViolations = [
  {
    mode: 'light',
    foreground: 'accentText',
    background: 'accent',
    kind: 'not-hex',
    ratio: null,
    required: 4.5,
  },
  ...surfaceNames.map((background) => ({
    mode: 'light',
    foreground: 'accent',
    background,
    kind: 'not-hex',
    ratio: null,
    required: 3,
  })),
];

describe('checkThemeContrast', () => {
  it('reports nothing for the house theme', () => {
    expect(checkThemeContrast(defineTheme({ className: 'theme-house' }))).toEqual([]);
  });

  it('reports the four textMuted text pairs for a failing light textMuted, in list order, light only', () => {
    const theme = defineTheme({
      className: 'theme-faint',
      light: { color: { textMuted: '#AAAAAA' } },
    });

    const violations = checkThemeContrast(theme);

    expect(
      violations.map(({ mode, foreground, background, kind, required }) => ({
        mode,
        foreground,
        background,
        kind,
        required,
      })),
    ).toEqual(
      surfaceNames.map((background) => ({
        mode: 'light',
        foreground: 'textMuted',
        background,
        kind: 'ratio',
        required: 4.5,
      })),
    );
    for (const violation of violations) {
      expect(violation.ratio).toBeCloseTo(
        contrastRatio('#AAAAAA', theme.light.color[violation.background]),
        10,
      );
      expect(violation.ratio).toBeLessThan(4.5);
    }
  });

  it('reports one not-hex entry per pair for a non-hex accent, text list first then ui list', () => {
    const theme = defineTheme({
      className: 'theme-translucent',
      light: { color: { accent: 'rgba(0, 0, 0, 0.5)' } },
    });

    expect(checkThemeContrast(theme)).toEqual(accentNotHexViolations);
  });

  it.each(['#FFF', '#12345678'])(
    'treats %s as not-hex: only an opaque six-digit hex is measured',
    (accentValue) => {
      const theme = defineTheme({
        className: 'theme-hex-shape',
        light: { color: { accent: accentValue } },
      });

      expect(checkThemeContrast(theme)).toEqual(accentNotHexViolations);
    },
  );

  it('measures a lowercase six-digit hex', () => {
    const theme = defineTheme({
      className: 'theme-lowercase',
      light: { color: { accent: '#1f7a3e' } },
    });

    const violations = checkThemeContrast(theme);

    expect(violations.filter((violation) => violation.kind === 'not-hex')).toEqual([]);
  });

  it('skips an exempt pair in both modes and still reports the others', () => {
    const theme = defineTheme({
      className: 'theme-exempt',
      light: { color: { textMuted: '#AAAAAA' } },
      dark: { color: { textMuted: '#555555' } },
      contrastExemptions: [['textMuted', 'surface1']],
    });

    const violations = checkThemeContrast(theme);

    expect(
      violations.map(({ mode, foreground, background }) => `${mode}:${foreground}/${background}`),
    ).toEqual([
      'light:textMuted/surface2',
      'dark:textMuted/surface2',
      'light:textMuted/surface3',
      'dark:textMuted/surface3',
      'light:textMuted/surfaceRaised',
      'dark:textMuted/surfaceRaised',
    ]);
  });

  it('matches an exemption as the ordered [foreground, background] tuple', () => {
    const theme = defineTheme({
      className: 'theme-reversed',
      light: { color: { textMuted: '#AAAAAA' } },
      contrastExemptions: [['surface1', 'textMuted']],
    });

    const violations = checkThemeContrast(theme);

    expect(violations.filter((violation) => violation.kind === 'ratio')).toHaveLength(4);
    expect(violations.at(-1)).toEqual({
      mode: 'light',
      foreground: 'surface1',
      background: 'textMuted',
      kind: 'unknown-exemption',
      ratio: null,
      required: null,
    });
  });

  it('reports an exemption naming no listed pair as unknown-exemption, last', () => {
    const theme = defineTheme({
      className: 'theme-stale',
      light: { color: { textMuted: '#AAAAAA' } },
      contrastExemptions: [['textMuted', 'accentWash']],
    });

    const violations = checkThemeContrast(theme);

    expect(violations).toHaveLength(5);
    expect(violations.slice(0, 4).every((violation) => violation.kind === 'ratio')).toBe(true);
    expect(violations[4]).toEqual({
      mode: 'light',
      foreground: 'textMuted',
      background: 'accentWash',
      kind: 'unknown-exemption',
      ratio: null,
      required: null,
    });
  });

  it('reports one unknown-exemption per stale exemption, in the order given', () => {
    const theme = defineTheme({
      className: 'theme-stale-two',
      contrastExemptions: [
        ['textMuted', 'accentWash'],
        ['text', 'surface1'],
        ['danger', 'accentWash'],
      ],
    });

    expect(checkThemeContrast(theme)).toEqual([
      {
        mode: 'light',
        foreground: 'textMuted',
        background: 'accentWash',
        kind: 'unknown-exemption',
        ratio: null,
        required: null,
      },
      {
        mode: 'light',
        foreground: 'danger',
        background: 'accentWash',
        kind: 'unknown-exemption',
        ratio: null,
        required: null,
      },
    ]);
  });

  describe('extraPairs', () => {
    it('reports a not-hex entry in both modes for a pair the default values make translucent', () => {
      const theme = defineTheme({ className: 'theme-house' });

      expect(checkThemeContrast(theme, { text: [['selectedSoftText', 'selectedSoft']] })).toEqual([
        {
          mode: 'light',
          foreground: 'selectedSoftText',
          background: 'selectedSoft',
          kind: 'not-hex',
          ratio: null,
          required: 4.5,
        },
        {
          mode: 'dark',
          foreground: 'selectedSoftText',
          background: 'selectedSoft',
          kind: 'not-hex',
          ratio: null,
          required: 4.5,
        },
      ]);
    });

    it('passes the same pair once the theme makes it opaque', () => {
      const theme = defineTheme({
        className: 'theme-opaque',
        light: { color: { selectedSoft: '#F1E9FE' } },
        dark: { color: { selectedSoft: '#34145C' } },
      });

      expect(checkThemeContrast(theme, { text: [['selectedSoftText', 'selectedSoft']] })).toEqual(
        [],
      );
    });

    it('holds extra text pairs to 4.5 and extra ui pairs to 3', () => {
      // White on #777777 is 4.48:1: under the text floor, over the ui floor.
      const theme = defineTheme({
        className: 'theme-extra',
        light: { color: { selectedSoft: '#777777', selectedSoftText: '#FFFFFF' } },
        dark: { color: { selectedSoft: '#000000', selectedSoftText: '#FFFFFF' } },
      });
      const pair = ['selectedSoftText', 'selectedSoft'] as const;

      const asText = checkThemeContrast(theme, { text: [pair] });
      const asUi = checkThemeContrast(theme, { ui: [pair] });

      expect(asText).toHaveLength(1);
      expect(asText[0]).toMatchObject({
        mode: 'light',
        foreground: 'selectedSoftText',
        background: 'selectedSoft',
        kind: 'ratio',
        required: 4.5,
      });
      expect(asText[0]?.ratio).toBeCloseTo(contrastRatio('#FFFFFF', '#777777'), 10);
      expect(asText[0]?.ratio).toBeLessThan(4.5);
      expect(asUi).toEqual([]);
    });

    it('reports in the order text, extra text, ui, extra ui, then unknown exemptions', () => {
      const theme = defineTheme({
        className: 'theme-order',
        light: {
          color: {
            textMuted: '#AAAAAA',
            neutral: '#FFFFFF',
            selectedSoft: '#777777',
            selectedSoftText: '#FFFFFF',
            inverseSoft: '#777777',
            inverseSoftText: '#888888',
          },
        },
        dark: {
          color: {
            selectedSoft: '#000000',
            selectedSoftText: '#FFFFFF',
            inverseSoft: '#000000',
            inverseSoftText: '#FFFFFF',
          },
        },
        contrastExemptions: [['textMuted', 'accentWash']],
      });

      const violations = checkThemeContrast(theme, {
        // Passed in the reverse of the expected order, so the order comes from the lists, not the object.
        ui: [['inverseSoftText', 'inverseSoft']],
        text: [['selectedSoftText', 'selectedSoft']],
      });

      expect(
        violations.map(
          ({ mode, foreground, background, kind, required }) =>
            `${mode}:${foreground}/${background}:${kind}:${required}`,
        ),
      ).toEqual([
        'light:textMuted/surface1:ratio:4.5',
        'light:textMuted/surface2:ratio:4.5',
        'light:textMuted/surface3:ratio:4.5',
        'light:textMuted/surfaceRaised:ratio:4.5',
        'light:selectedSoftText/selectedSoft:ratio:4.5',
        'light:neutral/surface1:ratio:3',
        'light:neutral/surface2:ratio:3',
        'light:inverseSoftText/inverseSoft:ratio:3',
        'light:textMuted/accentWash:unknown-exemption:null',
      ]);
    });

    it('lets an exemption name an extra pair, and does not call it unknown', () => {
      const theme = defineTheme({
        className: 'theme-exempt-extra',
        contrastExemptions: [['selectedSoftText', 'selectedSoft']],
      });

      expect(checkThemeContrast(theme, { text: [['selectedSoftText', 'selectedSoft']] })).toEqual(
        [],
      );
    });

    it('calls an exemption naming an extra pair unknown when the extra pair is not passed', () => {
      const theme = defineTheme({
        className: 'theme-exempt-extra-missing',
        contrastExemptions: [['selectedSoftText', 'selectedSoft']],
      });

      expect(checkThemeContrast(theme)).toEqual([
        {
          mode: 'light',
          foreground: 'selectedSoftText',
          background: 'selectedSoft',
          kind: 'unknown-exemption',
          ratio: null,
          required: null,
        },
      ]);
    });
  });

  it('does not dedupe a pair that appears in two lists', () => {
    const theme = defineTheme({
      className: 'theme-twice',
      light: { color: { textMuted: '#AAAAAA' } },
    });

    const violations = checkThemeContrast(theme, { text: [['textMuted', 'surface1']] });

    const occurrences = violations.filter(
      (violation) => violation.foreground === 'textMuted' && violation.background === 'surface1',
    );
    expect(occurrences).toHaveLength(2);
    for (const occurrence of occurrences) {
      expect(occurrence).toMatchObject({ mode: 'light', kind: 'ratio', required: 4.5 });
    }
  });

  it('holds borderControl to 3:1 on surface3, the deepest surface a control sits on', () => {
    // A dark surface3 one step too light for the house control border: 2.74:1.
    const theme = defineTheme({
      className: 'theme-deep-surface3',
      dark: { color: { surface3: '#4A4A51' } },
    });

    const borderViolations = checkThemeContrast(theme).filter(
      (violation) => violation.foreground === 'borderControl',
    );

    expect(borderViolations).toEqual([
      {
        mode: 'dark',
        foreground: 'borderControl',
        background: 'surface3',
        kind: 'ratio',
        ratio: contrastRatio(theme.dark.color.borderControl, theme.dark.color.surface3),
        required: 3,
      },
    ]);
  });

  it('holds danger to 3:1 on surfaceInput, the fill an invalid checkbox draws it around', () => {
    const theme = defineTheme({
      className: 'theme-red-input',
      light: { color: { surfaceInput: '#E06060' } },
    });

    const dangerViolations = checkThemeContrast(theme).filter(
      (violation) => violation.foreground === 'danger',
    );

    expect(dangerViolations).toEqual([
      {
        mode: 'light',
        foreground: 'danger',
        background: 'surfaceInput',
        kind: 'ratio',
        ratio: contrastRatio(theme.light.color.danger, theme.light.color.surfaceInput),
        required: 3,
      },
    ]);
  });

  it('holds danger to 4.5:1 as text on the page surfaces, and reports where it falls short', () => {
    // The light danger before tokens 0.6.0: 4.24:1 on surface2 and 3.91:1 on surface3, but over
    // 4.5:1 on surface1 and surfaceRaised, and over 3:1 on surfaceInput.
    const theme = defineTheme({
      className: 'theme-old-danger',
      light: { color: { danger: '#D23B3B' } },
    });

    const dangerViolations = checkThemeContrast(theme).filter(
      (violation) => violation.foreground === 'danger',
    );

    expect(dangerViolations).toEqual(
      (['surface2', 'surface3'] as const).map((background) => ({
        mode: 'light',
        foreground: 'danger',
        background,
        kind: 'ratio',
        ratio: contrastRatio(theme.light.color.danger, theme.light.color[background]),
        required: 4.5,
      })),
    );
  });

  it('throws for an object defineTheme did not make', () => {
    const house = defineTheme({ className: 'theme-house' });
    // Object.entries lists string keys only, so the brand symbol is left behind.
    const handWritten = Object.fromEntries(Object.entries(house)) as unknown as Theme;

    expect(themeBrand in handWritten).toBe(false);
    expect(() => checkThemeContrast(handWritten)).toThrow(
      new Error('checkThemeContrast: not a theme made by defineTheme'),
    );
  });
});
