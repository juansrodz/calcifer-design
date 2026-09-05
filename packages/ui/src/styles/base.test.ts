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
