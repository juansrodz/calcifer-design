import { describe, expect, it } from 'vitest';
import { tokens } from '../src/tokens';
import type { ColorName, ElevationName, RadiusName, ShadowName } from '../src/tokens';

/**
 * C36: a theme that sets nothing looks exactly like today. Every role Task 1 added defaults to the
 * role (or elevation step, or radius step) it stands in for, in each mode. These tables are that
 * mapping; a default that drifts to a different literal fails here, not in a reviewer's eye.
 */

/** Each new colour role, and the existing role its default equals in the same mode. */
const colourRolesStandingIn: ReadonlyArray<readonly [ColorName, ColorName]> = [
  ['selected', 'accent'],
  ['selectedText', 'accentText'],
  ['selectedSoft', 'accentSoft'],
  ['selectedSoftText', 'text'],
  ['inverse', 'surfaceInverse'],
  ['inverseText', 'textInverse'],
  ['navText', 'textMuted'],
  ['navSelectedText', 'text'],
  ['tabBar', 'surfaceRaised'],
  ['tabBarText', 'textMuted'],
  ['tabBarActive', 'accent'],
  ['tabBarActiveText', 'accentText'],
  ['sheetHandle', 'borderStrong'],
  ['segmentedTrack', 'surface2'],
  ['segmentedBorder', 'borderStrong'],
  ['scrimSheet', 'scrim'],
  ['avatarRing', 'surfaceRaised'],
  ['avatarFill1', 'surface3'],
  ['avatarFill2', 'surface3'],
  ['avatarFill3', 'surface3'],
  ['avatarFill4', 'surface3'],
  ['avatarFill5', 'surface3'],
  ['avatarFill6', 'surface3'],
  ['avatarInk1', 'textMuted'],
  ['avatarInk2', 'textMuted'],
  ['avatarInk3', 'textMuted'],
  ['avatarInk4', 'textMuted'],
  ['avatarInk5', 'textMuted'],
  ['avatarInk6', 'textMuted'],
];

/** The new colour roles that stand in for no role: the brief's own literal for each mode. */
const colourRolesWithOwnValue: ReadonlyArray<
  readonly [ColorName, { readonly light: string; readonly dark: string }]
> = [
  ['inverseSoft', { light: 'rgba(255, 255, 255, 0.22)', dark: 'rgba(11, 13, 18, 0.22)' }],
  ['inverseSoftText', { light: '#FFFFFF', dark: '#0B0D12' }],
  ['navSelected', { light: 'transparent', dark: 'transparent' }],
];

/** Each shadow role, and the elevation step it defaults to (or `none`). */
const shadowsStandingIn: ReadonlyArray<readonly [ShadowName, ElevationName | 'none']> = [
  ['soft', 1],
  ['chip', 1],
  ['raised', 2],
  ['tabBar', 2],
  ['dialog', 3],
  ['drawer', 3],
  ['sheet', 3],
  ['action', 'none'],
  ['actionInverse', 'none'],
  ['segmented', 'none'],
];

/** Each purpose radius, and the scale step its default equals (mode-independent). */
const radiiStandingIn: ReadonlyArray<readonly [RadiusName, RadiusName]> = [
  ['control', 'md'],
  ['option', 'sm'],
  ['panel', 'md'],
  ['popup', 'lg'],
  ['card', 'xl'],
  ['dialog', 'xl'],
];

describe.each(['light', 'dark'] as const)('the %s mode role defaults (C36)', (mode) => {
  const { color, elevation, shadow } = tokens.themes[mode];

  it.each(colourRolesStandingIn)('%s defaults to %s', (role, source) => {
    expect(color[role]).toBe(color[source]);
  });

  it.each(colourRolesWithOwnValue)('%s defaults to its own literal', (role, ownValues) => {
    expect(color[role]).toBe(ownValues[mode]);
  });

  it.each(shadowsStandingIn)('shadow %s defaults to elevation %s', (role, source) => {
    expect(shadow[role]).toBe(source === 'none' ? 'none' : elevation[source]);
  });
});

describe('the role radius defaults (C36)', () => {
  it.each(radiiStandingIn)('radius %s defaults to %s', (role, source) => {
    expect(tokens.shared.radius[role]).toBe(tokens.shared.radius[source]);
  });
});
