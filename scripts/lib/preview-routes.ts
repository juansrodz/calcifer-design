import path from 'node:path/posix';

export type PreviewSource = 'shell' | 'showcase' | 'registry';

export interface PreviewTarget {
  source: PreviewSource;
  /** Path relative to the source's root, never starting with "/" or containing "..". */
  relativePath: string;
}

/** Mirrors `PRERENDERED_ROUTES` in apps/shell/src/content/titles.ts (the prerender test checks both agree). */
export const PREVIEW_PRERENDERED_PATHS = ['/', '/projects', '/about', '/under-the-hood'] as const;

const SHOWCASE_PREFIX = '/showcase';
const REGISTRY_PATH = '/registry/index.json';

/** Collapses "." and ".." segments and drops the leading slash, so the result stays inside a root. */
function safeRelative(pathname: string): string {
  const normalized = path.normalize(`/${pathname}`);
  return normalized.replace(/^\/+/, '');
}

function trimTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function hasExtension(pathname: string): boolean {
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
  return lastSegment.includes('.');
}

/**
 * The routing rules the preview server, the nginx gateway (docker/gateway/nginx.conf) and
 * Phase 1b's CDN function all share: registry and showcase paths untouched, prerendered
 * shell paths to their own index.html, other extensionless shell paths to the SPA fallback,
 * everything else a shell static file.
 */
export function resolvePreviewPath(pathname: string): PreviewTarget {
  if (pathname === REGISTRY_PATH) {
    return { source: 'registry', relativePath: 'index.json' };
  }
  if (pathname === SHOWCASE_PREFIX || pathname.startsWith(`${SHOWCASE_PREFIX}/`)) {
    const rest = safeRelative(pathname.slice(SHOWCASE_PREFIX.length));
    const relativePath = rest === '' || rest.endsWith('/') ? `${rest}index.html` : rest;
    return { source: 'showcase', relativePath };
  }
  const trimmed = trimTrailingSlash(pathname);
  if ((PREVIEW_PRERENDERED_PATHS as readonly string[]).includes(trimmed)) {
    return {
      source: 'shell',
      relativePath: trimmed === '/' ? 'index.html' : `${trimmed.slice(1)}/index.html`,
    };
  }
  if (hasExtension(trimmed)) {
    return { source: 'shell', relativePath: safeRelative(trimmed) };
  }
  return { source: 'shell', relativePath: 'index.html' };
}
