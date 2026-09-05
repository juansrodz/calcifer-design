export const breakpoint = {
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
} as const;

export type BreakpointName = keyof typeof breakpoint;

const lightColor = {
  surface1: '#FBFAF8',
  surface2: '#F3F1EC',
  surface3: '#E9E6DF',
  text: '#1B1A17',
  textMuted: '#5D5A52',
  accent: '#A64B24',
  accentText: '#FFFFFF',
  border: '#D9D5CC',
  focus: '#A64B24',
  success: '#2E7D4F',
  warning: '#8A5F00',
  danger: '#B3261E',
} as const;

const darkColor = {
  surface1: '#0E1116',
  surface2: '#151A21',
  surface3: '#1E252E',
  text: '#E8ECF1',
  textMuted: '#A3ACB8',
  accent: '#F0A070',
  accentText: '#0E1116',
  border: '#2A323D',
  focus: '#F0A070',
  success: '#6FCF97',
  warning: '#F2C94C',
  danger: '#F28B82',
} as const;

export type ColorName = keyof typeof lightColor;

export const themes = {
  light: {
    color: lightColor,
    elevation: {
      1: '0 1px 2px rgb(27 26 23 / 0.08)',
      2: '0 6px 16px rgb(27 26 23 / 0.10)',
    },
  },
  dark: {
    color: darkColor,
    elevation: {
      1: '0 1px 2px rgb(0 0 0 / 0.5)',
      2: '0 8px 24px rgb(0 0 0 / 0.6)',
    },
  },
} as const;

export type ThemeName = keyof typeof themes;

export const shared = {
  font: {
    sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  },
  text: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    h2: 'clamp(1.375rem, 1.1rem + 1vw, 1.875rem)',
    h1: 'clamp(1.75rem, 1.25rem + 2vw, 2.75rem)',
    display: 'clamp(2.25rem, 1.5rem + 3vw, 4rem)',
  },
  leading: { tight: '1.15', snug: '1.3', body: '1.6' },
  tracking: { display: '-0.02em', heading: '-0.01em', body: '0' },
  space: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.5rem',
    6: '2rem',
    7: '3rem',
    8: '4rem',
  },
  radius: { sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '999px' },
  motion: {
    duration: { 1: '120ms', 2: '200ms', 3: '320ms' },
    ease: 'cubic-bezier(0.2, 0, 0, 1)',
    springDefaultDamping: '1',
    springDefaultResponse: '0.35',
    springMomentumDamping: '0.8',
    springMomentumResponse: '0.35',
  },
  size: { touch: '44px' },
  measure: '65ch',
  focusRingWidth: '3px',
} as const;

/** Text/surface pairs that must meet WCAG AA (4.5:1) in every theme. */
export const contrastPairs: ReadonlyArray<readonly [ColorName, ColorName]> = [
  ['text', 'surface1'], ['text', 'surface2'], ['text', 'surface3'],
  ['textMuted', 'surface1'], ['textMuted', 'surface2'], ['textMuted', 'surface3'],
  ['accent', 'surface1'], ['accent', 'surface2'],
  ['success', 'surface1'], ['warning', 'surface1'], ['danger', 'surface1'],
  ['accentText', 'accent'],
];

export const tokens = { breakpoint, themes, shared } as const;
export type Tokens = typeof tokens;
