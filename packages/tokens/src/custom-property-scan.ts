const readPattern = /var\(\s*(--[A-Za-z0-9_-]+)/g;
const declarationPattern = /(?:^|[\s;{])(--[A-Za-z0-9_-]+)\s*:/g;

/** Every `var(--name…)` read in `css` whose name is not in `defined`, deduplicated and sorted. */
export function findUnknownCustomProperties(css: string, defined: ReadonlySet<string>): string[] {
  const unknownNames = new Set<string>();

  for (const match of css.matchAll(readPattern)) {
    const name = match[1] ?? '';
    if (!defined.has(name)) unknownNames.add(name);
  }

  return [...unknownNames].sort();
}

/** Every `--name:` declaration in `css` (a generated sheet or a stylesheet). */
export function customPropertyNamesOf(css: string): Set<string> {
  const names = new Set<string>();

  for (const match of css.matchAll(declarationPattern)) {
    names.add(match[1] ?? '');
  }

  return names;
}
