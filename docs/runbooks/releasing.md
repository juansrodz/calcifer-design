# Releasing

## Every release

1. Open a PR with the change and a changeset (`bun run changeset`). CI fails without one.
2. Merge it. The `release` job on `main` applies the changesets (`changeset version`),
   commits `chore(release): version packages` back to `main`, builds, publishes every
   version npmjs does not have yet with `--access public --provenance` through trusted
   publishing, and pushes the tags. `main` is therefore always what is on npm, one version
   commit ahead of the merge.
3. If publishing fails after the version commit, fix the cause and push anything to `main`;
   the job finds no pending changesets and publishes the versions still missing. Tags are
   re-created by that next run as well, whether or not it has anything left to publish.
4. Two merges close together: the second `release` run waits on the `release-main`
   concurrency group, but the first run's `git push origin HEAD:main` can be rejected as
   non-fast-forward if `main` moved after its checkout. The run fails before publishing;
   the next run sees the same pending changesets and completes the release.

## One-time setup (done 2026-09-07; repeat only for a new package)

1. Manual first publish with 2FA from a laptop: `npm login`, `bun run build`,
   `bun run release`. npm asks for the second factor once per package.
2. On npmjs, Package → Settings → Publishing access: add a trusted publisher —
   GitHub Actions, owner `juansrodz`, repository `calcifer-design`, workflow `ci.yml`,
   environment left empty. Set publishing access to "Require two-factor authentication and
   disallow tokens"; record here whether the next CI release succeeded under that setting.
3. Repository settings: Pages → Source: GitHub Actions. No branch protection that blocks
   the Actions bot from pushing to `main`.

## Record

- 0.1.0 of both packages: manual publish, date, npm URLs, and the run id of the first CI
  release, filled in by plan 5 Task 3.
