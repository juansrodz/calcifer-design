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
