import { describe, expect, it } from 'vitest';
import { customPropertyNamesOf, findUnknownCustomProperties } from '../src/custom-property-scan';
import { tokensToCss } from '../src/generate';
import { tokens } from '../src/tokens';

describe('customPropertyNamesOf', () => {
  it('collects every declared custom property', () => {
    expect(customPropertyNamesOf('.a {\n  --x: 1;\n  --y-2: var(--x);\n}')).toEqual(
      new Set(['--x', '--y-2']),
    );
  });

  it('reads declarations after a brace, a semicolon, whitespace and the start of the text', () => {
    expect(customPropertyNamesOf('--first:1;.a{--second:2;--third :3}')).toEqual(
      new Set(['--first', '--second', '--third']),
    );
  });

  it('keeps upper-case letters and underscores in a name', () => {
    expect(customPropertyNamesOf('.a { --Brand_Colour-2: red; }')).toEqual(
      new Set(['--Brand_Colour-2']),
    );
  });

  it('does not count a read as a declaration', () => {
    expect(
      customPropertyNamesOf('.a { color: var(--color-text); width: var( --w , 1px ); }'),
    ).toEqual(new Set());
  });

  it('returns an empty set for a sheet with no custom property', () => {
    expect(customPropertyNamesOf('.a { color: red; }')).toEqual(new Set());
  });
});

describe('findUnknownCustomProperties', () => {
  it('lists the unknown reads sorted, counting the fallback form and tolerating whitespace', () => {
    const css =
      '.a { color: var(--color-text); width: var(--card-list-min-column, 16rem); margin: var( --space-4 ) }';
    expect(findUnknownCustomProperties(css, new Set(['--color-text']))).toEqual([
      '--card-list-min-column',
      '--space-4',
    ]);
  });

  it('lists a name read twice once', () => {
    const css = '.a { margin: var(--space-4); padding: var(--space-4, 1rem); gap: var(--gap) }';
    expect(findUnknownCustomProperties(css, new Set())).toEqual(['--gap', '--space-4']);
  });

  it('returns nothing when every read is defined', () => {
    expect(
      findUnknownCustomProperties('.a { color: var(--x); }', new Set(['--x', '--never-read'])),
    ).toEqual([]);
  });

  it('counts a read nested in the fallback of another read', () => {
    expect(findUnknownCustomProperties('.a { top: var(--a-b, var(--c-d)) }', new Set())).toEqual([
      '--a-b',
      '--c-d',
    ]);
  });

  it('finds no unknown read in the generated tokens sheet against its own declarations', () => {
    const sheet = tokensToCss(tokens);
    const declared = customPropertyNamesOf(sheet);
    expect(declared.size).toBeGreaterThan(0);
    expect(findUnknownCustomProperties(sheet, declared)).toEqual([]);
  });

  it('catches a misspelled token read against the generated sheet', () => {
    const declared = customPropertyNamesOf(tokensToCss(tokens));
    expect(
      findUnknownCustomProperties('.a { border-radius: var(--radius-contorl) }', declared),
    ).toEqual(['--radius-contorl']);
  });
});
