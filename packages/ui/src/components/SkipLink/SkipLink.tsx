import type { ReactNode } from 'react';
import styles from './SkipLink.module.css';

export interface SkipLinkProps {
  targetId: string;
  children?: ReactNode;
}

export function SkipLink({ targetId, children = 'Skip to content' }: SkipLinkProps) {
  return (
    <a className={styles.root} href={`#${targetId}`}>
      {children}
    </a>
  );
}
