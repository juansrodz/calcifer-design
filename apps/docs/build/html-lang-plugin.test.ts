import { describe, expect, it } from 'vitest';
import { addHtmlLang } from './html-lang-plugin';

describe('addHtmlLang', () => {
  it('adds lang to a bare html tag', () => {
    expect(addHtmlLang('<!DOCTYPE html><html><head></head></html>')).toContain('<html lang="en">');
  });

  it('leaves a tag that already has one alone, whatever its value', () => {
    const html = '<html lang="es"><head></head></html>';
    expect(addHtmlLang(html)).toBe(html);
  });

  it('does not match a tag whose name merely starts with html', () => {
    expect(addHtmlLang('<htmlish></htmlish>')).toBe('<htmlish></htmlish>');
  });
});
