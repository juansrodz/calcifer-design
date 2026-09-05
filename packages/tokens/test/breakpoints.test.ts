import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fastGlob from 'fast-glob';
import { describe, expect, it } from 'vitest';
import { breakpoint } from '../src/tokens';

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const allowedWidths = new Set<string>(Object.values(breakpoint));
const queryPattern = /@(media|container)[^{]*?\((min|max)-width:\s*([^)\s]+)\)/g;

function findModuleStylesheets(): string[] {
  return fastGlob.sync('{apps,packages}/**/*.module.css', {
    cwd: repositoryRoot,
    ignore: ['**/node_modules/**', '**/dist/**'],
  });
}

describe('width queries in CSS Modules use the breakpoint scale', () => {
  const files = findModuleStylesheets();

  it('scans at least zero files without crashing', () => {
    expect(Array.isArray(files)).toBe(true);
  });

  for (const file of files) {
    it(file, () => {
      const css = readFileSync(resolve(repositoryRoot, file), 'utf8');
      for (const match of css.matchAll(queryPattern)) {
        const [, , bound, width] = match;
        expect(bound, `${file} uses max-width; use min-width only`).toBe('min');
        expect(allowedWidths.has(width ?? ''), `${file} uses width ${width}; allowed: ${[...allowedWidths].join(', ')}`).toBe(true);
      }
    });
  }
});
