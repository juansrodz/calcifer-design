import type { ReactNode } from 'react';
import { CloseIcon } from '../../icons/CloseIcon';
import { IconButton } from '../IconButton/IconButton';
import a11yStyles from '../../styles/a11y.module.css';
import styles from './Alert.module.css';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  tone?: AlertTone;
  /** Rendered above the body as a heading. */
  heading?: ReactNode;
  /** The heading's level. Match it to where the alert sits in the page's outline. */
  headingLevel?: 2 | 3 | 4;
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

const headingTags = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

/** Every glyph here is a 16px stroke drawing that takes its colour from the surrounding text. */
const iconProps = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

/** The marks inside the ring. `warning` is drawn as a triangle instead and never reaches here. */
function ringMarks(tone: 'info' | 'success' | 'danger'): ReactNode {
  switch (tone) {
    case 'success':
      return <path d="M5.25 8.25 7.25 10.25 10.9 6" />;
    case 'danger':
      return (
        <>
          <path d="m5.9 5.9 4.2 4.2" />
          <path d="m10.1 5.9-4.2 4.2" />
        </>
      );
    case 'info':
      return (
        <>
          <path d="M8 7.25v4" />
          <path d="M8 4.9h.01" />
        </>
      );
  }
}

function ToneIcon({ tone }: { tone: AlertTone }) {
  if (tone === 'warning') {
    return (
      <svg {...iconProps}>
        <path d="M8 2.4 14.6 13.6H1.4z" />
        <path d="M8 6.4v3.2" />
        <path d="M8 11.7h.01" />
      </svg>
    );
  }
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="8" r="6.25" />
      {ringMarks(tone)}
    </svg>
  );
}

export function Alert({
  tone = 'info',
  heading,
  headingLevel = 3,
  children,
  announce = false,
  onDismiss,
  dismissLabel = 'Dismiss',
}: AlertProps) {
  const politeness: 'assertive' | 'polite' = tone === 'danger' ? 'assertive' : 'polite';
  const liveProps = announce
    ? { role: politeness === 'assertive' ? 'alert' : 'status', 'aria-live': politeness }
    : {};
  // The `?? 'h3'` is for JavaScript callers, who are not held to the `2 | 3 | 4` union:
  // an out-of-range level would otherwise resolve to `undefined` and throw in React as an
  // invalid element type. `@calcifer-design/ui` is consumed from JavaScript apps.
  const Heading = headingTags[headingLevel] ?? 'h3';
  return (
    <div className={styles.root} data-tone={tone} data-testid="alert" {...liveProps}>
      <span className={styles.icon}>
        <ToneIcon tone={tone} />
      </span>
      <div className={styles.body}>
        <span className={a11yStyles.visuallyHidden}>{toneWords[tone]}</span>
        {heading !== undefined ? <Heading className={styles.heading}>{heading}</Heading> : null}
        <div>{children}</div>
      </div>
      {onDismiss !== undefined ? (
        <span className={styles.dismiss}>
          <IconButton label={dismissLabel} variant="ghost" size="sm" onClick={onDismiss}>
            <CloseIcon />
          </IconButton>
        </span>
      ) : null}
    </div>
  );
}
