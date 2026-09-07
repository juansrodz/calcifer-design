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
 * human has approved the previous run's staged version, not a real failure.
 */
export function isAlreadyStagedError(stderr: string): boolean {
  return /already exists as a staged version|already staged/i.test(stderr);
}
