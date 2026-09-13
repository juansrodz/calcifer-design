import type { ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton';
import styles from './Alert.module.css';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  tone?: AlertTone;
  /** Rendered above the body as a heading. */
  title?: ReactNode;
  /** The title's heading level. Match it to where the alert sits in the page's outline. */
  titleLevel?: 2 | 3 | 4;
  children: ReactNode;
  /**
   * Announce this alert to assistive technology. Off by default and deliberately so: an alert
   * that is already on the page at first paint would announce at whatever moment the page
   * happens to settle. Turn it on only for an alert that appears in response to something the
   * user just did.
   */
  announce?: boolean;
  /** When given, a dismiss control is rendered that calls this. */
  onDismiss?: () => void;
  /** The dismiss control's accessible name. */
  dismissLabel?: string;
}

/** Read by assistive technology so the tone is never carried by colour alone. */
const toneWords: Record<AlertTone, string> = {
  info: 'Information',
  success: 'Success',
  warning: 'Warning',
  danger: 'Error',
};

function ToneIcon({ tone }: { tone: AlertTone }) {
  const shared = {
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const;
  if (tone === 'warning') {
    return (
      <svg {...shared}>
        <path d="M8 2.4 14.6 13.6H1.4z" />
        <path d="M8 6.4v3.2" />
        <path d="M8 11.7h.01" />
      </svg>
    );
  }
  return (
    <svg {...shared}>
      <circle cx="8" cy="8" r="6.25" />
      {tone === 'success' ? (
        <path d="M5.25 8.25 7.25 10.25 10.9 6" />
      ) : tone === 'danger' ? (
        <>
          <path d="m5.9 5.9 4.2 4.2" />
          <path d="m10.1 5.9-4.2 4.2" />
        </>
      ) : (
        <>
          <path d="M8 7.25v4" />
          <path d="M8 4.9h.01" />
        </>
      )}
    </svg>
  );
}

function DismissIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m4.5 4.5 7 7" />
      <path d="m11.5 4.5-7 7" />
    </svg>
  );
}

export function Alert({
  tone = 'info',
  title,
  titleLevel = 3,
  children,
  announce = false,
  onDismiss,
  dismissLabel = 'Dismiss',
}: AlertProps) {
  const politeness: 'assertive' | 'polite' = tone === 'danger' ? 'assertive' : 'polite';
  const liveProps = announce
    ? { role: tone === 'danger' ? 'alert' : 'status', 'aria-live': politeness }
    : {};
  const Title = titleLevel === 2 ? 'h2' : titleLevel === 4 ? 'h4' : 'h3';
  return (
    <div className={styles.root} data-tone={tone} data-testid="alert" {...liveProps}>
      <span className={styles.icon}>
        <ToneIcon tone={tone} />
      </span>
      <div className={styles.body}>
        <span className={styles.toneWord}>{toneWords[tone]}</span>
        {title === undefined ? null : <Title className={styles.title}>{title}</Title>}
        <div>{children}</div>
      </div>
      {onDismiss === undefined ? null : (
        <span className={styles.dismiss}>
          <IconButton label={dismissLabel} variant="ghost" size="sm" onClick={onDismiss}>
            <DismissIcon />
          </IconButton>
        </span>
      )}
    </div>
  );
}
