import { describe, expect, it } from 'vitest';
import { isCurrentPath } from './currentPath';

describe('isCurrentPath', () => {
  it.each([
    ['an exact match', '/events', '/events'],
    ['a nested path', '/events', '/events/e1'],
    ['a trailing slash', '/events', '/events/'],
    ['the root against the root', '/', '/'],
  ])('is true for %s', (_name, href, currentPath) => {
    expect(isCurrentPath(href, currentPath)).toBe(true);
  });

  it.each([
    ['a sibling that shares the prefix', '/events', '/eventsx'],
    ['the root path against a deeper href', '/events', '/'],
    ['the root href against any other path', '/', '/events'],
  ])('is false for %s', (_name, href, currentPath) => {
    expect(isCurrentPath(href, currentPath)).toBe(false);
  });
});
