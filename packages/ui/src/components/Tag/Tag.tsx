import type { ReactNode } from 'react';
import styles from './Tag.module.css';

export interface TagProps {
  children: ReactNode;
  tone?: 'neutral' | 'accent';
}

export function Tag({ children, tone = 'neutral' }: TagProps) {
  return (
    <span className={styles.root} data-tone={tone}>
      {children}
    </span>
  );
}
