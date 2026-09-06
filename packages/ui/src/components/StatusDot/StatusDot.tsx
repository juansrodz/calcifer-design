import styles from './StatusDot.module.css';

export type RemoteStatus = 'registered' | 'loading' | 'loaded' | 'failed';

export interface StatusDotProps {
  status: RemoteStatus;
  /** The thing whose status this is, e.g. the remote name. */
  label: string;
  /**
   * `mono` (default) sets the label in the monospace face, as in tables and badges; `text`
   * sets it in the body face and text colour, as in the landing page's fleet list.
   */
  labelStyle?: 'mono' | 'text';
  /**
   * `false` keeps the label for assistive tech but hides it visually — for a table whose
   * first column already names the remote.
   */
  showLabel?: boolean;
}

export function StatusDot({
  status,
  label,
  labelStyle = 'mono',
  showLabel = true,
}: StatusDotProps) {
  return (
    <span
      className={styles.root}
      data-status={status}
      data-label-style={labelStyle}
      data-testid="status-dot"
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label} data-hidden={showLabel ? undefined : ''}>
        {label}
      </span>
      <span className={styles.status}>{status}</span>
    </span>
  );
}
