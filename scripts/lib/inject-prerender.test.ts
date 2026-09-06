import { describe, expect, it } from 'vitest';
import { injectPrerender } from './inject-prerender';

const template = [
  '<!doctype html><html lang="en"><head><title>Site</title></head>',
  '<body><div id="root"></div><script src="/static/js/index.js"></script></body></html>',
].join('');

describe('injectPrerender', () => {
  it('places the markup in #root, the scripts before </body>, and the title in <title>', () => {
    const html = injectPrerender(template, {
      markup: '<main><h1>About</h1></main>',
      scripts: '<script>window.$_TSR = {}</script>',
      title: 'About · Site',
      stylesheets: [],
    });
    expect(html).toContain('<div id="root"><main><h1>About</h1></main></div>');
    expect(html).toContain('<script>window.$_TSR = {}</script></body>');
    expect(html).toContain('<title>About · Site</title>');
    expect(html).not.toContain('<title>Site</title>');
  });

  it('escapes the title', () => {
    const html = injectPrerender(template, {
      markup: '',
      scripts: '',
      title: 'A & <B>',
      stylesheets: [],
    });
    expect(html).toContain('<title>A &amp; &lt;B&gt;</title>');
  });

  it('refuses a template without the mount point, the body end, or a title', () => {
    expect(() =>
      injectPrerender('<html></html>', { markup: '', scripts: '', title: 'x', stylesheets: [] }),
    ).toThrow(/#root/);
  });

  it('links each stylesheet immediately before </head>', () => {
    const html = injectPrerender(template, {
      markup: '',
      scripts: '',
      title: 'Site',
      stylesheets: ['/static/css/async/a.css', '/static/css/async/b.css'],
    });
    expect(html).toContain('<link rel="stylesheet" href="/static/css/async/a.css">');
    expect(html).toContain('<link rel="stylesheet" href="/static/css/async/b.css"></head>');
  });

  it('adds no <link> when there are no stylesheets', () => {
    const html = injectPrerender(template, {
      markup: '',
      scripts: '',
      title: 'Site',
      stylesheets: [],
    });
    expect(html).not.toContain('<link');
  });
});
