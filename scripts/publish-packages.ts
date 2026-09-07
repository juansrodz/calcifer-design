import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { publishablePackages, selectUnpublished, type PackageManifest } from './lib/publish-plan';

// Publishes every public workspace package whose version the registry does not have yet.
// Packs with `bun pm pack` (which rewrites `workspace:*` and `catalog:` ranges — `npm
// publish` from the directory would ship them verbatim) and publishes the tarball with npm,
// then creates the git tags Changesets expects. `--dry-run` packs and runs `npm publish
// --dry-run` without publishing or tagging.
const repoRoot = path.resolve(import.meta.dir, '..');
// npmjs by default; `NPM_REGISTRY_URL` overrides for a dry run against another registry.
const registryUrl: string = process.env['NPM_REGISTRY_URL'] ?? 'https://registry.npmjs.org/';
// Provenance attestations need the CI OIDC token; a manual first publish cannot produce them.
const withProvenance = process.env['GITHUB_ACTIONS'] === 'true';
const dryRun = process.argv.includes('--dry-run');

async function run(command: string[], cwd: string): Promise<string> {
  const child = Bun.spawn(command, { cwd, stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (exitCode !== 0) {
    throw new Error(`${command.join(' ')} exited ${exitCode}\n${stderr}`);
  }
  return stdout;
}

// Used for the dry-run publish only. npm writes its tarball listing to stderr (stdout carries
// just the `+ name@version` line), so both streams are inherited to show the operator what
// would ship; a failure here is already on screen, which is why nothing is captured.
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
  const publishCommand = [
    'npm',
    'publish',
    tarballPath,
    '--registry',
    registryUrl,
    '--access',
    'public',
  ];
  if (withProvenance) {
    publishCommand.push('--provenance');
  }
  if (dryRun) {
    publishCommand.push('--dry-run');
    await runStreaming(publishCommand, repoRoot);
  } else {
    await run(publishCommand, repoRoot);
  }
  console.log(`${dryRun ? 'dry-run published' : 'published'} ${manifest.name}@${manifest.version}`);
}

if (!dryRun) {
  await createReleaseTags();
}
