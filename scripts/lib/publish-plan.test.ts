import { describe, expect, it } from 'vitest';
import {
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

  it('does not match an unrelated publish failure', () => {
    expect(isAlreadyStagedError('npm error 403 Forbidden - you do not have permission')).toBe(
      false,
    );
  });
});
