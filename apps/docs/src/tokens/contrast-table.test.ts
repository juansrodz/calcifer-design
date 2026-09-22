import { contrastRatio, textContrastPairs, themes, uiContrastPairs } from '@calcifer-design/tokens';
import { describe, expect, it } from 'vitest';
import {
  CONTRAST_THRESHOLD,
  contrastPairRows,
  contrastRowsFor,
  isHexColor,
  swatchRows,
  THEME_NAMES,
} from './contrast-table';

describe('isHexColor', () => {
  it('accepts both hex forms and rejects everything contrastRatio cannot parse', () => {
    expect(isHexColor('#FFFFFF')).toBe(true);
    expect(isHexColor('#fff')).toBe(true);
    // The nine tokens that are not plain hex: contrastRatio would return NaN for each.
    expect(isHexColor(themes.light.color.accentSoft)).toBe(false);
    expect(isHexColor(themes.light.color.cardBorder)).toBe(false);
    expect(isHexColor('rgba(0, 0, 0, 0.4)')).toBe(false);
  });
});

describe('contrastPairRows', () => {
  it('renders one row per declared pair, in both themes', () => {
    const rows = contrastPairRows();
    expect(rows).toHaveLength(textContrastPairs.length + uiContrastPairs.length);
    expect(rows).toHaveLength(41);
    for (const row of rows) {
      expect(Object.keys(row.ratios).sort()).toEqual(['dark', 'light']);
    }
  });

  it('holds the thresholds WCAG sets, not one number for everything', () => {
    expect(CONTRAST_THRESHOLD).toEqual({ text: 4.5, ui: 3 });
    const rows = contrastPairRows();
    expect(rows.filter((row) => row.kind === 'text').every((row) => row.threshold === 4.5)).toBe(
      true,
    );
    expect(rows.filter((row) => row.kind === 'ui').every((row) => row.threshold === 3)).toBe(true);
  });

  it('measures the pair in the order it is declared, foreground against background', () => {
    const row = contrastPairRows().find(
      (candidate) => candidate.foreground === 'accentText' && candidate.background === 'accent',
    );
    expect(row?.ratios.light).toBeCloseTo(
      contrastRatio(themes.light.color.accentText, themes.light.color.accent),
      10,
    );
  });

  it('passes every pair in every theme — this is the claim the page makes', () => {
    const failures = contrastPairRows().filter((row) => !row.passes);
    expect(failures.map((row) => `${row.foreground} on ${row.background}`)).toEqual([]);
  });
});

describe('contrastRowsFor', () => {
  it('drops a pair it cannot measure rather than printing NaN', () => {
    expect(contrastRowsFor('ui', [['accentSoft', 'surface1']])).toEqual([]);
  });
});

describe('swatchRows', () => {
  it('lists every colour in the theme, with a luminance for the measurable ones', () => {
    for (const themeName of THEME_NAMES) {
      const rows = swatchRows(themeName);
      expect(rows).toHaveLength(Object.keys(themes[themeName].color).length);
      const text = rows.find((row) => row.name === 'text');
      expect(text?.luminance).toBeGreaterThanOrEqual(0);
      expect(text?.luminance).toBeLessThanOrEqual(1);
      expect(rows.find((row) => row.name === 'accentSoft')?.luminance).toBeUndefined();
    }
  });
});
