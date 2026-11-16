import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import a11yStyles from '../../styles/a11y.module.css';
import styles from './Avatar.module.css';
import { avatarColorIndex } from './avatarColor';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  /** The person or thing this stands for. Used as the image's alt text and as the initials source. */
  name: string;
  src?: string;
  size?: AvatarSize;
  shape?: 'circle' | 'square';
  /**
   * A class for the root, joined after the component's own. It is how a consumer sets the two size
   * hooks, `--avatar-size` and `--avatar-font-size`, for a size the five presets do not draw. Like
   * any custom property the hooks inherit, so a wrapper that sets `--avatar-size` resizes every
   * avatar inside it.
   */
  className?: string;
  /**
   * Colours the box from a seed, a stable id for the person (`avatarColorIndex(colorSeed)`, one of
   * six theme colours), by writing `data-color` on the root. The colour fills the box behind the
   * initials, and behind a photo while it loads. Left out, the avatar keeps its neutral fill.
   */
  colorSeed?: string;
}

/** Leading characters by code point, not by UTF-16 code unit. */
function leadingCharacters(word: string, count: number): string {
  return Array.from(word).slice(0, count).join('');
}

/**
 * The word from its first letter or digit on, so punctuation that leads it is not an initial
 * ("(Pablo)" reads as "Pablo"). A word with neither, such as an emoji, is kept whole, so its first
 * code point is still its initial.
 */
function fromFirstLetterOrDigit(word: string): string {
  const start = word.search(/[\p{L}\p{N}]/u);
  return start === -1 ? word : word.slice(start);
}

/** A word of punctuation alone ("–", ")"), which names no one and so gives no initial. */
function isPunctuationOnly(word: string): boolean {
  return /^\p{P}+$/u.test(word);
}

/**
 * First and last word's initial, upper-cased. A one-word name gives its first two letters, which
 * reads better at these sizes than a lone character. Each word is read from its first letter or
 * digit (`fromFirstLetterOrDigit`), so "Dad (Pablo)" gives "DP". A word of punctuation alone is
 * skipped (`isPunctuationOnly`), so "Juan –" gives "J" and "Dad (Pablo )" gives "DP"; an emoji is
 * not punctuation and still counts ("🎉 Party" gives "🎉P").
 *
 * `slice()` is not used here: it indexes UTF-16 code units, so a name beginning with an emoji or
 * any other astral character yields half a surrogate pair — `'😀 Lovelace'` became `'\ud83dL'`,
 * an unpaired surrogate that renders as a broken glyph. Normalising to NFC first means a
 * decomposed accent composes into its base letter instead of being dropped. A ZWJ emoji sequence
 * still contributes only its first code point, which is acceptable in a two-character badge.
 */
function initialsFrom(name: string): string {
  const words = name.normalize('NFC').trim().split(/\s+/).filter(Boolean);
  const namingWords = words.filter((word) => !isPunctuationOnly(word));
  const firstWord = namingWords.at(0);
  if (firstWord === undefined) {
    return '';
  }
  const first = fromFirstLetterOrDigit(firstWord);
  if (words.length === 1) {
    return leadingCharacters(first, 2).toUpperCase();
  }
  // A name of several words whose others were all punctuation keeps one initial.
  const lastWord = namingWords.length > 1 ? namingWords.at(-1) : undefined;
  const last = lastWord === undefined ? '' : fromFirstLetterOrDigit(lastWord);
  return `${leadingCharacters(first, 1)}${leadingCharacters(last, 1)}`.toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 'md',
  shape = 'circle',
  className,
  colorSeed,
}: AvatarProps) {
  return (
    <BaseAvatar.Root
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-size={size}
      data-shape={shape}
      data-color={colorSeed === undefined ? undefined : avatarColorIndex(colorSeed)}
      data-testid="avatar"
    >
      {src !== undefined ? (
        <BaseAvatar.Image className={styles.image} src={src} alt={name} />
      ) : null}
      <BaseAvatar.Fallback className={styles.fallback}>
        <span aria-hidden="true">{initialsFrom(name)}</span>
        <span className={a11yStyles.visuallyHidden}>{name}</span>
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
