import { Tabs } from '@calcifer-design/ui';
import { Compositions } from './sections/Compositions';
import { Inventory } from './sections/Inventory';
import { Overview } from './sections/Overview';
import { TokenGallery } from './sections/TokenGallery';
import type { HostToastManager } from './host/toast';
import styles from './styles/docs.module.css';

export interface DocsAppProps {
  /**
   * The host's toast manager, when the shell that mounted this remote supplies one through the
   * Bridge props, or the standalone entry's own. Absent means: no toasts, and say so. The app
   * deliberately has no `federated` flag — a shell built before `hostToast` existed mounts this
   * remote with `federated === true` and no manager, and branching on the flag would drop every
   * toast silently (spec §5.3 and its erratum).
   */
  hostToast?: HostToastManager;
}

export function DocsApp({ hostToast }: DocsAppProps) {
  const sections = [
    {
      value: 'overview',
      label: 'Overview',
      content: <Overview hasHostToast={hostToast !== undefined} />,
    },
    { value: 'tokens', label: 'Tokens', content: <TokenGallery /> },
    {
      value: 'compositions',
      label: 'Compositions',
      content: <Compositions hostToast={hostToast} />,
    },
    { value: 'inventory', label: 'Inventory', content: <Inventory /> },
  ];
  return (
    <div className={styles.root}>
      <Tabs items={sections} label="Documentation sections" />
    </div>
  );
}
