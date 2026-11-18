# AI usage and decision log

This repo was split out of `juansrodz/portfolio-mfe` on 2026-09-07 with Claude Code as a
pair. The decisions that shaped it (own repo, `@calcifer-design` scope, Base UI over MUI,
Rslib over Vite library mode, direct publishing from `main`, Storybook on GitHub Pages) are
logged with their reasoning in that repo's `AI_USAGE.md`; entries specific to this repo are
added below, newest first, in the same shape: decision, options, why, cost if wrong.

## 2026-11-17: Story play functions run in `check` through the Storybook test-runner

- Decision: `bun run check` ends with `storybook:test`, which serves the built
  `packages/ui/storybook-static` on a free loopback port and runs `@storybook/test-runner`
  0.26.0 (Jest and Playwright, headless Chromium) against it. Every story renders, every
  `play` function runs and addon-a11y's axe check (the preview's `a11y.test: 'error'`) runs;
  a throw or a violation fails the gate. The runner, `playwright` and `playwright-core` are
  pinned exactly in the root devDependencies.
- Options: `@storybook/addon-vitest` (a Vitest browser project with Playwright), or the
  test-runner against the static build.
- Why: addon-vitest runs stories through Vite and only supports Vite-based Storybook
  frameworks; this repo's Storybook is `storybook-react-rsbuild`, so it would need a second,
  Vite-built copy of the Storybook configuration kept in step with the rsbuild one. The
  test-runner works with any builder because it drives the built site, and it reports a
  throwing play itself (Storybook 10's `storyFinished` event alone says "success" then).
- Cost if wrong: the test-runner is at the end of its support. 0.26.0 prints
  "Official support for Test Runner has ended" on every run (Storybook's migration guide
  points to addon-vitest); it still declares Storybook 10 and 11 as peers and works today. It
  also brings Jest 30, Babel, SWC and nyc: about 450 lock entries (942 to 1390). Exit plan:
  move to addon-vitest if the Storybook framework moves to a Vite builder; if the test-runner
  breaks on a Storybook upgrade first, replace it with a small `playwright-core` script that
  reads `storybook-static/index.json`, opens each story's iframe and fails on
  `playFunctionThrewException` or a render error.

## 2026-09-07: CI stages releases; a human approves them

- Decision: the `release` job's trusted publisher can only run `npm stage publish`, never
  `npm publish` directly; a maintainer approves each staged version with 2FA
  (`npm stage approve`, or on npmjs.com) before it becomes public.
- Options: let CI publish directly with `--provenance` under the trusted publisher (as
  first set up), or configure the trusted publisher without "Allow npm publish" so CI can
  only stage.
- Why: npm recommends staged publishing for trusted publishers, and the user chose the
  stronger default over the more convenient one — a compromised or buggy CI run can stage
  a version but not ship it, and provenance still attaches once a human approves.
- Cost if wrong: one manual approval step per release, and `main` sits ahead of what is
  actually public on npm until that approval happens.
