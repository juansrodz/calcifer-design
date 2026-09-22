import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { uiVersion } from '../../build/build-info-plugin';

const thisDirectory = dirname(fileURLToPath(import.meta.url));
const distRoot = resolve(thisDirectory, '../../dist');

interface PublishedSharedEntry {
  name: unknown;
}

interface PublishedBuildInfo {
  schemaVersion: unknown;
  generatedAt: unknown;
  bundler: { name: unknown };
  moduleFederation: { options: unknown; shared: PublishedSharedEntry[] };
  summary: { remoteCount: unknown; exposeCount: unknown; sharedCount: unknown };
  build: { commit: unknown; ref: unknown; builtAt: unknown; version: unknown };
}

describe('dist/build-info.json', () => {
  const buildInfo = JSON.parse(
    readFileSync(resolve(distRoot, 'build-info.json'), 'utf8'),
  ) as PublishedBuildInfo;

  it('carries what the shell validates before it reads a card version', () => {
    expect(buildInfo.schemaVersion).toBe(1);
    expect(['string', 'number']).toContain(typeof buildInfo.generatedAt);
    expect(typeof buildInfo.bundler.name).toBe('string');
    expect(buildInfo.moduleFederation.options).toBeTypeOf('object');
    expect(Array.isArray(buildInfo.moduleFederation.shared)).toBe(true);
    expect(
      buildInfo.moduleFederation.shared.every(
        (sharedEntry) => typeof sharedEntry.name === 'string',
      ),
    ).toBe(true);
    // The observability plugin expands each trailing-slash shared key (react-dom/,
    // @base-ui/react/) into every subpath the build actually consumed (react-dom/client,
    // @base-ui/react/popover, ...), so this count is larger than the five keys configured in
    // shared-dependencies.ts and depends on what the app imports — it must never be pinned.
    expect(buildInfo.summary).toEqual({
      remoteCount: 0,
      exposeCount: 1,
      sharedCount: expect.any(Number),
    });
  });

  it('is stamped with the library version and the build time', () => {
    expect(buildInfo.build.version).toBe(uiVersion);
    expect(buildInfo.build.builtAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(buildInfo.build.commit === null || typeof buildInfo.build.commit === 'string').toBe(
      true,
    );
  });
});
