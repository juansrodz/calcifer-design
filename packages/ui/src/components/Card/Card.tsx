import type { ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
  as?: 'div' | 'article' | 'section';
  heading?: ReactNode;
  headingLevel?: 2 | 3;
  /** Rendered on the heading's row, pushed to the end: a status pill, a version, a badge. */
  headingAside?: ReactNode;
  footer?: ReactNode;
  /** `danger` is the failed-remote card: tinted surface and border. */
  tone?: 'default' | 'danger';
  /** Lifts on hover; use when the card's main action is a link inside it. */
  interactive?: boolean;
  children: ReactNode;
}

export function Card({
  as: Element = 'div',
  heading,
  headingLevel = 3,
  headingAside,
  footer,
  tone = 'default',
  interactive = false,
  children,
}: CardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <Element
      className={styles.root}
      data-tone={tone}
      data-interactive={interactive ? '' : undefined}
    >
      {heading ? (
        <div className={styles.header}>
          <Heading className={styles.heading}>{heading}</Heading>
          {headingAside}
        </div>
      ) : null}
      <div className={styles.body}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </Element>
  );
}
