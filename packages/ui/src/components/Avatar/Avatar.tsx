import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import styles from './Avatar.module.css';

export interface AvatarProps {
  /** The person or thing this stands for. Used as the image's alt text and as the initials source. */
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
}

/** Leading characters by code point, not by UTF-16 code unit. */
function leadingCharacters(word: string, count: number): string {
  return Array.from(word).slice(0, count).join('');
}

/**
 * First and last word's initial, upper-cased. A one-word name gives its first two letters, which
 * reads better at these sizes than a lone character.
 *
 * `slice()` is not used here: it indexes UTF-16 code units, so a name beginning with an emoji or
 * any other astral character yields half a surrogate pair — `'😀 Lovelace'` became `'\ud83dL'`,
 * an unpaired surrogate that renders as a broken glyph. Normalising to NFC first means a
 * decomposed accent composes into its base letter instead of being dropped. A ZWJ emoji sequence
 * still contributes only its first code point, which is acceptable in a two-character badge.
 */
function initialsFrom(name: string): string {
  const words = name.normalize('NFC').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '';
  }
  if (words.length === 1) {
    return leadingCharacters(words[0] ?? '', 2).toUpperCase();
  }
  const first = leadingCharacters(words[0] ?? '', 1);
  const last = leadingCharacters(words[words.length - 1] ?? '', 1);
  return `${first}${last}`.toUpperCase();
}

export function Avatar({ name, src, size = 'md', shape = 'circle' }: AvatarProps) {
  return (
    <BaseAvatar.Root
      className={styles.root}
      data-size={size}
      data-shape={shape}
      data-testid="avatar"
    >
      {src === undefined ? null : (
        <BaseAvatar.Image className={styles.image} src={src} alt={name} />
      )}
      <BaseAvatar.Fallback className={styles.fallback}>
        <span aria-hidden="true">{initialsFrom(name)}</span>
        <span className={styles.name}>{name}</span>
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
