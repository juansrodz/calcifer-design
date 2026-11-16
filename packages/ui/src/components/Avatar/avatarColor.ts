export type AvatarColorIndex = 1 | 2 | 3 | 4 | 5 | 6;

/** How many fill and ink pairs the theme defines (`--color-avatar-fill-1` to `-6`). */
export const AVATAR_COLOR_COUNT = 6;

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * Which of the six avatar colours a seed gets: FNV-1a 32-bit over the seed's UTF-16 code units,
 * taken as an unsigned number, modulo six, plus one. The same seed gives the same colour on every
 * screen and in every release, so a person keeps their colour.
 *
 * Changing this function is a breaking change: the consuming app's `src/components/hash.ts`
 * reproduces it (contract §3.9), and a drift would colour one person two ways.
 */
export function avatarColorIndex(seed: string): AvatarColorIndex {
  let hash = FNV_OFFSET_BASIS;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return ((hash % AVATAR_COLOR_COUNT) + 1) as AvatarColorIndex;
}
