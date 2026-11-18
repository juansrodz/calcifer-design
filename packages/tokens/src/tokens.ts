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
  /** The remote-boundary frame fill: a wash far fainter than accentSoft (the mock's --rbg). */
  accentWash: 'rgba(59, 111, 224, 0.035)',
  border: 'rgba(28, 25, 23, 0.08)',
  borderStrong: 'rgba(28, 25, 23, 0.18)',
  /**
   * The boundary of a control known by its outline alone: the unchecked checkbox, the radio. Opaque
   * so it can be measured: WCAG 1.4.11 asks 3:1, and on the five surfaces `uiContrastPairs` checks
   * the lowest is 3.26:1 (light, surface3) and 4.82:1 (dark, surface3).
   */
  borderControl: '#857F79',
  borderAccent: 'rgba(59, 111, 224, 0.28)',
  cardBorder: 'transparent',
  /** The scrim behind a modal dialog. Warm black at 45%, so the page reads as inert, not gone. */
  scrim: 'rgba(28, 25, 23, 0.45)',
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
  // The theme layer's role colours. Each default is the literal of the role it replaces in this mode.
  selected: '#3B6FE0',
  selectedText: '#FFFFFF',
  selectedSoft: 'rgba(59, 111, 224, 0.14)',
  selectedSoftText: '#1C1917',
  inverse: '#1C1917',
  inverseText: '#FFFFFF',
  inverseSoft: 'rgba(255, 255, 255, 0.22)',
  inverseSoftText: '#FFFFFF',
  navText: '#57534E',
  navSelected: 'transparent',
  navSelectedText: '#1C1917',
  tabBar: '#FFFFFF',
  tabBarText: '#57534E',
  tabBarActive: '#3B6FE0',
  tabBarActiveText: '#FFFFFF',
  sheetHandle: 'rgba(28, 25, 23, 0.18)',
  segmentedTrack: '#F4F2EE',
  segmentedBorder: 'rgba(28, 25, 23, 0.18)',
  scrimSheet: 'rgba(28, 25, 23, 0.45)',
  avatarRing: '#FFFFFF',
  avatarFill1: '#ECE9E3',
  avatarFill2: '#ECE9E3',
  avatarFill3: '#ECE9E3',
  avatarFill4: '#ECE9E3',
  avatarFill5: '#ECE9E3',
  avatarFill6: '#ECE9E3',
  avatarInk1: '#57534E',
  avatarInk2: '#57534E',
  avatarInk3: '#57534E',
  avatarInk4: '#57534E',
  avatarInk5: '#57534E',
  avatarInk6: '#57534E',
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
  accentWash: 'rgba(127, 164, 245, 0.05)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  borderControl: '#8A909C',
  borderAccent: 'rgba(127, 164, 245, 0.32)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  /** Heavier than the light theme's: a dark surface needs more separation from a dark page. */
  scrim: 'rgba(3, 4, 6, 0.6)',
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
  selected: '#7FA4F5',
  selectedText: '#0B0D12',
  selectedSoft: 'rgba(127, 164, 245, 0.18)',
  selectedSoftText: '#EDEEF2',
  inverse: '#EDEEF2',
  inverseText: '#0B0D12',
  inverseSoft: 'rgba(11, 13, 18, 0.22)',
  inverseSoftText: '#0B0D12',
  navText: '#A8ADB8',
  navSelected: 'transparent',
  navSelectedText: '#EDEEF2',
  tabBar: '#111420',
  tabBarText: '#A8ADB8',
  tabBarActive: '#7FA4F5',
  tabBarActiveText: '#0B0D12',
  sheetHandle: 'rgba(255, 255, 255, 0.18)',
  segmentedTrack: '#171B28',
  segmentedBorder: 'rgba(255, 255, 255, 0.18)',
  scrimSheet: 'rgba(3, 4, 6, 0.6)',
  avatarRing: '#111420',
  avatarFill1: '#1F2434',
  avatarFill2: '#1F2434',
  avatarFill3: '#1F2434',
  avatarFill4: '#1F2434',
  avatarFill5: '#1F2434',
  avatarFill6: '#1F2434',
  avatarInk1: '#A8ADB8',
  avatarInk2: '#A8ADB8',
  avatarInk3: '#A8ADB8',
  avatarInk4: '#A8ADB8',
  avatarInk5: '#A8ADB8',
  avatarInk6: '#A8ADB8',
} as const satisfies Record<ColorName, string>;

const lightElevation = {
  1: '0 2px 8px rgba(28, 25, 23, 0.05), 0 8px 24px rgba(28, 25, 23, 0.05)',
  2: '0 6px 16px rgba(28, 25, 23, 0.07), 0 20px 48px rgba(28, 25, 23, 0.08)',
  3: '0 16px 40px rgba(28, 25, 23, 0.10), 0 2px 6px rgba(28, 25, 23, 0.06)',
} as const;

const darkElevation = {
  1: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
  2: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.18)',
  3: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 16px 40px rgba(0, 0, 0, 0.5)',
} as const;

export type ElevationName = keyof typeof lightElevation;

/** The shadows components name by role. Each default is the elevation step it replaces. */
const lightShadow = {
  soft: lightElevation[1],
  chip: lightElevation[1],
  raised: lightElevation[2],
  dialog: lightElevation[3],
  drawer: lightElevation[3],
  sheet: lightElevation[3],
  tabBar: lightElevation[2],
  action: 'none',
  actionInverse: 'none',
  segmented: 'none',
} as const;

export type ShadowName = keyof typeof lightShadow;

const darkShadow = {
  soft: darkElevation[1],
  chip: darkElevation[1],
  raised: darkElevation[2],
  dialog: darkElevation[3],
  drawer: darkElevation[3],
  sheet: darkElevation[3],
  tabBar: darkElevation[2],
  action: 'none',
  actionInverse: 'none',
  segmented: 'none',
} as const satisfies Record<ShadowName, string>;

export const themes = {
  light: {
    color: lightColor,
    elevation: lightElevation,
    shadow: lightShadow,
    material: { glassBg: 'rgba(251, 250, 248, 0.78)' },
  },
  dark: {
    color: darkColor,
    elevation: darkElevation,
    shadow: darkShadow,
    material: { glassBg: 'rgba(11, 13, 18, 0.78)' },
  },
} as const;

export type ThemeName = keyof typeof themes;

const sansStack =
  '"Geist Variable", "Geist", -apple-system, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif';

export const shared = {
  font: {
    sans: sansStack,
    mono: '"Geist Mono Variable", "Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    display: sansStack,
    body: sansStack,
  },
  fontWeight: {
    body: '400',
    label: '500',
    button: '500',
    heading: '600',
    nav: '400',
    navSelected: '500',
    display: '600',
  },
  fontStretch: { display: 'normal' },
  textTransform: { display: 'none' },
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
    /** The mock's --d1: 44–56px on phones, 72px on desktop; `displayWide` is its 88px wide tier. */
    display: 'clamp(2.75rem, 2rem + 3.5vw, 4.5rem)',
    displayWide: '5.5rem',
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
  radius: {
    sm: '0.5rem',
    md: '0.625rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '999px',
    control: '0.625rem',
    option: '0.5rem',
    panel: '0.625rem',
    popup: '0.75rem',
    card: '1rem',
    dialog: '1rem',
  },
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
    /** Sticky header height: the mock's --hh (64px desktop, 72px at the wide tier). */
    header: '4rem',
    headerWide: '4.5rem',
    /** Page frame max width: the mock's 1200px column. */
    pageMax: '75rem',
    /** Page frame max width at the wide tier: the mock's min(1800px, 90vw). */
    pageMaxWide: 'min(112.5rem, 90vw)',
    drawer: '28rem',
    control: '44px',
    controlSm: '2.5rem',
    /** The dialog close circle, 36px, the mock's (O-33). */
    close: '2.25rem',
  },
  measure: '65ch',
  focusRingWidth: '2px',
  focusRingOffset: '2px',
} as const;

export type SharedTokens = typeof shared;
export type ThemeTokens = (typeof themes)['light'];
export type FontName = keyof typeof shared.font;
export type FontWeightName = keyof typeof shared.fontWeight;
export type TextSizeName = keyof typeof shared.text;
export type RadiusName = keyof typeof shared.radius;
export type SizeName = keyof typeof shared.size;

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
  ['selectedText', 'selected'],
  ['inverseText', 'inverse'],
  ['tabBarActiveText', 'tabBarActive'],
  ['avatarInk1', 'avatarFill1'],
  ['avatarInk2', 'avatarFill2'],
  ['avatarInk3', 'avatarFill3'],
  ['avatarInk4', 'avatarFill4'],
  ['avatarInk5', 'avatarFill5'],
  ['avatarInk6', 'avatarFill6'],
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
  // An invalid checkbox or radio draws its boundary in `danger` around the input fill.
  ['danger', 'surfaceInput'],
  ['neutral', 'surface1'],
  ['neutral', 'surface2'],
  ['selected', 'surface1'],
  ['selected', 'surfaceRaised'],
  ['tabBarText', 'tabBar'],
  ['borderControl', 'surface1'],
  ['borderControl', 'surface2'],
  ['borderControl', 'surface3'],
  ['borderControl', 'surfaceRaised'],
  ['borderControl', 'surfaceInput'],
];

export const tokens = { breakpoint, themes, shared } as const;
export type Tokens = typeof tokens;
