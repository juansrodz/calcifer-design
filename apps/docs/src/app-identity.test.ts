import { describe, expect, it } from 'vitest';
import { DESIGN_REMOTE_NAME, DESIGN_ROUTE_BASE, EXPOSED_APP_KEY } from './app-identity';

// The pattern the registry contract constrains `RemoteDescriptor.name` to
// (portfolio-mfe, packages/contract/openapi/registry.yaml:40). A hyphen passes every check in
// this repository and is rejected in the browser, after a deploy, by the shell's registry parse.
const REMOTE_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

describe('the remote identity', () => {
  it('names the remote the way the registry contract demands', () => {
    expect(DESIGN_REMOTE_NAME).toBe('design');
    expect(DESIGN_REMOTE_NAME).toMatch(REMOTE_NAME_PATTERN);
  });

  it('exposes the one key every portfolio remote publishes', () => {
    // Mirrors EXPOSED_APP_KEY in @calcifer-design/contract, which this repository cannot
    // install (CodeArtifact; see the plan's Decision 1). The value is four characters and has
    // been stable since the first remote; the registry test in portfolio-mfe is the other half.
    expect(EXPOSED_APP_KEY).toBe('./app');
  });

  it('mounts under the route base the spec names', () => {
    expect(DESIGN_ROUTE_BASE).toBe('/projects/design');
  });
});
