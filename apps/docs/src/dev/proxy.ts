export interface DevProxyEntry {
  target: string;
  pathRewrite: Record<string, string>;
}

/** The dev ports this workspace and the portfolio's shell agree on. */
export const DEV_PORTS = { docs: 3002, storybook: 6006 } as const;

/**
 * The live inventory fetches `/storybook/index.json` **same-origin** (spec §6.3), which is true
 * on the live site — `/design/` and `/storybook/` are two pods behind one Ingress — and false
 * in dev, where this app is one server and Storybook is another. So standalone dev proxies the
 * prefix to the Storybook dev server, whose own index lives at its root (hence the rewrite).
 * The federated case is the shell's mirror of this, in portfolio-mfe's
 * `packages/build-tools/src/dev-proxy.ts`.
 */
export function devProxy(ports: { storybook: number } = DEV_PORTS): Record<string, DevProxyEntry> {
  return {
    '/storybook': {
      target: `http://localhost:${ports.storybook}`,
      pathRewrite: { '^/storybook': '' },
    },
  };
}
