import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildStamp, mergeBuildInfo, uiVersion } from './build-info-plugin';

const thisDirectory = dirname(fileURLToPath(import.meta.url));
const fixedNow = new Date('2026-09-22T00:00:00.000Z');

describe('buildStamp', () => {
  it('prefers the GitHub Actions variables over git', () => {
    const stamp = buildStamp(
      { GITHUB_SHA: 'abcdef1234567890abcdef1234567890abcdef12', GITHUB_REF_NAME: 'main' },
      () => 'must-not-be-used',
      fixedNow,
    );
    expect(stamp).toEqual({
      commit: 'abcdef1234567890abcdef1234567890abcdef12',
      ref: 'main',
      builtAt: '2026-09-22T00:00:00.000Z',
      version: uiVersion,
    });
  });

  it('falls back to git for the commit and the ref', () => {
    const calls: string[][] = [];
    const stamp = buildStamp(
      {},
      (gitArguments) => {
        calls.push(gitArguments);
        return gitArguments.includes('--abbrev-ref') ? 'delta/docs-app' : '0123456789abcdef';
      },
      fixedNow,
    );
    expect(stamp.commit).toBe('0123456789abcdef');
    expect(stamp.ref).toBe('delta/docs-app');
    expect(calls).toEqual([
      ['rev-parse', 'HEAD'],
      ['rev-parse', '--abbrev-ref', 'HEAD'],
    ]);
  });

  it('records null when neither source answers', () => {
    const stamp = buildStamp({}, () => null, fixedNow);
    expect(stamp.commit).toBeNull();
    expect(stamp.ref).toBeNull();
  });
});

describe('uiVersion', () => {
  it('is the library version the docs app documents', () => {
    expect(uiVersion).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('matches packages/ui/package.json, not apps/docs/package.json', () => {
    // Read independently of the module under test: if the module's relative path ever slipped
    // to apps/docs/package.json instead, both this app's version and the library's would still
    // match the regex above, and would even happen to equal the built file if the module read
    // the same wrong path consistently. Only reading the manifest a second, independent way
    // catches that.
    const uiPackageJson = JSON.parse(
      readFileSync(resolve(thisDirectory, '../../../packages/ui/package.json'), 'utf8'),
    ) as { version: string };
    expect(uiVersion).toBe(uiPackageJson.version);
  });
});

describe('mergeBuildInfo', () => {
  const stamp = {
    commit: 'abcdef1234567890abcdef1234567890abcdef12',
    ref: 'main',
    builtAt: '2026-09-22T00:00:00.000Z',
    version: '0.4.0',
  };

  it('keeps every field the observability plugin wrote and adds the stamp', () => {
    const observability = {
      schemaVersion: 1,
      generatedAt: '2026-09-22T00:00:00.000Z',
      summary: { remoteCount: 0, exposeCount: 1, sharedCount: 5 },
    };
    expect(mergeBuildInfo(observability, stamp)).toEqual({
      schemaVersion: 1,
      generatedAt: '2026-09-22T00:00:00.000Z',
      summary: { remoteCount: 0, exposeCount: 1, sharedCount: 5 },
      build: stamp,
    });
  });

  it('overwrites a build field the observability plugin already wrote', () => {
    const observability = {
      schemaVersion: 1,
      build: {
        commit: 'stale-commit',
        ref: 'stale-ref',
        builtAt: '2000-01-01T00:00:00.000Z',
        version: '0.0.0',
      },
    };
    expect(mergeBuildInfo(observability, stamp)).toEqual({ schemaVersion: 1, build: stamp });
  });
});
