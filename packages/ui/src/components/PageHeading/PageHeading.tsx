import { useEffect, useRef, type ReactNode } from 'react';
import styles from './PageHeading.module.css';

export interface PageHeadingProps {
  children: ReactNode;
  eyebrow?: ReactNode;
  level?: 1 | 2;
  /** Move focus to the heading when it mounts (used after client-side navigation). */
  focusOnMount?: boolean;
}

export function PageHeading({
  children,
  eyebrow,
  level = 1,
  focusOnMount = false,
}: PageHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const Heading = level === 1 ? 'h1' : 'h2';

  useEffect(() => {
    if (focusOnMount) {
      headingRef.current?.focus({ preventScroll: false });
    }
  }, [focusOnMount]);

  return (
    <div className={styles.root}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <Heading ref={headingRef} tabIndex={-1} className={styles.heading} data-level={level}>
        {children}
      </Heading>
    </div>
  );
}
