import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const distRoot = path.resolve(import.meta.dirname, '../../dist');
const componentsSource = path.resolve(import.meta.dirname, '../../src/components');

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

/** Every component source a consumer gets: `.tsx` under `src/components`, minus tests and stories. */
async function collectComponentSources(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { recursive: true });
  return entries
    .filter((entry) => entry.endsWith('.tsx') && !/\.(test|stories)\.tsx$/.test(entry))
    .map((entry) => path.join(directory, entry));
}

describe('@calcifer-design/ui dist', () => {
  it('exports the components from dist/index.js', async () => {
    const uiModule = (await import(path.join(distRoot, 'index.js'))) as Record<string, unknown>;
    for (const exportName of [
      'Button',
      'Card',
      'Tag',
      'NavMenu',
      'DataTable',
      'PageHeading',
      'Spinner',
      'Skeleton',
      'IconButton',
      'Alert',
      'Avatar',
      'ErrorBoundary',
      'Popover',
      'Dialog',
      'Menu',
      'Tooltip',
      'TooltipProvider',
      'ToastRegion',
      'createToastManager',
      'Field',
      'TextInput',
      'Select',
      'Checkbox',
      'RadioGroup',
      'Switch',
      'ViewField',
      'Descriptions',
      'PageShell',
      'Segmented',
      'Breadcrumb',
      'Toolbar',
      'ToolbarButton',
      'ToolbarGroup',
      'ToolbarSeparator',
      'Steps',
      'TextArea',
      'TimePicker',
      'Form',
      'DatePicker',
      'Upload',
      'Tree',
      'TreeSelect',
      'FilterBar',
      'CardList',
      'Timeline',
      'DataGrid',
      'createDataGridColumnHelper',
      'ThemeScope',
      'usePortalContainer',
    ]) {
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

  // Stories, tests and the sample data they share are for this repository, not for consumers.
  it('ships no story, test or fixture modules', async () => {
    const entries = await readdir(distRoot, { recursive: true });
    const devOnly = entries.filter((entry) => /(\.stories|\.test|(^|\/)fixtures)\./.test(entry));
    expect(devOnly).toEqual([]);
  });

  it('ships base.css and the declarations', async () => {
    expect((await stat(path.join(distRoot, 'styles/base.css'))).isFile()).toBe(true);
    const declarations = await readFile(path.join(distRoot, 'index.d.ts'), 'utf8');
    expect(declarations).toContain('Button');
  });

  // 0.2.0 shipped `dist/styles/base.css` with 122 bytes of the source dangling after its last
  // brace: the bundleless compile and `output.copy` both wrote the file, and the shorter write
  // did not truncate the longer one. Browsers skipped the garbage; Vite's minifier refused it and
  // every consumer's production build failed. The copy is now the only writer, so the shipped
  // file is the source, byte for byte.
  it('ships base.css byte for byte from src/styles', async () => {
    const shipped = await readFile(path.join(distRoot, 'styles/base.css'), 'utf8');
    const source = await readFile(path.resolve(distRoot, '../src/styles/base.css'), 'utf8');
    expect(shipped).toBe(source);
  });

  it('emits stylesheets that are structurally whole', async () => {
    const cssFiles = await collectCssFiles(distRoot);
    expect(cssFiles.length).toBeGreaterThan(5);
    for (const file of cssFiles) {
      const css = await readFile(file, 'utf8');
      const opens = css.split('{').length - 1;
      const closes = css.split('}').length - 1;
      expect(opens, `${path.relative(distRoot, file)} has unbalanced braces`).toBe(closes);
      expect(css.trimEnd().endsWith('}'), `${path.relative(distRoot, file)} ends mid-rule`).toBe(
        true,
      );
    }
  });

  it('emits each shared stylesheet once, as its own dist entry', async () => {
    for (const name of ['a11y', 'popup', 'field', 'pair']) {
      expect((await stat(path.join(distRoot, `styles/${name}.module.js`))).isFile()).toBe(true);
      expect((await stat(path.join(distRoot, `styles/${name}_module.css`))).isFile()).toBe(true);
    }
    // One copy of the rule in the whole package: the reason the shared class is imported from
    // TSX rather than `composes`-d, which would inline it into every consuming stylesheet.
    const popupCss = await readFile(path.join(distRoot, 'styles/popup_module.css'), 'utf8');
    expect(popupCss).toMatch(/\.surface-[A-Za-z0-9_-]{5}\b/);
    const fieldCss = await readFile(path.join(distRoot, 'styles/field_module.css'), 'utf8');
    expect(fieldCss).toMatch(/\.control-[A-Za-z0-9_-]{5}\b/);
    const componentCss = await collectCssFiles(path.join(distRoot, 'components'));
    for (const file of componentCss) {
      const css = await readFile(file, 'utf8');
      expect(css, file).not.toContain('clip-path: inset(50%)');
    }
    // One copy of the control surface in the whole package, and it is the shared stylesheet's:
    // `TextInput`'s input, `Select`'s trigger, `Checkbox`'s box and `RadioGroup`'s dot all wear
    // an emitted rule from `field.module.css` rather than restating the input surface in their
    // own. Ruling R1 had to scope this to `components/Select` while the box and the dot each
    // declared the colour themselves; the shared `.controlBox` is what makes the whole-package
    // claim true, so the loop is back over every component stylesheet.
    for (const file of componentCss) {
      const css = await readFile(file, 'utf8');
      expect(css, file).not.toContain('var(--color-surface-input)');
    }
  });

  // Contract §2.1, L1-12: a portal without `container` goes to `<body>` and leaves the theme scope.
  // The scan reads the source, where the element is still `<X.Portal …>`; it must find the nine
  // sites L1 wired, so an empty scan (a moved folder, a broken pattern) cannot pass.
  it('passes the scope’s portal container to every Portal', async () => {
    const portalPattern = /<([A-Za-z]+)\.Portal\b([^>]*)>/g;
    const sites: string[] = [];
    for (const file of await collectComponentSources(componentsSource)) {
      const source = await readFile(file, 'utf8');
      for (const match of source.matchAll(portalPattern)) {
        const site = `${path.relative(componentsSource, file)}: ${match[0]}`;
        sites.push(site);
        expect(match[2], site).toContain('container={container}');
      }
    }
    expect(sites.length).toBeGreaterThanOrEqual(9);
  });

  // L1-13: one brand symbol per page, and it is the tokens package's; a second `Symbol(` here would
  // make every theme fail the check.
  it('reads the theme brand from the tokens package and mints no symbol of its own', async () => {
    const themeScope = await readFile(
      path.join(distRoot, 'components/ThemeScope/ThemeScope.js'),
      'utf8',
    );
    expect(themeScope).toContain('from "@calcifer-design/tokens"');
    expect(themeScope).not.toContain('Symbol(');
  });
});
