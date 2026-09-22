import {
  contrastRatio,
  relativeLuminance,
  textContrastPairs,
  themes,
  uiContrastPairs,
  type ColorName,
  type ThemeName,
} from '@calcifer-design/tokens';

export type ContrastKind = 'text' | 'ui';

/** WCAG 1.4.3 for text, 1.4.11 for non-text UI. Two numbers, and the reason they differ. */
export const CONTRAST_THRESHOLD: Record<ContrastKind, number> = { text: 4.5, ui: 3 };

export const THEME_NAMES: readonly ThemeName[] = ['light', 'dark'];

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * `contrastRatio` parses with `Number.parseInt(hex, 16)` after stripping `#`, so anything else
 * — the nine `rgba(…)` tokens and `transparent` — yields NaN without complaining. None of them
 * is named in the two pair lists today, but this page renders data it does not own, and a NaN
 * in a table cell is a worse failure than a row that is not there.
 */
export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

export interface ContrastPairRow {
  kind: ContrastKind;
  foreground: ColorName;
  background: ColorName;
  threshold: number;
  ratios: Record<ThemeName, number>;
  /** True only when every theme clears the threshold. */
  passes: boolean;
}

/** The pair measured in every theme, or null as soon as one theme's value is not plain hex. */
function ratiosInEveryTheme(
  foreground: ColorName,
  background: ColorName,
): Record<ThemeName, number> | null {
  const ratios = {} as Record<ThemeName, number>;
  for (const themeName of THEME_NAMES) {
    const palette = themes[themeName].color;
    const foregroundValue = palette[foreground];
    const backgroundValue = palette[background];
    if (!isHexColor(foregroundValue) || !isHexColor(backgroundValue)) {
      return null;
    }
    ratios[themeName] = contrastRatio(foregroundValue, backgroundValue);
  }
  return ratios;
}

export function contrastRowsFor(
  kind: ContrastKind,
  pairs: ReadonlyArray<readonly [ColorName, ColorName]>,
): ContrastPairRow[] {
  const threshold = CONTRAST_THRESHOLD[kind];
  const rows: ContrastPairRow[] = [];
  for (const [foreground, background] of pairs) {
    const ratios = ratiosInEveryTheme(foreground, background);
    // An unmeasurable pair is dropped, not printed as NaN (see `isHexColor` above).
    if (ratios === null) {
      continue;
    }
    rows.push({
      kind,
      foreground,
      background,
      threshold,
      ratios,
      passes: THEME_NAMES.every((themeName) => ratios[themeName] >= threshold),
    });
  }
  return rows;
}

/** Every declared pair, text first, measured in every theme. */
export function contrastPairRows(): ContrastPairRow[] {
  return [...contrastRowsFor('text', textContrastPairs), ...contrastRowsFor('ui', uiContrastPairs)];
}

export interface SwatchRow {
  name: ColorName;
  value: string;
  /** 0–1. Absent when the value is not a plain hex, which is the same condition as above. */
  luminance?: number;
}

export function swatchRows(themeName: ThemeName): SwatchRow[] {
  const palette = themes[themeName].color;
  return (Object.keys(palette) as ColorName[]).map((name) => {
    const value = palette[name];
    return isHexColor(value)
      ? { name, value, luminance: relativeLuminance(value) }
      : { name, value };
  });
}
