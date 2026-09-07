import { describe, expect, it } from 'vitest';
import {
  assertInternalRangesCurrent,
  isAlreadyStagedError,
  publishablePackages,
  selectUnpublished,
  type PackageManifest,
} from './publish-plan';

const manifests: PackageManifest[] = [
  {
    name: '@calcifer-design/tokens',
    version: '0.1.0',
    private: false,
    directory: 'packages/tokens',
  },
  { name: '@calcifer-design/ui', version: '0.2.0', private: false, directory: 'packages/ui' },
  {
    name: '@calcifer-design/tsconfig',
    version: '0.0.0',
    private: true,
    directory: 'packages/tsconfig',
  },
];

describe('publishablePackages', () => {
  it('drops private packages', () => {
    expect(publishablePackages(manifests).map((manifest) => manifest.name)).toEqual([
      '@calcifer-design/tokens',
      '@calcifer-design/ui',
    ]);
  });
});

describe('selectUnpublished', () => {
  it('keeps only the versions the registry does not have yet', async () => {
    const published = new Set(['@calcifer-design/tokens@0.1.0']);
    const selected = await selectUnpublished(
      publishablePackages(manifests),
      async (name, version) => published.has(`${name}@${version}`),
    );
    expect(selected.map((manifest) => `${manifest.name}@${manifest.version}`)).toEqual([
      '@calcifer-design/ui@0.2.0',
    ]);
  });

  it('propagates a registry lookup failure instead of guessing', async () => {
    await expect(
      selectUnpublished(publishablePackages(manifests), async () => {
        throw new Error('registry unreachable');
      }),
    ).rejects.toThrow('registry unreachable');
  });
});

describe('isAlreadyStagedError', () => {
  it('recognises npm refusing to re-stage an approved-pending version', () => {
    expect(
      isAlreadyStagedError(
        'npm error 409 Conflict - PUT https://registry.npmjs.org/@calcifer-design%2fui - ' +
          '@calcifer-design/ui@0.1.0 already exists as a staged version',
      ),
    ).toBe(true);
  });

  it('recognises npm E409 "Cannot stage previously published version" for a staged-but-unapproved version', () => {
    expect(
      isAlreadyStagedError(
        'npm error code E409\n' +
          'npm error 409 Conflict - POST https://registry.npmjs.org/-/stage/package/@calcifer-design%2ftokens - Cannot stage previously published version "0.1.1".',
      ),
    ).toBe(true);
  });

  it('does not match an unrelated publish failure', () => {
    expect(isAlreadyStagedError('npm error 403 Forbidden - you do not have permission')).toBe(
      false,
    );
  });
});

describe('assertInternalRangesCurrent', () => {
  const workspaceVersions = { '@calcifer-design/tokens': '0.1.1' };

  it('passes for a caret range that includes the workspace version', () => {
    expect(() =>
      assertInternalRangesCurrent({ '@calcifer-design/tokens': '^0.1.1' }, workspaceVersions),
    ).not.toThrow();
  });

  it('passes for an exact range matching the workspace version', () => {
    expect(() =>
      assertInternalRangesCurrent({ '@calcifer-design/tokens': '0.1.1' }, workspaceVersions),
    ).not.toThrow();
  });

  it('throws when the packed range does not include the workspace version', () => {
    expect(() =>
      assertInternalRangesCurrent({ '@calcifer-design/tokens': '0.1.0' }, workspaceVersions),
    ).toThrow(/@calcifer-design\/tokens.*0\.1\.0.*0\.1\.1/s);
  });

  it('throws when the packed range is still a workspace: protocol range', () => {
    expect(() =>
      assertInternalRangesCurrent({ '@calcifer-design/tokens': 'workspace:*' }, workspaceVersions),
    ).toThrow(/workspace:/);
  });

  it('throws when the packed range is still a catalog: protocol range', () => {
    expect(() =>
      assertInternalRangesCurrent({ '@calcifer-design/tokens': 'catalog:' }, workspaceVersions),
    ).toThrow(/catalog:/);
  });

  it('ignores dependencies that are not part of this workspace', () => {
    expect(() =>
      assertInternalRangesCurrent({ '@base-ui/react': '^1.8.0' }, workspaceVersions),
    ).not.toThrow();
  });

  it('does nothing when there are no packed dependencies', () => {
    expect(() => assertInternalRangesCurrent(undefined, workspaceVersions)).not.toThrow();
  });
});
