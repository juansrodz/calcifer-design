import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { syncLockWorkspaces, type WorkspaceManifest } from './lib/sync-lock-workspaces';

// Bun 1.3.6 never refreshes bun.lock's "workspaces" bookkeeping when a workspace's own
// package.json changes: `bun install`, `bun install --force`, `bun install --lockfile-only`
// and `bun install --save-text-lockfile` all report "no changes"; only deleting bun.lock
// and reinstalling rewrites it, which also floats every external dependency's version. This
// script instead rewrites just the stale lines — recorded workspace versions and the ranges
// workspace packages declare on each other — leaving the rest of the lockfile untouched.
const repoRoot = path.resolve(import.meta.dir, '..');
const lockPath = path.join(repoRoot, 'bun.lock');

interface PackageJsonShape {
  name: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

async function readWorkspaceManifests(): Promise<WorkspaceManifest[]> {
  const rootManifestJson = JSON.parse(
    await readFile(path.join(repoRoot, 'package.json'), 'utf8'),
  ) as { workspaces?: { packages?: string[] } };
  const workspaceGlobs = rootManifestJson.workspaces?.packages ?? [];

  const manifests: WorkspaceManifest[] = [];
  for (const workspaceGlob of workspaceGlobs) {
    const glob = new Bun.Glob(workspaceGlob);
    for await (const relativePath of glob.scan({ cwd: repoRoot, onlyFiles: false })) {
      const directory = relativePath.split(path.sep).join('/');
      const packageJsonPath = path.join(repoRoot, directory, 'package.json');
      const packageJsonFile = Bun.file(packageJsonPath);
      if (!(await packageJsonFile.exists())) continue;

      const packageJson = (await packageJsonFile.json()) as PackageJsonShape;
      manifests.push({
        directory,
        name: packageJson.name,
        version: packageJson.version,
        dependencies: packageJson.dependencies,
        devDependencies: packageJson.devDependencies,
        peerDependencies: packageJson.peerDependencies,
        optionalDependencies: packageJson.optionalDependencies,
      });
    }
  }
  return manifests.sort((firstManifest, secondManifest) =>
    firstManifest.directory.localeCompare(secondManifest.directory),
  );
}

const manifests = await readWorkspaceManifests();
const lockText = await readFile(lockPath, 'utf8');
const { lockText: updatedLockText, changes } = syncLockWorkspaces(lockText, manifests);

if (changes.length === 0) {
  console.log('bun.lock: workspaces already in sync');
} else {
  for (const change of changes) {
    console.log(change);
  }
  await writeFile(lockPath, updatedLockText);
}
