import type { ReactNode } from 'react';
import styles from './IconButton.module.css';

export interface IconButtonContentProps {
  icon: ReactNode;
  badge?: number;
}

const BADGE_CAP = 99;

/**
 * Internal, not exported from `src/index.ts`. The glyph and the corner count, the same inside an
 * `IconButton` and a `LinkIconButton`.
 */
export function IconButtonContent({ icon, badge }: IconButtonContentProps) {
  return (
    <>
      <span className={styles.icon}>{icon}</span>
      {badge !== undefined && badge > 0 ? (
        <span className={styles.badge} aria-hidden="true">
          {badge > BADGE_CAP ? `${BADGE_CAP}+` : badge}
        </span>
      ) : null}
    </>
  );
}
