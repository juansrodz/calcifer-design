import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import styles from './Avatar.module.css';

export interface AvatarProps {
  /** The person or thing this stands for. Used as the image's alt text and as the initials source. */
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
}

/**
 * First and last word's initial, upper-cased. A one-word name gives its first two letters, which
 * reads better at these sizes than a lone character.
 */
function initialsFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '';
  }
  if (words.length === 1) {
    return (words[0] ?? '').slice(0, 2).toUpperCase();
  }
  const first = words[0] ?? '';
  const last = words[words.length - 1] ?? '';
  return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase();
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
