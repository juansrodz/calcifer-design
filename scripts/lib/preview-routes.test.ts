import { describe, expect, it } from 'vitest';
import { PREVIEW_PRERENDERED_PATHS, resolvePreviewPath } from './preview-routes';

describe('resolvePreviewPath (spec 10: the rules Phase 1b bakes into its gateway)', () => {
  it('serves the registry file at the contract path', () => {
    expect(resolvePreviewPath('/registry/index.json')).toEqual({
      source: 'registry',
      relativePath: 'index.json',
    });
  });

  it('serves the showcase build under /showcase/ untouched', () => {
    expect(resolvePreviewPath('/showcase/mf-manifest.json')).toEqual({
      source: 'showcase',
      relativePath: 'mf-manifest.json',
    });
    expect(resolvePreviewPath('/showcase/static/js/app.js')).toEqual({
      source: 'showcase',
      relativePath: 'static/js/app.js',
    });
    expect(resolvePreviewPath('/showcase/')).toEqual({
      source: 'showcase',
      relativePath: 'index.html',
    });
    expect(resolvePreviewPath('/showcase')).toEqual({
      source: 'showcase',
      relativePath: 'index.html',
    });
  });

  it('maps prerendered paths, with or without a trailing slash, to their own index.html', () => {
    expect(PREVIEW_PRERENDERED_PATHS).toEqual(['/', '/projects', '/about', '/under-the-hood']);
    expect(resolvePreviewPath('/')).toEqual({ source: 'shell', relativePath: 'index.html' });
    expect(resolvePreviewPath('/about')).toEqual({
      source: 'shell',
      relativePath: 'about/index.html',
    });
    expect(resolvePreviewPath('/about/')).toEqual({
      source: 'shell',
      relativePath: 'about/index.html',
    });
    expect(resolvePreviewPath('/under-the-hood')).toEqual({
      source: 'shell',
      relativePath: 'under-the-hood/index.html',
    });
  });

  it('sends every other extensionless shell path to the SPA fallback', () => {
    expect(resolvePreviewPath('/projects/showcase')).toEqual({
      source: 'shell',
      relativePath: 'index.html',
    });
    expect(resolvePreviewPath('/projects/showcase/components')).toEqual({
      source: 'shell',
      relativePath: 'index.html',
    });
    expect(resolvePreviewPath('/nope')).toEqual({ source: 'shell', relativePath: 'index.html' });
  });

  it('serves shell files with an extension as they are', () => {
    expect(resolvePreviewPath('/static/js/index.abc123.js')).toEqual({
      source: 'shell',
      relativePath: 'static/js/index.abc123.js',
    });
    expect(resolvePreviewPath('/build-info.json')).toEqual({
      source: 'shell',
      relativePath: 'build-info.json',
    });
    expect(resolvePreviewPath('/resume.pdf')).toEqual({
      source: 'shell',
      relativePath: 'resume.pdf',
    });
  });

  it('never escapes a root', () => {
    expect(resolvePreviewPath('/../package.json')).toEqual({
      source: 'shell',
      relativePath: 'package.json',
    });
    expect(resolvePreviewPath('/showcase/../../package.json')).toEqual({
      source: 'showcase',
      relativePath: 'package.json',
    });
  });
});
