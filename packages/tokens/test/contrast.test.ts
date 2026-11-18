import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../src/contrast';
import { defineTheme } from '../src/theme';
import { checkThemeContrast } from '../src/theme-contrast';
import { textContrastPairs, themes, uiContrastPairs } from '../src/tokens';

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });
  it('returns 1 for identical colours', () => {
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5);
  });
  it('is symmetric', () => {
    expect(contrastRatio('#3B6FE0', '#FBFAF8')).toBeCloseTo(contrastRatio('#FBFAF8', '#3B6FE0'), 5);
  });
});

it('the house theme passes every pair in both modes', () => {
  expect(checkThemeContrast(defineTheme({ className: 'theme-house' }))).toEqual([]);
});

describe('contrast pair lists only name opaque hex colours', () => {
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  for (const [themeName, theme] of Object.entries(themes)) {
    for (const [foreground, background] of [...textContrastPairs, ...uiContrastPairs]) {
      it(`${themeName}: ${foreground}/${background} are hex`, () => {
        expect(theme.color[foreground]).toMatch(hexPattern);
        expect(theme.color[background]).toMatch(hexPattern);
      });
    }
  }
});

/**
 * WCAG 1.4.11: the unchecked checkbox and the radio are known by their boundary alone, so it must
 * reach 3:1 against whatever it sits on. `borderStrong` is a translucent hairline (about 1.4:1 on
 * the raised surface); `borderControl` is the opaque colour a control's boundary reads instead.
 * `surface3` is the deepest surface a control sits on (a pressed row, a nested panel).
 */
describe('the control boundary', () => {
  const controlSurfaces = [
    'surface1',
    'surface2',
    'surface3',
    'surfaceRaised',
    'surfaceInput',
  ] as const;

  for (const [themeName, theme] of Object.entries(themes)) {
    for (const surface of controlSurfaces) {
      it(`${themeName}: borderControl reaches 3:1 on ${surface}`, () => {
        expect(
          contrastRatio(theme.color.borderControl, theme.color[surface]),
        ).toBeGreaterThanOrEqual(3);
      });
    }
  }

  it('is held to 3:1 for every theme, through the ui pair list', () => {
    for (const surface of controlSurfaces) {
      expect(uiContrastPairs).toContainEqual(['borderControl', surface]);
    }
  });
});

/**
 * `danger` is text: a field's error message, a rejected upload's reason, a failed progress bar's
 * helper and the required mark. WCAG 1.4.3 asks 4.5:1 of text, so `danger` is held to 4.5:1 on
 * the four page surfaces those sit on, through the text pair list.
 */
describe('the danger colour as text', () => {
  const textSurfaces = ['surface1', 'surface2', 'surface3', 'surfaceRaised'] as const;

  for (const [themeName, theme] of Object.entries(themes)) {
    for (const surface of textSurfaces) {
      it(`${themeName}: danger reaches 4.5:1 on ${surface}`, () => {
        expect(contrastRatio(theme.color.danger, theme.color[surface])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('is held to 4.5:1 for every theme, through the text pair list', () => {
    for (const surface of textSurfaces) {
      expect(textContrastPairs).toContainEqual(['danger', surface]);
    }
  });

  it('is not also held to the lower 3:1 on those surfaces, through the ui pair list', () => {
    for (const surface of textSurfaces) {
      expect(uiContrastPairs).not.toContainEqual(['danger', surface]);
    }
  });
});

/**
 * An invalid checkbox or radio draws its boundary in `danger` around the input fill
 * (`surfaceInput`). No text is drawn in `danger` on that fill, so the pair stays a non-text one at
 * 3:1 (WCAG 1.4.11).
 */
describe('the danger colour on a field', () => {
  for (const [themeName, theme] of Object.entries(themes)) {
    it(`${themeName}: danger reaches 3:1 on surfaceInput`, () => {
      expect(contrastRatio(theme.color.danger, theme.color.surfaceInput)).toBeGreaterThanOrEqual(3);
    });
  }

  it('is held to 3:1 for every theme, through the ui pair list', () => {
    expect(uiContrastPairs).toContainEqual(['danger', 'surfaceInput']);
  });

  it('is not held to the higher 4.5:1 there, through the text pair list', () => {
    expect(textContrastPairs).not.toContainEqual(['danger', 'surfaceInput']);
  });
});

/**
 * `dangerSurface` and `dangerBorder` are washes of `danger`: its channels at an alpha, as every
 * other wash is its base's. A change to `danger` that leaves them behind would give one family two
 * reds.
 */
describe('the danger washes', () => {
  const rgbaPattern = /^rgba\((\d+), (\d+), (\d+), [\d.]+\)$/;

  function hexChannels(hex: string): string[] {
    return [1, 3, 5].map((start) => String(Number.parseInt(hex.slice(start, start + 2), 16)));
  }

  for (const [themeName, theme] of Object.entries(themes)) {
    for (const wash of ['dangerSurface', 'dangerBorder'] as const) {
      it(`${themeName}: ${wash} carries danger's channels`, () => {
        const match = rgbaPattern.exec(theme.color[wash]);
        expect(match, theme.color[wash]).not.toBeNull();
        expect(match?.slice(1, 4)).toEqual(hexChannels(theme.color.danger));
      });
    }
  }
});
