import type { ReactNode } from 'react';
import { CheckIcon } from '../../icons/CheckIcon';
import a11yStyles from '../../styles/a11y.module.css';
import styles from './Steps.module.css';

export interface StepsItem {
  /** Identifies the step across renders. */
  id: string;
  title: ReactNode;
  description?: ReactNode;
}

export type StepStatus = 'complete' | 'active' | 'error' | 'upcoming';

const DEFAULT_STATUS_LABELS: Record<StepStatus, string> = {
  complete: 'Completed',
  active: 'Current',
  error: 'Error',
  upcoming: 'Not started',
};

export interface StepsProps {
  items: StepsItem[];
  /**
   * The current step, zero-based. Below zero nothing has started; at `items.length` or above
   * everything is complete. Neither case has a current step, so nothing is marked as one.
   */
  current: number;
  /** How the current step is going. */
  currentStatus?: 'active' | 'error';
  /** `horizontal` applies from the `sm` breakpoint up; below it the steps always stack. */
  orientation?: 'horizontal' | 'vertical';
  /** Names the list. */
  'aria-label'?: string;
  /** The words each status is stated in, for an app that is not in English. */
  statusLabels?: Partial<Record<StepStatus, string>>;
}

function statusOf(index: number, current: number, currentStatus: 'active' | 'error'): StepStatus {
  if (index < current) {
    return 'complete';
  }
  return index === current ? currentStatus : 'upcoming';
}

/**
 * Progress through a sequence. A display only: nothing here can be focused or activated. Each
 * step's status is stated in visually hidden text, so colour and the drawn marker, which is
 * hidden from assistive technology, are never the only signal.
 */
export function Steps({
  items,
  current,
  currentStatus = 'active',
  orientation = 'horizontal',
  'aria-label': ariaLabel,
  statusLabels,
}: StepsProps) {
  const labels = { ...DEFAULT_STATUS_LABELS, ...statusLabels };
  return (
    <ol className={styles.list} data-orientation={orientation} aria-label={ariaLabel}>
      {items.map((item, index) => {
        const status = statusOf(index, current, currentStatus);
        return (
          <li
            key={item.id}
            className={styles.item}
            data-status={status}
            aria-current={index === current ? 'step' : undefined}
          >
            <span className={styles.marker} aria-hidden="true">
              {status === 'complete' ? <CheckIcon /> : status === 'error' ? '!' : index + 1}
            </span>
            <span className={styles.body}>
              <span className={styles.title}>{item.title}</span>
              <span className={a11yStyles.visuallyHidden}>{labels[status]}</span>
              {item.description ? (
                <span className={styles.description}>{item.description}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
