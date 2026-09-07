import { satisfies } from 'semver';

export interface PackageManifest {
  name: string;
  version: string;
  private: boolean;
  /** Repo-relative directory holding the package.json. */
  directory: string;
}

export type IsPublished = (name: string, version: string) => Promise<boolean>;

/** The packages that may be published: everything not marked private. */
export function publishablePackages(manifests: PackageManifest[]): PackageManifest[] {
  return manifests.filter((manifest) => !manifest.private);
}

/** The subset whose current version the registry does not have yet, in input order. */
export async function selectUnpublished(
  manifests: PackageManifest[],
  isPublished: IsPublished,
): Promise<PackageManifest[]> {
  const selected: PackageManifest[] = [];
  for (const manifest of manifests) {
    if (!(await isPublished(manifest.name, manifest.version))) {
      selected.push(manifest);
    }
  }
  return selected;
}

/**
 * True when npm's stderr says a `npm stage publish` failed because the version is already
 * staged and awaiting approval — the expected outcome of re-running a release job before a
 * human has approved the previous run's staged version, not a real failure. npm's wording
 * varies; one observed E409 reads:
 *
 *   npm error code E409
 *   npm error 409 Conflict - POST https://registry.npmjs.org/-/stage/package/@calcifer-design%2ftokens - Cannot stage previously published version "0.1.1".
 *
 * "previously published" there describes a version already staged, not one already public:
 * a version that is genuinely public on the registry never reaches this check at all,
 * because `selectUnpublished` filters it out before `npm stage publish` ever runs.
 */
export function isAlreadyStagedError(stderr: string): boolean {
  return /already exists as a staged version|already staged|cannot stage previously published version/i.test(
    stderr,
  );
}

/**
 * Guards against the release defect where a packed tarball names a stale internal
 * dependency version: `@calcifer-design/ui@0.1.1` once shipped depending on
 * `@calcifer-design/tokens@0.1.0` even though tokens 0.1.1 was released in the same run,
 * because `bun pm pack` rewrote the workspace-linked range from a lockfile that `bun
 * install` had left stale.
 *
 * For every packed dependency whose name matches a workspace package, the packed range
 * must both avoid the `workspace:`/`catalog:` protocols (which a published tarball must
 * never carry — `bun pm pack` is expected to rewrite them, but this guards the case where
 * it did not) and be satisfied by that workspace package's current version. A dependency
 * on a package that is not part of this workspace (e.g. `@base-ui/react`) is left alone.
 */
export function assertInternalRangesCurrent(
  packedDependencies: Record<string, string> | undefined,
  workspaceVersions: Record<string, string>,
): void {
  for (const [dependencyName, packedRange] of Object.entries(packedDependencies ?? {})) {
    const workspaceVersion = workspaceVersions[dependencyName];
    if (workspaceVersion === undefined) continue;

    if (packedRange.startsWith('workspace:') || packedRange.startsWith('catalog:')) {
      throw new Error(
        `${dependencyName}: packed range "${packedRange}" is still a "${packedRange.split(':')[0]}:" protocol range; ` +
          `it must be a real semver range before publishing`,
      );
    }

    if (!satisfies(workspaceVersion, packedRange)) {
      throw new Error(
        `${dependencyName}: packed range "${packedRange}" does not include the workspace version ` +
          `"${workspaceVersion}"; bump the range in package.json so the published manifest matches ` +
          `what is actually being released`,
      );
    }
  }
}
