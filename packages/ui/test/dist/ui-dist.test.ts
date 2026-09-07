import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const distRoot = path.resolve(import.meta.dirname, '../../dist');

async function collectCssFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectCssFiles(entryPath)));
    } else if (entry.name.endsWith('.css')) {
      files.push(entryPath);
    }
  }
  return files;
}

describe('@calcifer/ui dist', () => {
  it('exports the components from dist/index.js', async () => {
    const uiModule = (await import(path.join(distRoot, 'index.js'))) as Record<string, unknown>;
    for (const exportName of ['Button', 'Card', 'Tag', 'NavMenu', 'DataTable', 'PageHeading']) {
      expect(typeof uiModule[exportName], exportName).toBe('function');
    }
  });

  it('emits per-component stylesheets with the hashed class-name pattern', async () => {
    const cssFiles = await collectCssFiles(path.join(distRoot, 'components'));
    expect(cssFiles.length).toBeGreaterThan(5);
    const buttonCss = cssFiles.find((file) => file.includes(`${path.sep}Button${path.sep}`));
    expect(buttonCss).toBeDefined();
    const css = await readFile(buttonCss ?? '', 'utf8');
    expect(css).toMatch(/\.[a-zA-Z][a-zA-Z0-9]*-[A-Za-z0-9_-]{5}\b/);
  });

  it('ships base.css and the declarations', async () => {
    expect((await stat(path.join(distRoot, 'styles/base.css'))).isFile()).toBe(true);
    const declarations = await readFile(path.join(distRoot, 'index.d.ts'), 'utf8');
    expect(declarations).toContain('Button');
  });
});
