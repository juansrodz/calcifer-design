import styles from './StatusDot.module.css';

export type RemoteStatus = 'registered' | 'loading' | 'loaded' | 'failed';

export interface StatusDotProps {
  status: RemoteStatus;
  /** The thing whose status this is, e.g. the remote name. */
  label: string;
}

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <span className={styles.root} data-status={status} data-testid="status-dot">
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
      <span className={styles.status}>{status}</span>
    </span>
  );
}
