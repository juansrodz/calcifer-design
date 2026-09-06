export const breakpoint = {
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
  /** Revised mock: "wide" tier at 1800px — wider page frame, larger gutters. */
  '2xl': '112.5rem',
} as const;

export type BreakpointName = keyof typeof breakpoint;

const lightColor = {
  surface1: '#FBFAF8',
  surfaceRaised: '#FFFFFF',
  surface2: '#F4F2EE',
  surface3: '#ECE9E3',
  surfaceInput: '#FFFFFF',
  surfaceInverse: '#1C1917',
  text: '#1C1917',
  textMuted: '#57534E',
  textSubtle: '#6B6560',
  textInverse: '#FFFFFF',
  link: '#2F5FCC',
  accent: '#3B6FE0',
  accentHover: '#2F5FCC',
  accentText: '#FFFFFF',
  accentSoft: 'rgba(59, 111, 224, 0.14)',
  border: 'rgba(28, 25, 23, 0.08)',
  borderStrong: 'rgba(28, 25, 23, 0.18)',
  borderAccent: 'rgba(59, 111, 224, 0.28)',
  cardBorder: 'transparent',
  focus: '#3B6FE0',
  success: '#1F8A5B',
  warning: '#B7791F',
  danger: '#D23B3B',
  dangerSurface: 'rgba(210, 59, 59, 0.06)',
  dangerBorder: 'rgba(210, 59, 59, 0.35)',
  neutral: '#8A8580',
  chartPhase1: '#C9D6F5',
  chartPhase2: '#3B6FE0',
  chartPhase3: '#8FAAEB',
  chartPhase4: '#1F8A5B',
} as const;

export type ColorName = keyof typeof lightColor;

const darkColor = {
  surface1: '#0B0D12',
  surfaceRaised: '#111420',
  surface2: '#171B28',
  surface3: '#1F2434',
  surfaceInput: '#171B28',
  surfaceInverse: '#EDEEF2',
  text: '#EDEEF2',
  textMuted: '#A8ADB8',
  textSubtle: '#8A909C',
  textInverse: '#0B0D12',
  link: '#9DB8F7',
  accent: '#7FA4F5',
  accentHover: '#98B6F8',
  accentText: '#0B0D12',
  accentSoft: 'rgba(127, 164, 245, 0.18)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  borderAccent: 'rgba(127, 164, 245, 0.32)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  focus: '#7FA4F5',
  success: '#4FC38A',
  warning: '#E0B04A',
  danger: '#F07070',
  dangerSurface: 'rgba(240, 112, 112, 0.10)',
  dangerBorder: 'rgba(240, 112, 112, 0.35)',
  neutral: '#6B7280',
  chartPhase1: '#2B3652',
  chartPhase2: '#7FA4F5',
  chartPhase3: '#4E6BB0',
  chartPhase4: '#4FC38A',
} as const satisfies Record<ColorName, string>;

export const themes = {
  light: {
    color: lightColor,
    elevation: {
      1: '0 2px 8px rgba(28, 25, 23, 0.05), 0 8px 24px rgba(28, 25, 23, 0.05)',
      2: '0 6px 16px rgba(28, 25, 23, 0.07), 0 20px 48px rgba(28, 25, 23, 0.08)',
      3: '0 16px 40px rgba(28, 25, 23, 0.10), 0 2px 6px rgba(28, 25, 23, 0.06)',
    },
    material: { glassBg: 'rgba(251, 250, 248, 0.78)' },
  },
  dark: {
    color: darkColor,
    elevation: {
      1: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      2: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.18)',
      3: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 16px 40px rgba(0, 0, 0, 0.5)',
    },
    material: { glassBg: 'rgba(11, 13, 18, 0.78)' },
  },
} as const;

export type ThemeName = keyof typeof themes;

export const shared = {
  font: {
    sans: '"Geist Variable", "Geist", -apple-system, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif',
    mono: '"Geist Mono Variable", "Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  },
  text: {
    '2xs': '0.6875rem',
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: 'clamp(1.125rem, 1.05rem + 0.4vw, 1.25rem)',
    statement: 'clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)',
    h3: '1.25rem',
    h2Feature: '1.75rem',
    h2: 'clamp(1.875rem, 1.6rem + 1.25vw, 2.5rem)',
    h1: 'clamp(2.25rem, 1.75rem + 2.5vw, 3.5rem)',
    display: 'clamp(2.75rem, 2rem + 3.5vw, 5.5rem)',
  },
  leading: { display: '1.05', tight: '1.15', snug: '1.3', prose: '1.55', body: '1.6' },
  tracking: { display: '-0.03em', h1: '-0.025em', heading: '-0.015em', body: '0', wide: '0.08em' },
  space: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.5rem',
    6: '2rem',
    7: '3rem',
    8: '4rem',
    9: '6rem',
    10: '8rem',
    /** Page side padding at the wide tier: the mock's clamp(64px, 5vw, 128px). */
    pageInlineWide: 'clamp(4rem, 5vw, 8rem)',
  },
  radius: { sm: '0.5rem', md: '0.625rem', lg: '0.75rem', xl: '1rem', full: '999px' },
  /**
   * Border widths above the hairline default: `emphasis` is the active/selected indicator
   * (nav underline, selected tab), `strong` the accent rail down the side of a block.
   */
  borderWidth: { emphasis: '2px', strong: '3px' },
  motion: {
    duration: { 1: '120ms', 2: '200ms', 3: '320ms', 4: '520ms' },
    ease: 'cubic-bezier(0.2, 0, 0, 1)',
    springDefaultDamping: '0.8',
    springDefaultResponse: '0.35',
    springMomentumDamping: '0.8',
    springMomentumResponse: '0.35',
  },
  material: { glassBlur: 'blur(20px) saturate(1.4)' },
  size: {
    touch: '44px',
    /** Page frame max width: the mock's 1200px column. */
    pageMax: '75rem',
    /** Page frame max width at the wide tier: the mock's min(1800px, 90vw). */
    pageMaxWide: 'min(112.5rem, 90vw)',
  },
  measure: '65ch',
  focusRingWidth: '2px',
  focusRingOffset: '2px',
} as const;

/** Text roles on the surfaces they sit on: must meet WCAG AA 4.5:1 in every theme. */
export const textContrastPairs: ReadonlyArray<readonly [ColorName, ColorName]> = [
  ['text', 'surface1'],
  ['text', 'surface2'],
  ['text', 'surface3'],
  ['text', 'surfaceRaised'],
  ['textMuted', 'surface1'],
  ['textMuted', 'surface2'],
  ['textMuted', 'surface3'],
  ['textMuted', 'surfaceRaised'],
  ['textSubtle', 'surface1'],
  ['textSubtle', 'surface2'],
  ['textSubtle', 'surface3'],
  ['textSubtle', 'surfaceRaised'],
  ['link', 'surface1'],
  ['link', 'surface2'],
  ['link', 'surface3'],
  ['link', 'surfaceRaised'],
  ['accentText', 'accent'],
  ['accentText', 'accentHover'],
  ['textInverse', 'surfaceInverse'],
];

/** Non-text UI roles (fills, dots, rings) on the surfaces they sit on: WCAG 1.4.11 asks 3:1. */
export const uiContrastPairs: ReadonlyArray<readonly [ColorName, ColorName]> = [
  ['accent', 'surface1'],
  ['accent', 'surface2'],
  ['accent', 'surface3'],
  ['accent', 'surfaceRaised'],
  ['focus', 'surface1'],
  ['focus', 'surface2'],
  ['focus', 'surface3'],
  ['focus', 'surfaceRaised'],
  ['success', 'surface1'],
  ['success', 'surface2'],
  ['success', 'surface3'],
  ['success', 'surfaceRaised'],
  ['warning', 'surface1'],
  ['warning', 'surface2'],
  ['warning', 'surface3'],
  ['warning', 'surfaceRaised'],
  ['danger', 'surface1'],
  ['danger', 'surface2'],
  ['danger', 'surface3'],
  ['danger', 'surfaceRaised'],
  ['neutral', 'surface1'],
  ['neutral', 'surface2'],
];

export const tokens = { breakpoint, themes, shared } as const;
export type Tokens = typeof tokens;
