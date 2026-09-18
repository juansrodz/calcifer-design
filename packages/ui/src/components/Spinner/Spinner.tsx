import a11yStyles from '../../styles/a11y.module.css';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  /** `sm` sits inside a button or an input, `md` beside a block of content, `lg` on a whole page. */
  size?: 'sm' | 'md' | 'lg';
  /**
   * When given, the spinner announces itself: this text is rendered visually hidden inside a
   * `role="status"` region. Leave it out whenever the thing that is loading already says so —
   * `Button`'s `loading` prop sets `aria-busy` on the button itself, and a second announcement
   * from the spinner inside it would be noise.
   */
  label?: string;
}

export function Spinner({ size = 'md', label }: SpinnerProps) {
  const ring = (
    <span className={styles.root} data-size={size} data-testid="spinner" aria-hidden="true" />
  );
  if (label === undefined) {
    return ring;
  }
  return (
    <span className={styles.wrapper} role="status">
      {ring}
      <span className={a11yStyles.visuallyHidden}>{label}</span>
    </span>
  );
}
