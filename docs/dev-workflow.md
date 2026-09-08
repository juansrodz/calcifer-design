# Dev workflow

## `bun run dev`

`scripts/dev.ts` starts the tokens watcher (Rslib plus the `tokens.css` writer), waits for
its `dist` to be rewritten, then starts ui's watcher. Both packages export from `dist`, so
anything that consumes them, including Storybook and the dist tests, sees the built artifact.

## Developing against a consumer

To try an unreleased change in an app that depends on these packages:

```bash
# in this repo
bun run dev
(cd packages/tokens && bun link)
(cd packages/ui && bun link)
# in the consuming repo
bun link @calcifer-design/tokens @calcifer-design/ui
```

Undo with `bun unlink @calcifer-design/tokens @calcifer-design/ui` in the consumer followed
by `bun install`, and `bun unlink` in each package here.

## Storybook

`bun run storybook` serves it on port 6006; `bun run storybook:build` writes
`packages/ui/storybook-static`, which the `pages` job deploys to
https://juansrodz.github.io/calcifer-design/ on every push to `main`.

## Versioning

A package change needs a changeset (`bun run changeset`); if you bump a workspace's version
by hand instead of through `changeset version`, also run `bun run lock:sync` so `bun.lock`'s
recorded workspace versions and internal ranges stay in sync — see `docs/runbooks/releasing.md`.
