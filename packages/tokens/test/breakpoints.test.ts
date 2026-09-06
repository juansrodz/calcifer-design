import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fastGlob from 'fast-glob';
import { describe, expect, it } from 'vitest';
import { findWidthQueryViolations } from '../src/breakpoint-scan';
import { breakpoint } from '../src/tokens';

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const allowedWidths = new Set<string>(Object.values(breakpoint));

function findModuleStylesheets(): string[] {
  return fastGlob.sync('{apps,packages}/**/*.module.css', {
    cwd: repositoryRoot,
    ignore: ['**/node_modules/**', '**/dist/**'],
  });
}

describe('findWidthQueryViolations', () => {
  it('detects max-width violations in compound queries', () => {
    const css = '@media (min-width: 48rem) and (max-width: 33rem) { }';
    const violations = findWidthQueryViolations(css, allowedWidths);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((violation) => violation.includes('max-width'))).toBe(true);
  });

  it('detects out-of-scale widths in comma-separated queries', () => {
    const css = '@media (min-width: 48rem), (min-width: 33rem) { }';
    const violations = findWidthQueryViolations(css, allowedWidths);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((violation) => violation.includes('33rem'))).toBe(true);
  });

  it('allows valid min-width in container queries', () => {
    const css = '@container (min-width: 40rem) { }';
    const violations = findWidthQueryViolations(css, allowedWidths);
    expect(violations).toEqual([]);
  });

  it('ignores non-width media queries', () => {
    const css = '@media (hover: hover) { }';
    const violations = findWidthQueryViolations(css, allowedWidths);
    expect(violations).toEqual([]);
  });

  it('ignores inline min-width declarations', () => {
    const css = '.root { min-width: 44px; }';
    const violations = findWidthQueryViolations(css, allowedWidths);
    expect(violations).toEqual([]);
  });
});

describe('breakpoint scale', () => {
  it('includes the wide tier from the revised design (1800px)', () => {
    expect(breakpoint['2xl']).toBe('112.5rem');
    expect(Object.keys(breakpoint)).toEqual(['sm', 'md', 'lg', 'xl', '2xl']);
  });
});

describe('width queries in CSS Modules use the breakpoint scale', () => {
  const files = findModuleStylesheets();

  it('scans at least zero files without crashing', () => {
    expect(Array.isArray(files)).toBe(true);
  });

  for (const file of files) {
    it(file, () => {
      const css = readFileSync(resolve(repositoryRoot, file), 'utf8');
      const violations = findWidthQueryViolations(css, allowedWidths);
      expect(violations, `${file}: ${violations.join('; ')}`).toEqual([]);
    });
  }
});
