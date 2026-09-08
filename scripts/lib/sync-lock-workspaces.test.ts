import { describe, expect, it } from 'vitest';
import { syncLockWorkspaces, type WorkspaceManifest } from './sync-lock-workspaces';

// Shaped like the real bun.lock's "workspaces" block (see bun.lock lines 4-70): trailing
// commas, two-space nesting, a root "" entry with no version, and workspace entries that
// mix internal ranges (naming another workspace package) with external ones.
const lockFixture = `{
  "lockfileVersion": 1,
  "configVersion": 1,
  "workspaces": {
    "": {
      "name": "calcifer-design",
      "devDependencies": {
        "typescript": "<6.1.0",
      },
    },
    "packages/tokens": {
      "name": "@calcifer-design/tokens",
      "version": "0.1.1",
      "devDependencies": {
        "@calcifer-design/tsconfig": "workspace:*",
        "fast-glob": "^3.3.3",
      },
    },
    "packages/tsconfig": {
      "name": "@calcifer-design/tsconfig",
      "version": "0.0.0",
    },
    "packages/ui": {
      "name": "@calcifer-design/ui",
      "version": "0.1.1",
      "dependencies": {
        "@base-ui/react": "^1.8.0",
        "@calcifer-design/tokens": "workspace:*",
        "@tanstack/react-table": "^9.2.4",
      },
      "devDependencies": {
        "@calcifer-design/tsconfig": "workspace:*",
        "react": "catalog:",
      },
    },
  },
  "catalog": {
    "react": "^19.2.0",
  },
}
`;

const tokensManifest: WorkspaceManifest = {
  directory: 'packages/tokens',
  name: '@calcifer-design/tokens',
  version: '0.1.1',
  devDependencies: {
    '@calcifer-design/tsconfig': 'workspace:*',
    'fast-glob': '^3.3.3',
  },
};

const tsconfigManifest: WorkspaceManifest = {
  directory: 'packages/tsconfig',
  name: '@calcifer-design/tsconfig',
  version: '0.0.0',
};

const uiManifestAtHead: WorkspaceManifest = {
  directory: 'packages/ui',
  name: '@calcifer-design/ui',
  version: '0.1.1',
  dependencies: {
    '@base-ui/react': '^1.8.0',
    '@calcifer-design/tokens': 'workspace:*',
    '@tanstack/react-table': '^9.2.4',
  },
  devDependencies: {
    '@calcifer-design/tsconfig': 'workspace:*',
    react: 'catalog:',
  },
};

describe('syncLockWorkspaces', () => {
  it('rewrites a stale version line to the manifest version', () => {
    const bumpedUiManifest: WorkspaceManifest = { ...uiManifestAtHead, version: '0.1.2' };
    const result = syncLockWorkspaces(lockFixture, [
      tokensManifest,
      tsconfigManifest,
      bumpedUiManifest,
    ]);

    expect(result.changes).toContain('packages/ui: version 0.1.1 -> 0.1.2');
    expect(result.lockText).toContain('"version": "0.1.2",');
    expect(result.lockText).not.toContain('"version": "0.1.1",\n      "dependencies"');
  });

  it('rewrites an internal range from workspace:* to a caret range', () => {
    const uiManifestWithCaretRange: WorkspaceManifest = {
      ...uiManifestAtHead,
      dependencies: {
        ...uiManifestAtHead.dependencies,
        '@calcifer-design/tokens': '^0.1.1',
      },
    };
    const result = syncLockWorkspaces(lockFixture, [
      tokensManifest,
      tsconfigManifest,
      uiManifestWithCaretRange,
    ]);

    expect(result.changes).toContain('packages/ui: @calcifer-design/tokens workspace:* -> ^0.1.1');
    expect(result.lockText).toContain('"@calcifer-design/tokens": "^0.1.1",');
  });

  it('leaves an external dependency line untouched byte-for-byte, even when a change happens elsewhere', () => {
    const bumpedUiManifest: WorkspaceManifest = { ...uiManifestAtHead, version: '0.1.2' };
    const result = syncLockWorkspaces(lockFixture, [
      tokensManifest,
      tsconfigManifest,
      bumpedUiManifest,
    ]);

    expect(result.lockText).toContain('        "@base-ui/react": "^1.8.0",');
    expect(result.lockText).toContain('        "@tanstack/react-table": "^9.2.4",');
    expect(result.lockText).toContain('        "react": "catalog:",');
  });

  it('throws when a manifest names a directory missing from the lock workspaces block', () => {
    const missingManifest: WorkspaceManifest = {
      directory: 'packages/missing',
      name: '@calcifer-design/missing',
      version: '0.0.1',
    };

    expect(() =>
      syncLockWorkspaces(lockFixture, [tokensManifest, tsconfigManifest, missingManifest]),
    ).toThrow(/packages\/missing/);
  });

  it('returns zero changes and identical text when the lock is already in sync', () => {
    const result = syncLockWorkspaces(lockFixture, [
      tokensManifest,
      tsconfigManifest,
      uiManifestAtHead,
    ]);

    expect(result.changes).toEqual([]);
    expect(result.lockText).toBe(lockFixture);
  });
});
