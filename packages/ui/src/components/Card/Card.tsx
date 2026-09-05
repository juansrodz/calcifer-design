import type { ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
  as?: 'div' | 'article' | 'section';
  heading?: ReactNode;
  headingLevel?: 2 | 3;
  footer?: ReactNode;
  children: ReactNode;
}

export function Card({ as: Element = 'div', heading, headingLevel = 3, footer, children }: CardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <Element className={styles.root}>
      {heading ? <Heading className={styles.heading}>{heading}</Heading> : null}
      <div className={styles.body}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </Element>
  );
}
