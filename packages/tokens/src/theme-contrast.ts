import { contrastRatio } from './contrast';
import { themeBrand } from './theme';
import type { ContrastPair, Theme } from './theme';
import { textContrastPairs, uiContrastPairs } from './tokens';
import type { ColorName, ThemeName } from './tokens';

export interface ContrastViolation {
  readonly mode: ThemeName;
  readonly foreground: ColorName;
  readonly background: ColorName;
  /** `ratio` fell short; a colour is not an opaque six-digit hex; an exemption names no listed pair. */
  readonly kind: 'ratio' | 'not-hex' | 'unknown-exemption';
  /** `null` for `not-hex` and `unknown-exemption`. */
  readonly ratio: number | null;
  /** The list's floor (4.5 text, 3 ui); `null` for `unknown-exemption`. */
  readonly required: 3 | 4.5 | null;
}

export interface ExtraContrastPairs {
  readonly text?: ReadonlyArray<ContrastPair>;
  readonly ui?: ReadonlyArray<ContrastPair>;
}

interface PairList {
  readonly pairs: ReadonlyArray<ContrastPair>;
  readonly required: 3 | 4.5;
}

const hexPattern = /^#[0-9A-Fa-f]{6}$/;
const modes = ['light', 'dark'] as const satisfies ReadonlyArray<ThemeName>;

function isHex(value: unknown): value is string {
  return typeof value === 'string' && hexPattern.test(value);
}

/** Colour names never contain a slash, so the joined string names exactly one ordered pair. */
function pairKey([foreground, background]: ContrastPair): string {
  return `${foreground}/${background}`;
}

/**
 * Holds `theme` to the library's contrast pairs plus `extraPairs` (pairs only this theme's values
 * make opaque), in both modes. Pairs in `theme.contrastExemptions` are skipped in both modes; an
 * exemption naming no listed pair is reported, so it cannot outlive its pair.
 *
 * Order (L1-6): text pairs, `extraPairs.text`, ui pairs, `extraPairs.ui`; within a list each pair
 * `light` then `dark`; `unknown-exemption` entries last, one per exemption.
 */
export function checkThemeContrast(
  theme: Theme,
  extraPairs: ExtraContrastPairs = {},
): ContrastViolation[] {
  if (theme[themeBrand] !== true) {
    throw new Error('checkThemeContrast: not a theme made by defineTheme');
  }
  const lists: ReadonlyArray<PairList> = [
    { pairs: textContrastPairs, required: 4.5 },
    { pairs: extraPairs.text ?? [], required: 4.5 },
    { pairs: uiContrastPairs, required: 3 },
    { pairs: extraPairs.ui ?? [], required: 3 },
  ];
  const exemptKeys = new Set(theme.contrastExemptions.map(pairKey));
  const listedKeys = new Set<string>();
  const violations: ContrastViolation[] = [];

  for (const { pairs, required } of lists) {
    for (const pair of pairs) {
      const key = pairKey(pair);
      listedKeys.add(key);
      if (exemptKeys.has(key)) continue;
      const [foreground, background] = pair;
      for (const mode of modes) {
        const foregroundColor: unknown = theme[mode].color[foreground];
        const backgroundColor: unknown = theme[mode].color[background];
        if (!isHex(foregroundColor) || !isHex(backgroundColor)) {
          violations.push({ mode, foreground, background, kind: 'not-hex', ratio: null, required });
          continue;
        }
        const ratio = contrastRatio(foregroundColor, backgroundColor);
        if (ratio < required) {
          violations.push({ mode, foreground, background, kind: 'ratio', ratio, required });
        }
      }
    }
  }

  for (const [foreground, background] of theme.contrastExemptions) {
    if (!listedKeys.has(pairKey([foreground, background]))) {
      violations.push({
        mode: 'light',
        foreground,
        background,
        kind: 'unknown-exemption',
        ratio: null,
        required: null,
      });
    }
  }

  return violations;
}
