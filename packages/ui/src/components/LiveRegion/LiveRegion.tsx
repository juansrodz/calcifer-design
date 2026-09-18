import a11yStyles from '../../styles/a11y.module.css';

export interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export function LiveRegion({ message, politeness = 'polite' }: LiveRegionProps) {
  const role = politeness === 'assertive' ? 'alert' : 'status';
  return (
    <div
      className={a11yStyles.visuallyHidden}
      role={role}
      aria-live={politeness}
      aria-atomic="true"
    >
      {message}
    </div>
  );
}
