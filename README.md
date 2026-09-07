# calcifer-design

Design tokens and a React component library on Base UI, styled entirely through CSS custom
properties so a consuming app restyles everything by supplying its own `tokens.css`.

Storybook: https://juansrodz.github.io/calcifer-design/

## Install

```bash
bun add @calcifer-design/ui @calcifer-design/tokens
```

```ts
import '@calcifer-design/tokens/tokens.css';
import '@calcifer-design/ui/base.css';
import { Button } from '@calcifer-design/ui';
```

React 19 is a peer dependency of `@calcifer-design/ui`.

## Packages

| Package                   | What it is                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@calcifer-design/tokens` | `tokens` object, `tokensToCss`, `contrastRatio`, `breakpoint`; ships `tokens.css`                                                                            |
| `@calcifer-design/ui`     | `Button`, `Tabs`, `Card`, `Tag`, `StatusDot`, `SkipLink`, `LiveRegion`, `PageHeading`, `NavMenu`, `DataTable`, `useMediaQuery`, `minWidth`; ships `base.css` |

## Commands

| Command                   | What it does                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `bun install`             | Install with the isolated linker                                                                   |
| `bun run dev`             | Rslib watchers for tokens, then ui                                                                 |
| `bun run build`           | Build both packages into `dist`                                                                    |
| `bun run test`            | Vitest across the packages and the publish script                                                  |
| `bun run test:dist`       | Checks the built output; needs `build` first                                                       |
| `bun run lint`            | ESLint, stylelint (token-only CSS values), Prettier check                                          |
| `bun run typecheck`       | `tsc` in every workspace (ui builds first so its CSS Module types exist)                           |
| `bun run storybook`       | Storybook on port 6006                                                                             |
| `bun run storybook:build` | Static Storybook into `packages/ui/storybook-static`                                               |
| `bun run changeset`       | Add a changeset (CI requires one for any package change)                                           |
| `bun run release`         | Stage unpublished versions on npmjs from CI (`main`); publishes directly when run by hand with 2FA |
| `bun run check`           | lint, typecheck, test, build, dist test, Storybook build                                           |

Releases: every merge to `main` with a pending changeset stages a release on npmjs, which a
maintainer then approves with 2FA; `main` is always what is staged. See
`docs/runbooks/releasing.md`. Decisions and their reasons are in `AI_USAGE.md`.
