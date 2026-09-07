# AI usage and decision log

This repo was split out of `juansrodz/portfolio-mfe` on 2026-09-07 with Claude Code as a
pair. The decisions that shaped it (own repo, `@calcifer-design` scope, Base UI over MUI,
Rslib over Vite library mode, direct publishing from `main`, Storybook on GitHub Pages) are
logged with their reasoning in that repo's `AI_USAGE.md`; entries specific to this repo are
added below, newest first, in the same shape: decision, options, why, cost if wrong.

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
