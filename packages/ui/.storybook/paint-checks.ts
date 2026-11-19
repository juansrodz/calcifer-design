// The test runner's pre- and post-visit hooks, installed from `test-runner-jest.config.js` as a
// Jest setup file. A `.storybook/test-runner.ts` would be the documented place, but Storybook 10
// loads that file through `module.register()`, which Jest 30 refuses, so every suite would fail to
// run. The pre-visit hook sizes the page to the viewport a story names; the post-visit hook runs
// the story's paint checks at that size, then puts the page back.
import { getStoryContext, setPostVisit, setPreVisit } from '@storybook/test-runner';
import type { CDPSession, Page } from 'playwright';
import {
  assertColoursResolved,
  assertShadowResolved,
  colourProperties,
  describeCheck,
  findMismatches,
  unresolvedShades,
  type PaintCheck,
  type PaintReading,
} from './paint-compare';
import { storyViewportSize, type ViewportSize } from './story-viewport';

export type { PaintCheck } from './paint-compare';

async function readPaint(
  page: Page,
  selector: string,
  expected: PaintCheck['expected'],
): Promise<PaintReading> {
  return page.evaluate(
    async ({ selector: elementSelector, expected: expectedValues, colourNames, shades }) => {
      const element = document.querySelector(elementSelector);
      if (!element) {
        throw new Error(`paint check: ${elementSelector} matches nothing`);
      }
      // A colour transition still running would read as a midpoint.
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
      const storyRoot = document.querySelector('#storybook-root');
      const probe = document.createElement('span');
      probe.style.setProperty('forced-color-adjust', 'none');
      probe.style.backgroundColor = expectedValues.backgroundColor ?? 'transparent';
      probe.style.color = expectedValues.color ?? 'inherit';
      probe.style.outlineColor = expectedValues.outlineColor ?? 'currentcolor';
      probe.style.boxShadow = expectedValues.boxShadow ?? 'none';
      // Each expected colour as the `color` of a probe inside a host of each shade in turn: see
      // `unresolvedShades`. Both opt out of forced colours, which would repaint either.
      const shadeHost = document.createElement('span');
      const shadeProbe = document.createElement('span');
      shadeHost.style.setProperty('forced-color-adjust', 'none');
      shadeProbe.style.setProperty('forced-color-adjust', 'none');
      shadeHost.append(shadeProbe);
      storyRoot?.append(probe, shadeHost);
      try {
        const painted = getComputedStyle(element);
        const probed = getComputedStyle(probe);
        const colourResolutions: PaintReading['colourResolutions'] = {};
        for (const property of colourNames) {
          const expectedColour = expectedValues[property];
          if (expectedColour !== undefined) {
            colourResolutions[property] = shades.map((shade) => {
              shadeHost.style.color = shade;
              // Cleared first: a value the parser rejects leaves the last one in place.
              shadeProbe.style.color = '';
              shadeProbe.style.color = expectedColour;
              return getComputedStyle(shadeProbe).color;
            });
          }
        }
        return {
          painted: {
            backgroundColor: painted.backgroundColor,
            color: painted.color,
            outlineColor: painted.outlineColor,
            boxShadow: painted.boxShadow,
          },
          probed: {
            backgroundColor: probed.backgroundColor,
            color: probed.color,
            outlineColor: probed.outlineColor,
            boxShadow: probed.boxShadow,
          },
          colourResolutions,
        };
      } finally {
        probe.remove();
        shadeHost.remove();
      }
    },
    { selector, expected, colourNames: colourProperties, shades: unresolvedShades },
  );
}

async function findNodeId(session: CDPSession, selector: string): Promise<number> {
  await session.send('DOM.enable');
  await session.send('CSS.enable');
  const { root } = await session.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  return nodeId;
}

async function forceActive(session: CDPSession, nodeId: number, forced: boolean): Promise<void> {
  await session.send('CSS.forcePseudoState', {
    nodeId,
    forcedPseudoClasses: forced ? ['active'] : [],
  });
}

async function runPaintCheck(page: Page, check: PaintCheck): Promise<void> {
  const selector = `#storybook-root ${check.target}`;
  const session = await page.context().newCDPSession(page);
  let forcedNode: number | undefined;
  try {
    if (check.forcedColors) {
      await page.emulateMedia({ forcedColors: 'active' });
    }
    switch (check.interaction) {
      case 'hover':
        await page.hover(selector);
        break;
      case 'press':
        await page.mouse.move(0, 0);
        forcedNode = await findNodeId(session, selector);
        await forceActive(session, forcedNode, true);
        break;
      case 'rest':
        await page.mouse.move(0, 0);
        break;
      default: {
        // A story cast past the type, or written in JavaScript, must not read the wrong state.
        const unknownInteraction: never = check.interaction;
        throw new Error(
          `paint check on ${check.target}: unknown interaction ${String(unknownInteraction)}`,
        );
      }
    }
    const reading = await readPaint(page, selector, check.expected);
    assertColoursResolved(check, reading);
    assertShadowResolved(check, reading);
    const mismatches = findMismatches(check, reading);
    if (mismatches.length > 0) {
      throw new Error(`${describeCheck(check)}: ${mismatches.join('; ')}`);
    }
  } finally {
    if (forcedNode !== undefined) {
      await forceActive(session, forcedNode, false);
    }
    await session.detach();
    await page.mouse.move(0, 0);
    if (check.forcedColors) {
      await page.emulateMedia({ forcedColors: 'none' });
    }
  }
}

// The runner's own window, while a story that names a viewport has the page at its size.
let runnerViewport: ViewportSize | null = null;

// A story that names a viewport (`globals: { viewport: { value: 'mobile' } }`, as the Storybook
// toolbar reads it) renders, plays and is paint-checked in a window that size, not the runner's
// 1280 px one with a stand-in width. Set before the story renders, so it lays out at that size
// from the start.
setPreVisit(async (page, context) => {
  const size = storyViewportSize(await getStoryContext(page, context));
  if (size !== undefined) {
    runnerViewport ??= page.viewportSize();
    await page.setViewportSize(size);
  }
});

setPostVisit(async (page, context) => {
  try {
    // After a failed play the runner calls this hook and then rethrows the play's own error, so a
    // check that threw here would replace it. The runner names the flag `hasFailure`.
    if (context.hasFailure) {
      return;
    }
    const storyContext = await getStoryContext(page, context);
    const checks = storyContext.parameters['paintChecks'] as readonly PaintCheck[] | undefined;
    for (const check of checks ?? []) {
      await runPaintCheck(page, check);
    }
  } finally {
    // The next story in the file renders on this page, so it starts at the runner's size again.
    if (runnerViewport !== null) {
      await page.setViewportSize(runnerViewport);
      runnerViewport = null;
    }
  }
});
