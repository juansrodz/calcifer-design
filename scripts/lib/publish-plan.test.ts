import { describe, expect, it } from 'vitest';
import { publishablePackages, selectUnpublished, type PackageManifest } from './publish-plan';

const manifests: PackageManifest[] = [
  { name: '@calcifer/tokens', version: '0.1.0', private: false, directory: 'packages/tokens' },
  { name: '@calcifer/ui', version: '0.2.0', private: false, directory: 'packages/ui' },
  { name: '@calcifer/tsconfig', version: '0.0.0', private: true, directory: 'packages/tsconfig' },
];

describe('publishablePackages', () => {
  it('drops private packages', () => {
    expect(publishablePackages(manifests).map((manifest) => manifest.name)).toEqual([
      '@calcifer/tokens',
      '@calcifer/ui',
    ]);
  });
});

describe('selectUnpublished', () => {
  it('keeps only the versions the registry does not have yet', async () => {
    const published = new Set(['@calcifer/tokens@0.1.0']);
    const selected = await selectUnpublished(
      publishablePackages(manifests),
      async (name, version) => published.has(`${name}@${version}`),
    );
    expect(selected.map((manifest) => `${manifest.name}@${manifest.version}`)).toEqual([
      '@calcifer/ui@0.2.0',
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
