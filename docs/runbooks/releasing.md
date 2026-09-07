# Releasing

## Every release

1. Open a PR with the change and a changeset (`bun run changeset`). CI fails without one.
2. Merge it. The `release` job on `main` applies the changesets (`changeset version`),
   commits `chore(release): version packages` back to `main`, builds, and stages every
   version npmjs does not have yet with `npm stage publish --access public --provenance`
   through trusted publishing, then pushes the tags. `main` is therefore always what is
   staged, one version commit ahead of the merge — a version is public on npm only after a
   human approves it.
3. Approve the staged version: `npm stage list` to see the pending stage ids,
   `npm stage view <stage-id>` to inspect one, then `npm stage approve <stage-id>` to
   publish it (prompts for 2FA). Approving on the package's npmjs.com page works the same
   way.
   Before staging, the publish script refuses a tarball whose internal dependency range
   (e.g. `@calcifer-design/ui`'s dependency on `@calcifer-design/tokens`) does not include
   that dependency's current workspace version, so a stale `bun.lock` can never make a
   package publish naming an internal dependency version older than what actually shipped.
4. If staging fails after the version commit, fix the cause and start a fresh run on the
   current head of `main`: Actions → ci → Run workflow (`gh workflow run ci.yml --ref main`).
   Do not use "Re-run failed jobs" on the old run: it replays the old commit, re-applies the
   changesets that commit still carried, and its push to `main` is rejected as
   non-fast-forward. The fresh run finds no pending changesets and stages the versions still
   missing. A version already staged from a previous run is not a failure: npm reports
   `E409 … Cannot stage previously published version` for a version that is staged and
   awaiting approval (npm's "previously published" wording covers this case too, not only
   a version actually public on the registry); the job logs
   `already staged, awaiting approval` and continues. Tags are re-created by that next run
   as well, whether or not it has anything left to stage.
5. Two merges close together: the second `release` run waits on the `release-main`
   concurrency group, but the first run's `git push origin HEAD:main` can be rejected as
   non-fast-forward if `main` moved after its checkout. The run fails before staging; the
   next run sees the same pending changesets and completes the release.

## One-time setup (done 2026-09-07; repeat only for a new package)

1. Manual first publish with 2FA from a laptop: `npm login`, `bun run build`, then the
   commands below. npm asks for the second factor once per package.

   ```bash
   packdir="$(mktemp -d)"
   (cd packages/tokens && bun pm pack --destination "$packdir")
   (cd packages/ui && bun pm pack --destination "$packdir")
   npm publish "$packdir/calcifer-design-tokens-0.1.0.tgz" --registry https://registry.npmjs.org/ --access public
   npm publish "$packdir/calcifer-design-ui-0.1.0.tgz" --registry https://registry.npmjs.org/ --access public
   ./node_modules/.bin/changeset tag && git push origin --tags
   ```

   `bun run release` now works for this too, since off CI it streams npm's prompts
   instead of capturing them, so npm can ask for the OTP or open the browser; at the time
   of this first publish it captured them, which is why the commands above were run by
   hand and `changeset tag` was a separate step.

2. On npmjs, Package → Settings → Publishing access: add a trusted publisher —
   GitHub Actions, owner `juansrodz`, repository `calcifer-design`, workflow `ci.yml`,
   environment left empty, with "Allow npm publish" left unchecked so CI can only stage a
   version — never publish it directly. Set publishing access to "Require two-factor
   authentication and disallow tokens"; record here whether the next CI release succeeded
   under that setting.
3. Repository settings: Pages → Source: GitHub Actions. No branch protection that blocks
   the Actions bot from pushing to `main`.

## Record

- 2026-09-07: `0.1.0` of both packages published manually by juansrodz with web-auth 2FA;
  tags `@calcifer-design/tokens@0.1.0` and `@calcifer-design/ui@0.1.0` pushed. First
  CI-staged release: 0.1.1 — run id and approval to be filled in.
