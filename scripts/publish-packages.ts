import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  isAlreadyStagedError,
  publishablePackages,
  selectUnpublished,
  type PackageManifest,
} from './lib/publish-plan';

// Publishes every public workspace package whose version the registry does not have yet.
// Packs with `bun pm pack` (which rewrites `workspace:*` and `catalog:` ranges — `npm
// publish` from the directory would ship them verbatim), then hands the tarball to npm, and
// finally creates the git tags Changesets expects.
//
// Two publish paths, depending on where this runs:
//   - On CI (GitHub Actions), the npm trusted publisher is configured without "Allow npm
//     publish", so this runs `npm stage publish --provenance` instead of `npm publish`: it
//     stages the version for a human to approve with 2FA (`npm stage approve`, see
//     docs/runbooks/releasing.md). A re-run before that approval finds the version already
//     staged; that specific npm failure is treated as success so the job stays green while
//     approval is pending, instead of failing every run until someone approves.
//   - Off CI, a human with 2FA runs `npm publish` directly, with stdio inherited so npm can
//     prompt for the one-time password or open the browser for web-based 2FA.
// `--dry-run` packs and runs the applicable command with `--dry-run` on whichever path
// applies, without publishing, staging, or tagging.
const repoRoot = path.resolve(import.meta.dir, '..');
// npmjs by default; `NPM_REGISTRY_URL` overrides for a dry run against another registry.
const registryUrl: string = process.env['NPM_REGISTRY_URL'] ?? 'https://registry.npmjs.org/';
const runningOnCI = process.env['GITHUB_ACTIONS'] === 'true';
const dryRun = process.argv.includes('--dry-run');

/** A failed command's stderr, kept alongside the message so callers can inspect it. */
class CommandFailure extends Error {
  readonly stderr: string;

  constructor(message: string, stderr: string) {
    super(message);
    this.stderr = stderr;
  }
}

async function run(command: string[], cwd: string): Promise<string> {
  const child = Bun.spawn(command, { cwd, stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (exitCode !== 0) {
    throw new CommandFailure(`${command.join(' ')} exited ${exitCode}\n${stderr}`, stderr);
  }
  return stdout;
}

// Used for a real publish (off CI, so npm can prompt for the one-time password or open the
// browser for web-based 2FA) and for every dry run (so the operator sees what would ship).
// Both streams are inherited, which is why nothing is captured or returned here. Do not use
// this where the caller needs to inspect stderr on failure (it throws a plain `Error`, not a
// `CommandFailure`) — use `run` instead.
async function runStreaming(command: string[], cwd: string): Promise<void> {
  const child = Bun.spawn(command, { cwd, stdout: 'inherit', stderr: 'inherit' });
  const exitCode = await child.exited;
  if (exitCode !== 0) {
    throw new Error(`${command.join(' ')} exited ${exitCode} (output above)`);
  }
}

async function readManifests(): Promise<PackageManifest[]> {
  const packagesRoot = path.join(repoRoot, 'packages');
  const manifests: PackageManifest[] = [];
  for (const entry of await readdir(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = path.join('packages', entry.name);
    const manifest = JSON.parse(
      await readFile(path.join(repoRoot, directory, 'package.json'), 'utf8'),
    ) as { name: string; version: string; private?: boolean };
    manifests.push({
      name: manifest.name,
      version: manifest.version,
      private: manifest.private === true,
      directory,
    });
  }
  return manifests.sort((left, right) => left.name.localeCompare(right.name));
}

async function isPublished(name: string, version: string): Promise<boolean> {
  const child = Bun.spawn(
    ['npm', 'view', `${name}@${version}`, 'version', '--registry', registryUrl],
    {
      cwd: repoRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (exitCode === 0) return stdout.trim().length > 0;
  if (/E404|404 Not Found/.test(stderr)) return false;
  throw new Error(`npm view ${name}@${version} failed:\n${stderr}`);
}

function tarballName(manifest: PackageManifest): string {
  return `${manifest.name.replace(/^@/, '').replace('/', '-')}-${manifest.version}.tgz`;
}

async function assertNoWorkspaceRanges(tarballPath: string): Promise<void> {
  const packed = await run(['tar', '-xOf', tarballPath, 'package/package.json'], repoRoot);
  const manifest = JSON.parse(packed) as Record<string, Record<string, string> | undefined>;
  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const [dependency, range] of Object.entries(manifest[field] ?? {})) {
      if (range.startsWith('workspace:') || range.startsWith('catalog:')) {
        throw new Error(`${tarballPath}: ${field}.${dependency} is still "${range}"`);
      }
    }
  }
}

// Re-creates the git tags Changesets expects from the current package versions. Runs after
// publishing, and also when there is nothing to publish, so that a release whose tag push
// failed gets its tags re-created the next time this script runs.
async function createReleaseTags(): Promise<void> {
  console.log(await run(['./node_modules/.bin/changeset', 'tag'], repoRoot));
  console.log('git tags created; the workflow pushes them');
}

async function stageOnCI(tarballPath: string, manifest: PackageManifest): Promise<void> {
  const stageCommand = [
    'npm',
    'stage',
    'publish',
    tarballPath,
    '--registry',
    registryUrl,
    '--access',
    'public',
    '--provenance',
  ];
  if (dryRun) {
    stageCommand.push('--dry-run');
    await runStreaming(stageCommand, repoRoot);
    console.log(`dry-run staged ${manifest.name}@${manifest.version}`);
    return;
  }
  try {
    console.log(await run(stageCommand, repoRoot));
    console.log(
      `staged ${manifest.name}@${manifest.version} (approve with: npm stage approve, see docs/runbooks/releasing.md)`,
    );
  } catch (error) {
    if (error instanceof CommandFailure && isAlreadyStagedError(error.stderr)) {
      console.log(`already staged, awaiting approval: ${manifest.name}@${manifest.version}`);
      return;
    }
    throw error;
  }
}

async function publishLocally(tarballPath: string, manifest: PackageManifest): Promise<void> {
  const publishCommand = [
    'npm',
    'publish',
    tarballPath,
    '--registry',
    registryUrl,
    '--access',
    'public',
  ];
  if (dryRun) {
    publishCommand.push('--dry-run');
  }
  await runStreaming(publishCommand, repoRoot);
  console.log(`${dryRun ? 'dry-run published' : 'published'} ${manifest.name}@${manifest.version}`);
}

const candidates = publishablePackages(await readManifests());
const toPublish = await selectUnpublished(candidates, isPublished);
if (toPublish.length === 0) {
  console.log('nothing to publish: every public package version is already in the registry');
  if (!dryRun) {
    await createReleaseTags();
  }
  process.exit(0);
}

const packDirectory = await mkdtemp(path.join(tmpdir(), 'calcifer-design-publish-'));
for (const manifest of toPublish) {
  const packageDirectory = path.join(repoRoot, manifest.directory);
  await run(['bun', 'pm', 'pack', '--destination', packDirectory], packageDirectory);
  const tarballPath = path.join(packDirectory, tarballName(manifest));
  await assertNoWorkspaceRanges(tarballPath);

  if (runningOnCI) {
    await stageOnCI(tarballPath, manifest);
  } else {
    await publishLocally(tarballPath, manifest);
  }
}

if (!dryRun) {
  await createReleaseTags();
}
