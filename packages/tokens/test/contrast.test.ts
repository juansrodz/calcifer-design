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
