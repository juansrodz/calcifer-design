import { Alert, Skeleton } from '@calcifer-design/ui';
import { useEffect, useState } from 'react';
import {
  parseStorybookIndex,
  storybookIndexUrl,
  storybookStoryUrl,
  summarizeInventory,
  type InventoryGroup,
} from '../storybook/inventory';
import styles from '../styles/docs.module.css';

type InventoryState =
  | { status: 'loading' }
  | { status: 'ready'; groups: InventoryGroup[] }
  | { status: 'failed'; message: string };

interface StoryGroupTableProps {
  groups: InventoryGroup[];
}

/** The loaded inventory: the counts, and a row per story group linking into Storybook. */
function StoryGroupTable({ groups }: StoryGroupTableProps) {
  const storyTotal = groups.reduce((total, storyGroup) => total + storyGroup.storyCount, 0);
  return (
    <>
      <p className={styles.note}>
        <strong>{groups.length} story groups</strong>, {storyTotal} stories.
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>Every story group in the library</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Story group</th>
              <th scope="col">Stories</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((storyGroup) => (
              <tr key={storyGroup.title}>
                <td>{storyGroup.group}</td>
                <th scope="row" className={styles.pairCell}>
                  <a className={styles.link} href={storybookStoryUrl(storyGroup.firstStoryId)}>
                    {storyGroup.name}
                  </a>
                </th>
                <td>{storyGroup.storyCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function Inventory() {
  const [state, setState] = useState<InventoryState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const url = storybookIndexUrl();
    async function load() {
      try {
        // The default cache mode on purpose: nginx serves this index `no-cache` with an ETag
        // (docker/storybook.nginx.conf — Storybook is its own pod, behind the same Ingress), so
        // the browser revalidates and usually gets a 304. An inactive Tabs panel unmounts, so
        // every return to this tab refetches; `no-store` would make each of those a full download
        // of the whole index.
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`${url} responded ${response.status}`);
        }
        const payload = await response.json();
        if (controller.signal.aborted) {
          return;
        }
        const index = parseStorybookIndex(payload);
        setState({ status: 'ready', groups: summarizeInventory(index) });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return (
    <section className={styles.section} aria-labelledby="inventory-heading">
      <h2 className={styles.sectionHeading} id="inventory-heading">
        What the library ships, right now
      </h2>
      <p className={styles.lede}>
        Read from Storybook&rsquo;s own build output, same-origin, every time this page loads. The
        counts cannot drift from the library because nothing here is written down: without a story,
        nothing appears on this list.
      </p>

      {state.status === 'loading' ? <Skeleton lines={6} /> : null}

      {state.status === 'failed' ? (
        <Alert tone="danger" announce heading="The inventory could not be read">
          {state.message}. This page fetches the Storybook index from its own origin.
          {/* The remedy is a command only a contributor can run. A live visitor gets the failure
              and the URL it failed on; nothing here asks them to start a dev server. */}
          {process.env.NODE_ENV === 'production' ? null : (
            <>
              {' '}
              In local development that path is proxied to the Storybook dev server, so it needs{' '}
              <code className={styles.code}>bun run storybook</code> to be running.
            </>
          )}
        </Alert>
      ) : null}

      {state.status === 'ready' ? <StoryGroupTable groups={state.groups} /> : null}
    </section>
  );
}
