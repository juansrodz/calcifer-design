import type { RsbuildPlugin } from '@rsbuild/core';

/**
 * Rsbuild's built-in HTML template omits `lang`, which axe's `html-has-lang` rule flags. The
 * lookahead skips an opening tag that already carries the attribute, so this only ever adds
 * one. Ported from `pluginHtmlLang` in portfolio-mfe's `@calcifer-design/build-tools`, which
 * this repository cannot depend on (it is private to that workspace).
 */
export function addHtmlLang(html: string, lang = 'en'): string {
  return html.replace(/<html(?![^>]*\blang=)(?=[\s>])/, `<html lang="${lang}"`);
}

export function pluginHtmlLang(lang = 'en'): RsbuildPlugin {
  return {
    name: 'docs:html-lang',
    setup(api) {
      api.modifyHTML((html) => addHtmlLang(html, lang));
    },
  };
}
