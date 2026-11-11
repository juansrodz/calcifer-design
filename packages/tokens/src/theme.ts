import { tokens } from './tokens';
import type { ColorName, SharedTokens, ThemeTokens } from './tokens';

type Leaf = string | number;

/** Every leaf widened to `string`: the shape of a resolved theme. */
export type TokenValues<Tree> = {
  readonly [Key in keyof Tree]: Tree[Key] extends Leaf ? string : TokenValues<Tree[Key]>;
};

/** Every node optional, every leaf a string: what a brand may override. */
export type TokenOverrides<Tree> = {
  readonly [Key in keyof Tree]?: Tree[Key] extends Leaf ? string : TokenOverrides<Tree[Key]>;
};

/** Maps any key the shape lacks to `never`, recursively through objects (not arrays), so a spread object fails too. */
export type NoExtraKeys<Candidate, Shape> = {
  readonly [Key in keyof Candidate]: Key extends keyof Shape
    ? Candidate[Key] extends readonly unknown[]
      ? Candidate[Key]
      : Candidate[Key] extends object
        ? NoExtraKeys<Candidate[Key], NonNullable<Shape[Key]>>
        : Candidate[Key]
    : never;
};

export type ContrastPair = readonly [ColorName, ColorName];

/**
 * Brand-only tokens the library never reads, emitted as `--<prefix>-<kebab(name)>` in every block
 * of the scoped sheet. `Name` is inferred from `light` AND `dark`, so a key present on one side and
 * missing on the other does not compile.
 */
export interface CustomTokens<Name extends string> {
  /** `/^[a-z][a-z0-9]*$/`: 'wbw' → `--wbw-…`. */
  readonly prefix: string;
  /** Mode-independent brand tokens (type steps, glows the modes share). */
  readonly shared?: Readonly<Record<string, string>>;
  readonly light: Readonly<Record<Name, string>>;
  readonly dark: Readonly<Record<Name, string>>;
}

export interface ThemeDefinition<CustomName extends string = never> {
  /** The scope class without the dot. `/^[a-z][a-z0-9-]*$/`, checked at runtime. */
  readonly className: string;
  readonly shared?: TokenOverrides<SharedTokens>;
  readonly light?: TokenOverrides<ThemeTokens>;
  readonly dark?: TokenOverrides<ThemeTokens>;
  readonly custom?: CustomTokens<CustomName>;
  /** Pairs from `textContrastPairs`/`uiContrastPairs`/`extraPairs` this brand keeps as drawn (Q2 b). */
  readonly contrastExemptions?: ReadonlyArray<ContrastPair>;
}

export type CustomNameOf<Definition> = Definition extends {
  readonly custom: CustomTokens<infer Name>;
}
  ? Name
  : never;

/** Exported (declaration emit needs it); `defineTheme` stamps it on every theme it returns. */
export const themeBrand: unique symbol = Symbol('calcifer-design-theme');

/** The resolved theme: the complete token set with the brand's values laid over the defaults. */
export interface Theme<CustomName extends string = string> {
  readonly className: string;
  readonly shared: TokenValues<SharedTokens>;
  readonly light: TokenValues<ThemeTokens>;
  readonly dark: TokenValues<ThemeTokens>;
  readonly custom: {
    readonly prefix: string | null;
    readonly shared: Readonly<Record<string, string>>;
    readonly light: Readonly<Record<CustomName, string>>;
    readonly dark: Readonly<Record<CustomName, string>>;
  };
  readonly contrastExemptions: ReadonlyArray<ContrastPair>;
  /** Only `defineTheme` makes one: `ThemeScope` and `themeToCss` refuse a hand-written object. */
  readonly [themeBrand]: true;
}

const classNamePattern = /^[a-z][a-z0-9-]*$/;
const prefixPattern = /^[a-z][a-z0-9]*$/;

type PlainTree = { readonly [key: string]: unknown };

function isPlainTree(value: unknown): value is PlainTree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Lays `overrides` over `base`: objects key by key, leaves replaced, arrays never merged. The result
 * has exactly the keys of `base` and is built from fresh objects, so neither input is shared with it.
 */
function mergeTree(base: PlainTree, overrides: unknown): PlainTree {
  const overrideTree = isPlainTree(overrides) ? overrides : {};
  const merged: Record<string, unknown> = {};
  for (const [key, baseValue] of Object.entries(base)) {
    const override = Object.hasOwn(overrideTree, key) ? overrideTree[key] : undefined;
    if (isPlainTree(baseValue)) {
      merged[key] = mergeTree(baseValue, override);
    } else {
      merged[key] = override === undefined ? baseValue : override;
    }
  }
  return merged;
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value === 'object' && value !== null) {
    for (const member of Object.values(value)) deepFreeze(member);
    Object.freeze(value);
  }
  return value;
}

export function defineTheme<const Definition extends ThemeDefinition<string>>(
  definition: Definition & NoExtraKeys<Definition, ThemeDefinition<CustomNameOf<Definition>>>,
): Theme<CustomNameOf<Definition>> {
  const { className, custom, contrastExemptions } = definition;
  if (!classNamePattern.test(className)) {
    throw new Error(`defineTheme: className "${className}" must match ${classNamePattern}`);
  }
  if (custom !== undefined && !prefixPattern.test(custom.prefix)) {
    throw new Error(`defineTheme: custom.prefix "${custom.prefix}" must match ${prefixPattern}`);
  }
  const theme: Theme<string> = {
    className,
    shared: mergeTree(tokens.shared, definition.shared) as TokenValues<SharedTokens>,
    light: mergeTree(tokens.themes.light, definition.light) as TokenValues<ThemeTokens>,
    dark: mergeTree(tokens.themes.dark, definition.dark) as TokenValues<ThemeTokens>,
    custom: {
      prefix: custom === undefined ? null : custom.prefix,
      shared: { ...custom?.shared },
      light: { ...custom?.light },
      dark: { ...custom?.dark },
    },
    contrastExemptions: (contrastExemptions ?? []).map((pair): ContrastPair => [pair[0], pair[1]]),
    [themeBrand]: true,
  };
  return deepFreeze(theme) as Theme<CustomNameOf<Definition>>;
}
