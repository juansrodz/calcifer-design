import type { Tokens } from './tokens';

export function toKebab(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/(\d)([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z]{2,})(\d)/g, '$1-$2')
    .toLowerCase();
}

type Leaf = string | number;
type Tree = { readonly [key: string]: Leaf | Tree };

function flatten(prefix: string, tree: Tree, output: string[]): void {
  for (const [key, value] of Object.entries(tree)) {
    const name = `${prefix}-${toKebab(key)}`;
    if (typeof value === 'object') {
      flatten(name, value, output);
    } else {
      output.push(`  ${name}: ${value};`);
    }
  }
}

function block(selector: string, lines: string[], indent = ''): string {
  const body = lines.map((line) => `${indent}${line}`).join('\n');
  return `${indent}${selector} {\n${body}\n${indent}}`;
}

export function tokensToCss(tokens: Tokens): string {
  const sharedLines: string[] = ['  color-scheme: light dark;'];
  flatten('--font', tokens.shared.font, sharedLines);
  flatten('--text', tokens.shared.text, sharedLines);
  flatten('--leading', tokens.shared.leading, sharedLines);
  flatten('--tracking', tokens.shared.tracking, sharedLines);
  flatten('--space', tokens.shared.space, sharedLines);
  flatten('--radius', tokens.shared.radius, sharedLines);
  flatten('--border-width', tokens.shared.borderWidth, sharedLines);
  flatten('--motion', tokens.shared.motion, sharedLines);
  flatten('--size', tokens.shared.size, sharedLines);
  flatten('--material', tokens.shared.material, sharedLines);
  sharedLines.push(`  --measure: ${tokens.shared.measure};`);
  sharedLines.push(`  --focus-ring-width: ${tokens.shared.focusRingWidth};`);
  sharedLines.push(`  --focus-ring-offset: ${tokens.shared.focusRingOffset};`);

  const lightLines: string[] = [];
  flatten('--color', tokens.themes.light.color, lightLines);
  flatten('--elevation', tokens.themes.light.elevation, lightLines);
  flatten('--material', tokens.themes.light.material, lightLines);

  const darkLines: string[] = ['  color-scheme: dark;'];
  flatten('--color', tokens.themes.dark.color, darkLines);
  flatten('--elevation', tokens.themes.dark.elevation, darkLines);
  flatten('--material', tokens.themes.dark.material, darkLines);

  const reducedMotionLines = [
    ...Object.keys(tokens.shared.motion.duration).map(
      (step) => `  --motion-duration-${step}: 0ms;`,
    ),
    // Springs default to an overshooting damping ratio (0.8); reduced motion needs the
    // critically-damped value (1) so entrances settle without any spring bounce.
    '  --motion-spring-default-damping: 1;',
    '  --motion-spring-momentum-damping: 1;',
  ];

  return [
    '/* Generated from packages/tokens/src/tokens.ts. Do not edit. */',
    block(':root', [...sharedLines, ...lightLines]),
    block(':root[data-theme="dark"]', darkLines),
    block(':root[data-theme="light"]', ['  color-scheme: light;']),
    `@media (prefers-color-scheme: dark) {\n${block(':root:not([data-theme="light"])', darkLines, '  ')}\n}`,
    `@media (prefers-reduced-motion: reduce) {\n${block(':root', reducedMotionLines, '  ')}\n}`,
    '',
  ].join('\n\n');
}
