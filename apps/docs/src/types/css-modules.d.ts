declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// TypeScript 6.0's TS2882 requires a resolvable module even for a plain side-effect CSS
// import: `src/index.tsx` pulls in the font faces, `@calcifer-design/tokens/tokens.css` and
// `@calcifer-design/ui/base.css` that way.
declare module '*.css';
