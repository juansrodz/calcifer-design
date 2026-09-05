import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../src/contrast';
import { contrastPairs, themes } from '../src/tokens';

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });
  it('returns 1 for identical colours', () => {
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5);
  });
  it('is symmetric', () => {
    expect(contrastRatio('#B4532A', '#FBFAF8')).toBeCloseTo(contrastRatio('#FBFAF8', '#B4532A'), 5);
  });
});

describe('every contrast pair meets WCAG AA in every theme', () => {
  for (const [themeName, theme] of Object.entries(themes)) {
    for (const [foreground, background] of contrastPairs) {
      it(`${themeName}: ${foreground} on ${background}`, () => {
        const ratio = contrastRatio(theme.color[foreground], theme.color[background]);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
