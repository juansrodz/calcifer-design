import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  customPropertyNamesOf,
  findUnknownCustomProperties,
  tokens,
  tokensToCss,
} from '@calcifer-design/tokens';
import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';

const distRoot = path.resolve(import.meta.dirname, '../../dist');
const componentsSource = path.resolve(import.meta.dirname, '../../src/components');

// R7: every class name the build emits starts with `ui<version>-` (`rslib.config.ts` derives it
// from the same `package.json`), so two ui versions on one page never share a class.
const classPrefix = `ui${packageJson.version.replaceAll('.', '-')}-`;

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

// Custom properties the package reads but never declares, on purpose. Base UI sets the first set
// on the elements it positions or animates (the positioner's anchor and available box, the toast
// stack's index and offset, the tab list's active-tab box); the second set are the ones a
// component's own TSX writes into an inline `style`, so no stylesheet declares them.
const BASE_UI_RUNTIME_PROPERTIES = [
  '--anchor-width',
  '--available-width',
  '--available-height',
  '--transform-origin',
  '--toast-index',
  '--toast-offset-y',
  '--active-tab-left',
  '--active-tab-width',
] as const;

const UI_INLINE_PROPERTIES = [
  '--tree-level',
  '--text-area-rows',
  '--card-list-min-column',
] as const;

// Set by a consumer on the component's root or an ancestor, never declared by the library (L2-5, L2-17, L2-20).
const UI_CONSUMER_HOOK_PROPERTIES = [
  '--icon-button-shadow',
  '--segmented-pressed-shadow',
  '--dialog-heading-size',
  '--dialog-heading-tracking',
  '--dialog-heading-leading',
  '--sheet-handle-width',
  '--sheet-handle-height',
  '--skeleton-radius',
  '--avatar-size',
  '--avatar-font-size',
  '--collapsible-heading-size',
  '--empty-state-heading-size',
  '--toggle-chip-pressed-ring',
  '--progress-bar-track-size',
] as const;

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
      'avatarColorIndex',
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
      'SearchField',
      'Collapsible',
      'TabBar',
      'EmptyState',
      'AvatarGroup',
      'ChoiceCard',
      'ToggleChip',
      'ToggleChipGroup',
      'ProgressBar',
    ]) {
      expect(typeof uiModule[exportName], exportName).toBe('function');
    }
  });

  // `AVATAR_COLOR_COUNT` is a number, so the function list above cannot hold it. Six is the count
  // the theme's `avatarFill1` to `avatarFill6` roles define, and `avatarColorIndex` is modulo it.
  it('exports the avatar colour count from dist/index.js', async () => {
    const uiModule = (await import(path.join(distRoot, 'index.js'))) as Record<string, unknown>;
    expect(uiModule['AVATAR_COLOR_COUNT']).toBe(6);
  });

  // L2-11: `TabBar` warns about its item count behind `process.env.NODE_ENV !== 'production'`,
  // written as that literal expression because it is the one form a consumer's bundler replaces
  // at build time. Rslib must leave it alone: a build that resolved it here would bake the
  // library's own mode into every consumer's bar.
  it('leaves TabBar’s `process.env.NODE_ENV` for the consumer’s bundler', async () => {
    const tabBar = await readFile(path.join(distRoot, 'components/TabBar/TabBar.js'), 'utf8');
    expect(tabBar).toContain('process.env.NODE_ENV');
  });

  it('emits per-component stylesheets with the hashed class-name pattern', async () => {
    const cssFiles = await collectCssFiles(path.join(distRoot, 'components'));
    expect(cssFiles.length).toBeGreaterThan(5);
    const buttonCss = cssFiles.find((file) => file.includes(`${path.sep}Button${path.sep}`));
    expect(buttonCss).toBeDefined();
    const css = await readFile(buttonCss ?? '', 'utf8');
    expect(css).toMatch(new RegExp(`\\.${classPrefix}[a-zA-Z][a-zA-Z0-9]*-[A-Za-z0-9_-]{5}\\b`));
    // The list-row variant (O-21) survives the build, whatever quotes the minifier keeps.
    expect(css).toMatch(/\[data-variant=['"]?row['"]?\]/);
    // The pending state (O-22) survives it too.
    expect(css).toMatch(/\[data-pending\]/);
  });

  // R7: the class selectors are read from rule preludes only (the text before each `{` that does
  // not start with `@`), so `@media` and `@keyframes` preludes and declaration values such as
  // `scale(0.96)` are never scanned. The count guard keeps an empty scan from passing.
  it('prefixes every class selector in every module stylesheet with the package version', async () => {
    const moduleCssFiles = (await collectCssFiles(distRoot)).filter((file) =>
      file.endsWith('_module.css'),
    );
    expect(moduleCssFiles.length).toBeGreaterThan(5);
    const classSelectors: string[] = [];
    const unprefixed: string[] = [];
    for (const file of moduleCssFiles) {
      const css = (await readFile(file, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
      for (const match of css.matchAll(/([^{}]*)\{/g)) {
        const prelude = (match[1] ?? '').slice((match[1] ?? '').lastIndexOf(';') + 1).trim();
        if (prelude.startsWith('@')) continue;
        for (const selector of prelude.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)) {
          const className = selector[1] ?? '';
          classSelectors.push(className);
          if (!className.startsWith(classPrefix)) {
            unprefixed.push(`${path.relative(distRoot, file)}: .${className}`);
          }
        }
      }
    }
    expect(classSelectors.length).toBeGreaterThan(100);
    expect(unprefixed).toEqual([]);
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
    expect(popupCss).toMatch(new RegExp(`\\.${classPrefix}surface-[A-Za-z0-9_-]{5}\\b`));
    const fieldCss = await readFile(path.join(distRoot, 'styles/field_module.css'), 'utf8');
    expect(fieldCss).toMatch(new RegExp(`\\.${classPrefix}control-[A-Za-z0-9_-]{5}\\b`));
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

  // R5: a dialog, a sheet and the toast stack size from percentages, never a viewport unit, so an
  // embedded scope's overlays are meant to follow its box rather than the window. A dialog or
  // sheet resolves against the grid area of its fixed `.viewport`; the toast width,
  // `calc(100% - …)`, against the fixed stack's containing block. The scan is per file:
  // `popup_module.css` carries the surfaces, `Dialog_module.css` the viewport they sit in,
  // `ToastRegion_module.css` the stack. The unit pattern covers the dynamic, small and large
  // variants, the logical axes, `vmin` and `vmax`; the two positive guards keep the scan from
  // passing vacuously if a rule moves out of its file.
  it('sizes dialogs, sheets and toasts without a viewport unit', async () => {
    const files = [
      'styles/popup_module.css',
      'components/Dialog/Dialog_module.css',
      'components/ToastRegion/ToastRegion_module.css',
    ];
    const css: Record<string, string> = {};
    for (const file of files) {
      css[file] = await readFile(path.join(distRoot, file), 'utf8');
      expect(css[file], file).not.toMatch(/\d(?:[sld]?v(?:h|w|i|b)|vmin|vmax)\b/);
    }
    expect(css['styles/popup_module.css']).toContain('max-height: 85%');
    expect(css['components/ToastRegion/ToastRegion_module.css']).toContain('calc(100% -');
  });

  // A `var(--name)` the package never declares resolves to nothing at runtime and fails silently
  // (`--radius-contorl` would). `defined` is every name the tokens' generated sheet declares, every
  // name any shipped stylesheet declares, and the three lists above. The guard keeps an empty scan
  // (a moved dist folder) from passing.
  async function readDistCss(): Promise<{ allDistCss: string; defined: Set<string> }> {
    const cssFiles = await collectCssFiles(distRoot);
    expect(cssFiles.length).toBeGreaterThan(5);
    const allDistCss = (await Promise.all(cssFiles.map((file) => readFile(file, 'utf8')))).join(
      '\n',
    );
    const defined = new Set<string>([
      ...customPropertyNamesOf(tokensToCss(tokens)),
      ...customPropertyNamesOf(allDistCss),
      ...BASE_UI_RUNTIME_PROPERTIES,
      ...UI_INLINE_PROPERTIES,
      ...UI_CONSUMER_HOOK_PROPERTIES,
    ]);
    return { allDistCss, defined };
  }

  it('reads no custom property that the package never declares', async () => {
    const { allDistCss, defined } = await readDistCss();
    expect(allDistCss).toContain('var(--');
    expect(findUnknownCustomProperties(allDistCss, defined)).toEqual([]);
  });

  // The hooks are allowed by name, not by pattern: a misspelt one (`--avatar-sise`) is still an
  // unknown read, so the allow-list cannot hide the typo it exists to catch.
  it('allows each consumer hook by name and still catches a misspelt one', async () => {
    const { defined } = await readDistCss();
    for (const hook of UI_CONSUMER_HOOK_PROPERTIES) {
      expect(defined.has(hook), hook).toBe(true);
    }
    expect(
      findUnknownCustomProperties('.probe { inline-size: var(--avatar-sise); }', defined),
    ).toEqual(['--avatar-sise']);
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
