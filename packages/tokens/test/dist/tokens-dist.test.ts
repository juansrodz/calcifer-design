import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const distRoot = path.resolve(import.meta.dirname, '../../dist');

describe('@calcifer-design/tokens dist', () => {
  it('exports the token API from dist/index.js', async () => {
    const tokensModule = (await import(path.join(distRoot, 'index.js'))) as {
      tokens: { shared: { space: Record<string, string> } };
      breakpoint: Record<string, string>;
      tokensToCss: (input: unknown) => string;
      defineTheme: (input: unknown) => unknown;
      themeToCss: (input: unknown) => string;
      checkThemeContrast: (input: unknown) => unknown;
      findUnknownCustomProperties: (css: string, defined: ReadonlySet<string>) => string[];
      customPropertyNamesOf: (css: string) => Set<string>;
    };
    expect(typeof tokensModule.tokensToCss).toBe('function');
    expect(typeof tokensModule.defineTheme).toBe('function');
    expect(typeof tokensModule.themeToCss).toBe('function');
    expect(typeof tokensModule.checkThemeContrast).toBe('function');
    expect(typeof tokensModule.findUnknownCustomProperties).toBe('function');
    expect(typeof tokensModule.customPropertyNamesOf).toBe('function');
    expect(Object.values(tokensModule.breakpoint)).toEqual(
      expect.arrayContaining(['40rem', '48rem', '64rem', '80rem', '112.5rem']),
    );
    expect(tokensModule.tokensToCss(tokensModule.tokens)).toContain('--space-');
  });

  it('ships the generated stylesheet and the declarations', async () => {
    const css = await readFile(path.join(distRoot, 'tokens.css'), 'utf8');
    expect(css).toContain('color-scheme: light dark');
    expect(css).toContain('--color-');
    for (const name of [
      '--font-display',
      '--font-weight-button',
      '--radius-control',
      '--shadow-soft',
      '--color-selected',
      '--size-drawer',
    ]) {
      expect(css).toContain(name);
    }
    const declarations = await readFile(path.join(distRoot, 'index.d.ts'), 'utf8');
    expect(declarations).toContain('tokensToCss');
    expect(declarations).toContain('BreakpointName');
    expect(declarations).toContain('ThemeDefinition');
    expect(declarations).toContain('ShadowName');
  });
});
