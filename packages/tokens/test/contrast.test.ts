import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../src/contrast';
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

describe('text roles meet WCAG AA (4.5:1) in every theme', () => {
  for (const [themeName, theme] of Object.entries(themes)) {
    for (const [foreground, background] of textContrastPairs) {
      it(`${themeName}: ${foreground} on ${background}`, () => {
        const ratio = contrastRatio(theme.color[foreground], theme.color[background]);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe('non-text UI roles meet WCAG 1.4.11 (3:1) in every theme', () => {
  for (const [themeName, theme] of Object.entries(themes)) {
    for (const [foreground, background] of uiContrastPairs) {
      it(`${themeName}: ${foreground} on ${background}`, () => {
        const ratio = contrastRatio(theme.color[foreground], theme.color[background]);
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    }
  }
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
