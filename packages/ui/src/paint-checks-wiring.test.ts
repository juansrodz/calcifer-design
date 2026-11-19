import { composeStories } from '@storybook/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertColoursResolved,
  assertShadowResolved,
  findMismatches,
  unresolvedShades,
  type PaintCheck,
  type PaintReading,
} from '../.storybook/paint-compare';
import * as buttonStories from './components/Button/Button.stories';

// A story's `paintChecks` (rest, hover, press and forced colours, which jsdom cannot show) run in the
// Storybook test runner, and every link between a story and the runner fails silently: a config
// file the runner no longer discovers, a setup line that drops the hook, a hook that reads another
// parameter, a story that misspells it. Each leaves `storybook:test` green with no check run. The
// two `.storybook` files are read as text, code only, because the runner's Jest config cannot load
// under Vitest; the stories are imported.
const storybookDirectory = join(import.meta.dirname, '..', '.storybook');

const composedStories = composeStories(buttonStories);

function checksOf(story: { parameters: Record<string, unknown> }): readonly PaintCheck[] {
  return (story.parameters['paintChecks'] ?? []) as readonly PaintCheck[];
}

function declaredChecks(): readonly PaintCheck[] {
  return Object.values(composedStories).flatMap((story) => checksOf(story));
}

// Comments are stripped, whole-line `//` and `/* */` blocks, so a pin on a line of code cannot be
// met by a comment that quotes it.
function readCode(fileName: string): string {
  return readFileSync(join(storybookDirectory, fileName), 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('the paint checks wiring', () => {
  it('has the runner config install paint-checks.ts as a Jest setup file', () => {
    // The runner finds the config in `.storybook` by its `test-runner-jest` name, so reading the
    // file at this path pins the name as well.
    expect(readCode('test-runner-jest.config.js')).toMatch(
      /setupFilesAfterEnv:[\s\S]*new URL\('\.\/paint-checks\.ts', import\.meta\.url\)/,
    );
  });

  it('has paint-checks.ts install the post-visit hook, reading the parameter the stories set', () => {
    const hook = readCode('paint-checks.ts');
    expect(hook).toMatch(/^setPostVisit\(/m);
    expect(hook).toContain("storyContext.parameters['paintChecks']");
  });

  it('has paint-checks.ts run both resolution guards on every reading before comparing it', () => {
    // A guard the hook stops calling leaves every check on a mistyped token comparing nothing, and
    // `storybook:test` stays green: the failure here with no other signal.
    expect(readCode('paint-checks.ts')).toMatch(
      /assertColoursResolved\(check, reading\);\s*assertShadowResolved\(check, reading\);\s*const mismatches = findMismatches\(check, reading\);/,
    );
  });
});

/** A reading where the element paints what the probe resolved, every expected colour resolved. */
function agreeingReading(overrides: Partial<PaintReading> = {}): PaintReading {
  const paint = { backgroundColor: 'rgb(10, 20, 30)', color: 'rgb(40, 50, 60)', boxShadow: 'none' };
  return {
    painted: { ...paint },
    probed: { ...paint },
    colourResolutions: {
      backgroundColor: ['rgb(10, 20, 30)', 'rgb(10, 20, 30)'],
      color: ['rgb(40, 50, 60)', 'rgb(40, 50, 60)'],
    },
    ...overrides,
  };
}

const colourCheck: PaintCheck = {
  target: '.thing',
  interaction: 'hover',
  expected: { backgroundColor: 'var(--color-surface-1)', color: 'var(--color-text)' },
};

describe('the paint comparison', () => {
  // A property left out of the list leaves every check that expects it comparing nothing, and
  // `storybook:test` stays green.
  // Listed here, not read from `paintProperties`: a property dropped from that list must drop no case.
  it.each(['backgroundColor', 'color', 'boxShadow'] as const)(
    'reports a %s that differs from the probe',
    (property) => {
      const reading = agreeingReading();
      reading.painted[property] = 'rgb(255, 0, 0)';
      const check: PaintCheck = {
        target: '.thing',
        interaction: 'rest',
        expected: { [property]: 'x' },
      };
      expect(findMismatches(check, reading)).toEqual([expect.stringContaining(property)]);
      expect(findMismatches(check, agreeingReading())).toEqual([]);
    },
  );

  it('refuses an expected shadow that its probe resolves to none', () => {
    // A missing token or a typo makes the probe `none`, equal to an element with no shadow.
    const check: PaintCheck = {
      target: '.thing',
      interaction: 'hover',
      expected: { boxShadow: 'var(--shadow-sofft)' },
    };
    expect(() => assertShadowResolved(check, agreeingReading())).toThrow(/resolved to none/);
    const expectsNone: PaintCheck = { ...check, expected: { boxShadow: 'none' } };
    expect(() => assertShadowResolved(expectsNone, agreeingReading())).not.toThrow();
  });

  it.each(['backgroundColor', 'color'] as const)(
    'refuses an expected %s that reads as each inherited shade in turn',
    (property) => {
      // A missing token falls back to the initial or inherited colour: `transparent` on the probe
      // for a background, which an element painting nothing would match.
      const reading = agreeingReading();
      reading.colourResolutions[property] = [...unresolvedShades];
      expect(() => assertColoursResolved(colourCheck, reading)).toThrow(
        new RegExp(`expected ${property} \\(var\\(--[\\w-]+\\)\\) does not resolve`),
      );
    },
  );

  it('accepts an expected colour that resolves, even to one of the shades', () => {
    expect(() => assertColoursResolved(colourCheck, agreeingReading())).not.toThrow();
    const matchesOneShade = agreeingReading();
    matchesOneShade.colourResolutions.color = [unresolvedShades[0], unresolvedShades[0]];
    expect(() => assertColoursResolved(colourCheck, matchesOneShade)).not.toThrow();
  });

  it('refuses a reading that lacks an expected colour, rather than skipping it', () => {
    expect(() =>
      assertColoursResolved(colourCheck, agreeingReading({ colourResolutions: {} })),
    ).toThrow(/did not resolve/);
  });
});

describe('the stories that declare paint checks', () => {
  it('has a story declare paintChecks that the hook can run', () => {
    const checks = declaredChecks();
    expect(checks.length).toBeGreaterThan(0);
    for (const check of checks) {
      expect(check.target).toEqual(expect.any(String));
      // The helper throws on any other value, so a cast or hand-written story fails at the runner.
      expect(['rest', 'hover', 'press']).toContain(check.interaction);
      // A check with nothing to compare passes whatever the element paints.
      expect(
        check.expected.backgroundColor ?? check.expected.color ?? check.expected.boxShadow,
      ).toEqual(expect.any(String));
    }
  });

  // Each story is read on its own: a read pooled over every Button story would stay green while one
  // of these lost all of its shadow checks.
  it.each(['ElevationViaHook', 'ElevationOnChosenViaHook'] as const)(
    'has %s check its box shadow at rest and on hover, and its absence under forced colours',
    (storyName) => {
      const shadowChecks = checksOf(composedStories[storyName]).filter(
        (check) => check.expected.boxShadow !== undefined,
      );
      const normalChecks = shadowChecks.filter((check) => !check.forcedColors);
      const forcedChecks = shadowChecks.filter((check) => check.forcedColors);
      expect(normalChecks.map((check) => check.interaction)).toEqual(
        expect.arrayContaining(['rest', 'hover']),
      );
      expect(forcedChecks.map((check) => check.interaction)).toEqual(
        expect.arrayContaining(['rest', 'hover']),
      );
      // These buttons lose their shadow under forced colours (the browser drops it, and the chosen
      // opt-out's own rule clears it), so `none`. A component that opts out of forced colours and
      // keeps a shadow on purpose would pin that shadow instead.
      for (const check of forcedChecks) {
        expect(check.expected.boxShadow).toBe('none');
      }
    },
  );
});
