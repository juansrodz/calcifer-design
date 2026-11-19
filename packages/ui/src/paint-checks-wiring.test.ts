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
import { storyViewportSize } from '../.storybook/story-viewport';
import preview from '../.storybook/preview';
import * as buttonStories from './components/Button/Button.stories';
import * as dialogStories from './components/Dialog/Dialog.stories';

// A story's `paintChecks` (rest, hover, press and forced colours, which jsdom cannot show) run in the
// Storybook test runner, and every link between a story and the runner fails silently: a config
// file the runner no longer discovers, a setup line that drops the hook, a hook that reads another
// parameter, a story that misspells it. Each leaves `storybook:test` green with no check run. The
// runner's config and its hook (`paint-checks.ts`) are read as text, code only, because the
// runner's Jest config cannot load under Vitest; the stories and the hook's pure parts
// (`paint-compare.ts`, `story-viewport.ts`) are imported.
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

  it('has paint-checks.ts size the page to the story’s viewport first, and size it back after', () => {
    // A hook that stops sizing the page leaves a phone story measuring the runner's 1280 px window;
    // one that stops sizing it back runs every later story in the file at a phone's width.
    const hook = readCode('paint-checks.ts');
    expect(hook).toMatch(
      /^setPreVisit\(async \(page, context\) => \{\s*const size = storyViewportSize\(await getStoryContext\(page, context\)\);[\s\S]*?await page\.setViewportSize\(size\);\s*\} else \{\s*await restoreRunnerViewport\(page\);/m,
    );
    expect(hook).toMatch(/\} finally \{\s*await restoreRunnerViewport\(page\);/);
    expect(hook).toMatch(
      /^async function restoreRunnerViewport\(page: Page\): Promise<void> \{\s*if \(runnerViewport !== null\) \{\s*await page\.setViewportSize\(runnerViewport\);/m,
    );
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
function agreeingReading(): PaintReading {
  const paint = {
    backgroundColor: 'rgb(10, 20, 30)',
    color: 'rgb(40, 50, 60)',
    outlineColor: 'rgb(70, 80, 90)',
    boxShadow: 'none',
  };
  return {
    painted: { ...paint },
    probed: { ...paint },
    colourResolutions: {
      backgroundColor: [paint.backgroundColor, paint.backgroundColor],
      color: [paint.color, paint.color],
      outlineColor: [paint.outlineColor, paint.outlineColor],
    },
  };
}

/** A check on a stand-in element; its target and interaction only name it in an error. */
function checkExpecting(expected: PaintCheck['expected']): PaintCheck {
  return { target: '.thing', interaction: 'rest', expected };
}

const colourCheck = checkExpecting({
  backgroundColor: 'var(--color-surface-1)',
  color: 'var(--color-text)',
  outlineColor: 'var(--color-focus)',
});

describe('the paint comparison', () => {
  // A property left out of the list leaves every check that expects it comparing nothing, and
  // `storybook:test` stays green. Listed here, not read from `paintProperties`: a property dropped
  // from that list must drop no case.
  it.each(['backgroundColor', 'color', 'outlineColor', 'boxShadow'] as const)(
    'reports a %s that differs from the probe',
    (property) => {
      const reading = agreeingReading();
      reading.painted[property] = 'rgb(255, 0, 0)';
      const check = checkExpecting({ [property]: 'x' });
      expect(findMismatches(check, reading)).toEqual([expect.stringContaining(property)]);
      expect(findMismatches(check, agreeingReading())).toEqual([]);
    },
  );

  it('refuses an expected shadow that its probe resolves to none', () => {
    // A missing token or a typo makes the probe `none`, equal to an element with no shadow.
    const check = checkExpecting({ boxShadow: 'var(--shadow-sofft)' });
    expect(() => assertShadowResolved(check, agreeingReading())).toThrow(/resolved to none/);
    const expectsNone = checkExpecting({ boxShadow: 'none' });
    expect(() => assertShadowResolved(expectsNone, agreeingReading())).not.toThrow();
  });

  it.each(['backgroundColor', 'color', 'outlineColor'] as const)(
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
    const reading = agreeingReading();
    reading.colourResolutions = {};
    expect(() => assertColoursResolved(colourCheck, reading)).toThrow(/did not resolve/);
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
        check.expected.backgroundColor ??
          check.expected.color ??
          check.expected.outlineColor ??
          check.expected.boxShadow,
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

describe('the viewport a story names', () => {
  const parameters = {
    viewport: {
      options: {
        mobile: { styles: { width: '390px', height: '844px' } },
        percent: { styles: { width: '100%', height: '100%' } },
      },
    },
  };

  it('is the named option’s size, turned when rotated, and none when no viewport is named', () => {
    const mobile = { viewport: { value: 'mobile' } };
    expect(storyViewportSize({ storyGlobals: mobile, parameters })).toEqual({
      width: 390,
      height: 844,
    });
    const rotated = { viewport: { value: 'mobile', isRotated: true } };
    expect(storyViewportSize({ storyGlobals: rotated, parameters })).toEqual({
      width: 844,
      height: 390,
    });
    expect(storyViewportSize({ storyGlobals: {}, parameters })).toBeUndefined();
    expect(storyViewportSize({ parameters })).toBeUndefined();
  });

  it('throws for a name with no option, or an option not sized in px', () => {
    // Either would leave the story in the runner's own window, measuring what it did not mean to.
    expect(() =>
      storyViewportSize({ storyGlobals: { viewport: { value: 'mobil' } }, parameters }),
    ).toThrow(/"mobil" is not a viewport option/);
    expect(() =>
      storyViewportSize({ storyGlobals: { viewport: { value: 'percent' } }, parameters }),
    ).toThrow(/"percent" is not a viewport option/);
  });

  it.each(['HeadingAtDoubleText', 'DefaultAtDoubleText'] as const)(
    'has %s run in the preview’s 390 px phone window',
    (storyName) => {
      expect(
        storyViewportSize({
          storyGlobals: dialogStories[storyName].globals,
          parameters: preview.parameters,
        }),
      ).toEqual({ width: 390, height: 844 });
    },
  );
});
