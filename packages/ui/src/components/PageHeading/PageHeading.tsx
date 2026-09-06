import { useEffect, useRef, type ReactNode } from 'react';
import styles from './PageHeading.module.css';

export type PageHeadingSize = 'display' | 'page' | 'compact';

export interface PageHeadingProps {
  children: ReactNode;
  eyebrow?: ReactNode;
  level?: 1 | 2;
  /**
   * The mock's three h1 sizes: `display` is the landing hero name, `page` (default) the
   * Projects/About titles, `compact` the project and Under-the-hood titles. Ignored for
   * `level={2}`, which always renders the section size.
   */
  size?: PageHeadingSize;
  /** Move focus to the heading when it mounts (used after client-side navigation). */
  focusOnMount?: boolean;
}

export function PageHeading({
  children,
  eyebrow,
  level = 1,
  size = 'page',
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
      <Heading
        ref={headingRef}
        tabIndex={-1}
        className={styles.heading}
        data-level={level}
        data-size={size}
      >
        {children}
      </Heading>
    </div>
  );
}
