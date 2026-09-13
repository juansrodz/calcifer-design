import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cacheControlFor } from './storybook-cache-policy';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const conf = readFileSync(path.join(repoRoot, 'docker/storybook.nginx.conf'), 'utf8');
const dockerfile = readFileSync(path.join(repoRoot, 'docker/storybook.Dockerfile'), 'utf8');

// Real filenames from a Storybook 10.6 `storybook-react-rsbuild` build. The bug this test exists
// to prevent was a location that matched none of them.
const contentHashed = [
  'main.906b4cf2.iframe.bundle.js',
  'runtime~main.fe160e6f.iframe.bundle.js',
  '104.05d2887c.iframe.bundle.js',
  'components-Button-Button-stories.01e3cfd3c9.css',
  'main.2a0d083a93.css',
  '25.4c4a7a3d.iframe.bundle.js.LICENSE.txt',
];

// Stable filenames: these are byte-for-byte the same URL across builds, so marking them immutable
// would pair a stale runtime with a fresh index.html — the classic half-loaded Storybook.
const stableNamed = [
  'index.html',
  'iframe.html',
  'index.json',
  'project.json',
  'favicon.svg',
  'mocker-runtime-injected.js',
  'sb-manager/runtime.js',
  'sb-manager/globals-runtime.js',
  'sb-preview/runtime.js',
  'sb-addons/a11y-2/manager-bundle.js',
  'sb-common-assets/nunito-sans-bold.woff2',
];

describe('the Storybook nginx config', () => {
  it('serves through root, not alias', () => {
    expect(conf).toMatch(/^\s*root\s+\/usr\/share\/nginx\/html;/m);
    expect(conf).not.toMatch(/\balias\b/);
  });

  it('copies the build into the storybook/ subdirectory that root then resolves', () => {
    expect(dockerfile).toMatch(
      /COPY packages\/ui\/storybook-static \/usr\/share\/nginx\/html\/storybook/,
    );
  });

  it('compresses JavaScript under the MIME type nginx actually uses for .js', () => {
    expect(conf).toMatch(/^\s*gzip\s+on;/m);
    const gzipTypes = /gzip_types([^;]*);/.exec(conf)?.[1] ?? '';
    expect(gzipTypes).toContain('text/javascript');
    expect(gzipTypes).toContain('text/css');
  });

  it('marks every content-hashed file immutable', () => {
    for (const fileName of contentHashed) {
      expect(cacheControlFor(conf, `/storybook/${fileName}`), fileName).toBe(
        'public, max-age=31536000, immutable',
      );
    }
  });

  it('leaves every stable-named file revalidating, never immutable', () => {
    for (const fileName of stableNamed) {
      expect(cacheControlFor(conf, `/storybook/${fileName}`), fileName).toBe('no-cache');
    }
  });

  it('lets the directory index revalidate', () => {
    expect(cacheControlFor(conf, '/storybook/')).toBe('no-cache');
  });

  it('claims nothing outside the storybook prefix', () => {
    expect(cacheControlFor(conf, '/index.html')).toBeNull();
  });
});
