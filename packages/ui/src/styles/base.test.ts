import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Read as plain text via the filesystem, not a static `new URL(url, import.meta.url)`
// asset reference: Vite/Vitest special-cases that pattern for CSS files and rewrites
// it to a non-`file:` URL, which breaks `fileURLToPath`.
const baseCssPath = join(import.meta.dirname, 'base.css');
const baseCssContents = readFileSync(baseCssPath, 'utf-8');

describe('reduced-motion base styles', () => {
  it('stops infinite animations rather than only speeding them up', () => {
    const reducedMotionBlock = baseCssContents.match(
      /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/,
    );
    expect(reducedMotionBlock).not.toBeNull();
    // Without this, an `infinite alternate` animation (e.g. StatusDot's pulse) keeps
    // looping at a near-zero duration, which reads as a refresh-rate strobe rather
    // than the stillness `prefers-reduced-motion: reduce` is meant to provide.
    expect(reducedMotionBlock?.[1]).toContain('animation-iteration-count: 1 !important;');
  });
});

describe('heading type', () => {
  it('sets the display family on every heading level, and only the family', () => {
    // Plan ruling L1-8: `h4` to `h6` are a new rule, family only, so a theme's display face
    // reaches every heading a consumer writes without touching the spacing the `h1`-`h3` rule owns.
    const allLevelsRule = baseCssContents.match(/^h1,\nh2,\nh3,\nh4,\nh5,\nh6 \{([^}]*)\}/m);
    expect(allLevelsRule).not.toBeNull();
    expect(allLevelsRule?.[1]?.trim()).toBe('font-family: var(--font-display);');
  });

  it('takes the user agent’s margins from h4 to h6 too, in a rule of their own', () => {
    // The lookbehind skips the all-levels rule above, whose last three lines are the same.
    const lowerLevelsRule = baseCssContents.match(/(?<!h3,\n)^h4,\nh5,\nh6 \{([^}]*)\}/m);
    expect(lowerLevelsRule).not.toBeNull();
    expect(lowerLevelsRule?.[1]?.trim()).toBe('margin: 0;');
  });

  it('keeps the h1 to h3 rule as it was', () => {
    const upperLevelsRule = baseCssContents.match(/^h1,\nh2,\nh3 \{([^}]*)\}/m);
    expect(upperLevelsRule).not.toBeNull();
    expect(upperLevelsRule?.[1]).toContain('line-height: var(--leading-tight);');
    expect(upperLevelsRule?.[1]).toContain('letter-spacing: var(--tracking-heading);');
    expect(upperLevelsRule?.[1]).toContain('margin: 0;');
  });
});
