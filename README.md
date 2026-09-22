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

| Package                   | What it is                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@calcifer-design/tokens` | `tokens` object, `tokensToCss`, `contrastRatio`, `breakpoint`; ships `tokens.css`                                                                                                                                                                                                                                                                                                                                          |
| `@calcifer-design/ui`     | `Button`, `Tabs`, `Card`, `Tag`, `StatusDot`, `SkipLink`, `LiveRegion`, `PageHeading`, `NavMenu`, `DataTable`, `Spinner`, `Skeleton`, `IconButton`, `Alert`, `Avatar`, `ErrorBoundary`, `Popover`, `Dialog`, `Menu`, `Tooltip`, `TooltipProvider`, `ToastRegion`, `createToastManager`, `Field`, `TextInput`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `TOOLTIP_DELAY`, `useMediaQuery`, `minWidth`; ships `base.css` |

## The docs app

`apps/docs` is the library's front door: one page — Overview, Tokens, Compositions, Inventory —
that documents the decisions, renders the token ramps and contrast table from the tokens
package's runtime exports, and composes real components rather than listing them. It is a
private workspace, never published, and it ships as a Module Federation remote named `design`
that the portfolio's shell mounts at `/projects/design`; it also runs on its own.

| Command                                      | What it does                           |
| -------------------------------------------- | -------------------------------------- |
| `bun run --filter @calcifer-design/docs dev` | The app on its own, on port 3002       |
| `bun run build:docs`                         | Production build into `apps/docs/dist` |

The Inventory tab reads Storybook's own `index.json` same-origin, so in local development it
needs `bun run storybook` (port 6006) running beside it — the dev server proxies `/storybook`
there. Live, the two are separate pods behind one Ingress and the path is real.

The image is `docker/design.Dockerfile` (nginx serving `apps/docs/dist`), and
`scripts/design-container-smoke.sh <image-tag>` runs it and checks the cache headers the
shell depends on: a revalidating `mf-manifest.json` and `build-info.json`, immutable hashed
assets. It needs Docker and a prior `bun run build:docs`, which is why it is not part of
`bun run check`.

## Commands

| Command                   | What it does                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `bun install`             | Install with the isolated linker                                                                                           |
| `bun run dev`             | Rslib watchers for tokens, then ui                                                                                         |
| `bun run build`           | Build both packages into `dist`                                                                                            |
| `bun run test`            | Vitest across the packages and the publish script                                                                          |
| `bun run test:dist`       | Checks the built output; needs `build` first                                                                               |
| `bun run lint`            | ESLint, stylelint (token-only CSS values), Prettier check                                                                  |
| `bun run typecheck`       | Builds tokens, then root `tsc`, then each workspace's own typecheck (ui builds itself first so its CSS Module types exist) |
| `bun run storybook`       | Storybook on port 6006                                                                                                     |
| `bun run storybook:build` | Static Storybook into `packages/ui/storybook-static`                                                                       |
| `bun run changeset`       | Add a changeset (CI requires one for any package change)                                                                   |
| `bun run release`         | Stage unpublished versions on npmjs from CI (`main`); publishes directly when run by hand with 2FA                         |
| `bun run check`           | lint, typecheck, test, build, dist test, Storybook build                                                                   |

Releases: every merge to `main` with a pending changeset stages a release on npmjs, which a
maintainer then approves with 2FA; `main` is always what is staged. See
`docs/runbooks/releasing.md`. Decisions and their reasons are in `AI_USAGE.md`.
