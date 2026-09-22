import { Overview } from './sections/Overview';
import type { HostToastManager } from './host/toast';
import styles from './styles/docs.module.css';

export interface DocsAppProps {
  /**
   * The host's toast manager, when the shell that mounted this remote supplies one through the
   * Bridge props, or the standalone entry's own. Absent means: no toasts, and say so. The app
   * deliberately has no `federated` flag — a shell built before `hostToast` existed mounts this
   * remote with `federated === true` and no manager, and branching on the flag would drop every
   * toast silently (spec §5.3, and Plan B's erratum on it).
   */
  hostToast?: HostToastManager;
}

export function DocsApp({ hostToast }: DocsAppProps) {
  return (
    <div className={styles.root}>
      <Overview hasHostToast={hostToast !== undefined} />
    </div>
  );
}
