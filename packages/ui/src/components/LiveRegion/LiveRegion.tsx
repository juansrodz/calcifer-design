import styles from './LiveRegion.module.css';

export interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export function LiveRegion({ message, politeness = 'polite' }: LiveRegionProps) {
  const role = politeness === 'assertive' ? 'alert' : 'status';
  return (
    <div className={styles.root} role={role} aria-live={politeness} aria-atomic="true">
      {message}
    </div>
  );
}
