import { describe, expect, it } from 'vitest';
import { AVATAR_COLOR_COUNT, avatarColorIndex } from './avatarColor';

describe('avatarColorIndex', () => {
  // FNV-1a 32-bit over the UTF-16 code units, modulo six, plus one. `'a'` hashes to 3826002220,
  // FNV-1a's published value, so the algorithm is pinned against a reference and not only against
  // itself. The app's `hash.ts` reproduces this table (contract §3.9).
  it.each([
    ['', 2],
    ['a', 5],
    ['uid-1', 2],
    ['uid-2', 1],
    ['Ada Lovelace', 1],
    ['Grace Hopper', 2],
    ['😀', 3],
  ])('maps %j to colour %i', (seed, expected) => {
    expect(avatarColorIndex(seed)).toBe(expected);
  });

  it('is stable: the same seed always gives the same colour', () => {
    expect(avatarColorIndex('uid-1')).toBe(avatarColorIndex('uid-1'));
  });

  it('gives a whole number from one to six for any seed, and every colour occurs', () => {
    const seen = new Set<number>();
    for (let index = 0; index < 600; index += 1) {
      const colour = avatarColorIndex(`seed-${index}`);
      expect(Number.isInteger(colour)).toBe(true);
      expect(colour).toBeGreaterThanOrEqual(1);
      expect(colour).toBeLessThanOrEqual(6);
      seen.add(colour);
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('counts six colours', () => {
    expect(AVATAR_COLOR_COUNT).toBe(6);
  });
});
