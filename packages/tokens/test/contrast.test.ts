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
 * An invalid checkbox or radio draws its boundary in `danger` around the input fill
 * (`surfaceInput`), so `danger` is held to 3:1 there as well as on the four page surfaces.
 */
describe('the danger colour on a field', () => {
  for (const [themeName, theme] of Object.entries(themes)) {
    it(`${themeName}: danger reaches 3:1 on surfaceInput`, () => {
      expect(
        contrastRatio(theme.color.danger, theme.color.surfaceInput),
      ).toBeGreaterThanOrEqual(3);
    });
  }

  it('is held to 3:1 for every theme, through the ui pair list', () => {
    expect(uiContrastPairs).toContainEqual(['danger', 'surfaceInput']);
  });
});
