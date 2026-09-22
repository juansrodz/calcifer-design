import { describe, expect, it } from 'vitest';
import { buildStamp, mergeBuildInfo, uiVersion } from './build-info-plugin';

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
});

describe('mergeBuildInfo', () => {
  it('keeps every field the observability plugin wrote and adds the stamp', () => {
    const observability = {
      schemaVersion: 1,
      generatedAt: '2026-09-22T00:00:00.000Z',
      summary: { remoteCount: 0, exposeCount: 1, sharedCount: 5 },
    };
    const stamp = {
      commit: 'abcdef1234567890abcdef1234567890abcdef12',
      ref: 'main',
      builtAt: '2026-09-22T00:00:00.000Z',
      version: '0.4.0',
    };
    expect(mergeBuildInfo(observability, stamp)).toEqual({ ...observability, build: stamp });
  });
});
