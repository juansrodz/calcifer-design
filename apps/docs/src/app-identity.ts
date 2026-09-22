/**
 * The remote's name in the portfolio registry. A bare identifier with no hyphen, because the
 * registry contract constrains `RemoteDescriptor.name` to `^[a-zA-Z_][a-zA-Z0-9_]*$`
 * (spec §6.2). It is also the Module Federation container name, so the two can never disagree.
 */
export const DESIGN_REMOTE_NAME = 'design' as const;

/**
 * The single module every portfolio remote exposes. `EXPOSED_APP_KEY` in
 * `@calcifer-design/contract` (portfolio-mfe, `packages/contract/src/remote-app.ts`) is the
 * authority; the constant is mirrored here rather than imported because that package is
 * published to CodeArtifact (spec §4) and this repository installs only from npmjs. The other
 * external remotes do the same — see `nightward/vite.config.ts`.
 */
export const EXPOSED_APP_KEY = './app' as const;

/** The shell route this remote mounts under (spec §6.2). */
export const DESIGN_ROUTE_BASE = '/projects/design' as const;
