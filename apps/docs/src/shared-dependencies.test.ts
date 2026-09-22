import { describe, expect, it } from 'vitest';
import { baseUiVersion, reactVersion, sharedDependencies } from './shared-dependencies';

describe('sharedDependencies', () => {
  it('takes the React range from the workspace catalog rather than repeating it', () => {
    expect(reactVersion).toMatch(/^\^?\d+\.\d+\.\d+$/);
    expect(sharedDependencies['react']).toEqual({ singleton: true, requiredVersion: reactVersion });
    expect(sharedDependencies['react-dom']).toEqual({
      singleton: true,
      requiredVersion: reactVersion,
    });
  });

  it('covers react-dom/client through the trailing-slash key, which is what loads twice without it', () => {
    expect(sharedDependencies['react-dom/']).toEqual({
      singleton: true,
      requiredVersion: reactVersion,
    });
  });

  it('shares exactly what this app has in its graph and nothing it does not', () => {
    // The portfolio's own map also lists @tanstack/react-router and @tanstack/react-query,
    // which showcase uses and this app does not (no router, no query client — see Decision 2).
    // A shared entry for a package that is never imported buys nothing and hides the real list.
    expect(Object.keys(sharedDependencies)).toEqual([
      'react',
      'react-dom',
      'react-dom/',
      '@base-ui/react',
      '@base-ui/react/',
    ]);
    expect(baseUiVersion).toMatch(/^\^?\d+\.\d+\.\d+$/);
    expect(sharedDependencies['@base-ui/react']).toEqual({
      singleton: true,
      strictVersion: true,
      requiredVersion: baseUiVersion,
    });
    expect(sharedDependencies['@base-ui/react/']).toEqual({
      singleton: true,
      strictVersion: true,
      requiredVersion: baseUiVersion,
    });
  });
});
