declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// TypeScript 6.0's TS2882 requires a resolvable module even for plain
// side-effect CSS imports (`.storybook/preview.tsx` imports
// `@calcifer-design/tokens/tokens.css` and `../src/styles/base.css` this way).
declare module '*.css';
