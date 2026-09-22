import { PageHeading } from '@calcifer-design/ui';
import type { ReactNode } from 'react';
import styles from './styles/docs.module.css';

export interface StandaloneFrameProps {
  children: ReactNode;
}

/**
 * The `h1` and page chrome shown only when the docs app runs on its own. Mounted by the shell,
 * the shell renders the `h1` and this frame never exists — which is why every heading inside
 * the app itself starts at `h2`.
 */
export function StandaloneFrame({ children }: StandaloneFrameProps) {
  return (
    <main className={styles.standalone} id="main">
      <PageHeading level={1} eyebrow={`Standalone · v${DOCS_VERSION}`} size="compact">
        Calcifer Design
      </PageHeading>
      {children}
    </main>
  );
}
