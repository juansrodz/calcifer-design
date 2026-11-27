import { describe, expect, it } from 'vitest';
import { sheetSwipeDirection } from './swipeDirection';

/** An element inside a host that carries `dir`, which is not attached to the document. */
function elementUnder(direction: string): HTMLElement {
  const host = document.createElement('div');
  host.setAttribute('dir', direction);
  return host.appendChild(document.createElement('div'));
}

describe('sheetSwipeDirection', () => {
  it('swipes a bottom sheet down', () => {
    expect(sheetSwipeDirection('bottom', document.body)).toBe('down');
  });

  it('swipes a bottom sheet down under a right-to-left ancestor', () => {
    expect(sheetSwipeDirection('bottom', elementUnder('rtl'))).toBe('down');
  });

  it('swipes an end sheet right on a left-to-right page', () => {
    expect(sheetSwipeDirection('end', document.body)).toBe('right');
  });

  it('swipes an end sheet left under a right-to-left ancestor', () => {
    expect(sheetSwipeDirection('end', elementUnder('rtl'))).toBe('left');
  });

  it('swipes an end sheet left when the element itself says right-to-left', () => {
    const host = document.createElement('div');
    host.setAttribute('dir', 'rtl');
    expect(sheetSwipeDirection('end', host)).toBe('left');
  });

  it('follows the nearest dir, so a left-to-right island swipes right', () => {
    const island = elementUnder('rtl');
    island.setAttribute('dir', 'ltr');
    expect(sheetSwipeDirection('end', island)).toBe('right');
  });

  it('swipes an end sheet right when there is no element to read', () => {
    expect(sheetSwipeDirection('end', null)).toBe('right');
  });
});
