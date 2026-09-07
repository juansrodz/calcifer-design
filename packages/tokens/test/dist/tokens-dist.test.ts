import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const distRoot = path.resolve(import.meta.dirname, '../../dist');

describe('@calcifer/tokens dist', () => {
  it('exports the token API from dist/index.js', async () => {
    const tokensModule = (await import(path.join(distRoot, 'index.js'))) as {
      tokens: { shared: { space: Record<string, string> } };
      breakpoint: Record<string, string>;
      tokensToCss: (input: unknown) => string;
    };
    expect(typeof tokensModule.tokensToCss).toBe('function');
    expect(Object.values(tokensModule.breakpoint)).toEqual(
      expect.arrayContaining(['40rem', '48rem', '64rem', '80rem', '112.5rem']),
    );
    expect(tokensModule.tokensToCss(tokensModule.tokens)).toContain('--space-');
  });

  it('ships the generated stylesheet and the declarations', async () => {
    const css = await readFile(path.join(distRoot, 'tokens.css'), 'utf8');
    expect(css).toContain('color-scheme: light dark');
    expect(css).toContain('--color-');
    const declarations = await readFile(path.join(distRoot, 'index.d.ts'), 'utf8');
    expect(declarations).toContain('tokensToCss');
    expect(declarations).toContain('BreakpointName');
  });
});
