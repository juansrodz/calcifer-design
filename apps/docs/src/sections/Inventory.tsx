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

export function Inventory() {
  const [state, setState] = useState<InventoryState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const url = storybookIndexUrl();
    async function load() {
      try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`${url} responded ${response.status}`);
        }
        const index = parseStorybookIndex(await response.json());
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

  const storyTotal =
    state.status === 'ready'
      ? state.groups.reduce((total, storyGroup) => total + storyGroup.storyCount, 0)
      : 0;

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
          {state.message}. This page fetches the Storybook index from its own origin; in local
          development that path is proxied to the Storybook dev server, so it needs{' '}
          <code className={styles.code}>bun run storybook</code> to be running.
        </Alert>
      ) : null}

      {state.status === 'ready' ? (
        <>
          <p className={styles.note}>
            <strong>{state.groups.length} story groups</strong>, {storyTotal} stories.
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className={styles.caption}>Every story group in the library</caption>
              <thead>
                <tr>
                  <th scope="col">Group</th>
                  <th scope="col">Story group</th>
                  <th scope="col">Stories</th>
                </tr>
              </thead>
              <tbody>
                {state.groups.map((storyGroup) => (
                  <tr key={storyGroup.title}>
                    <td>{storyGroup.group}</td>
                    <th scope="row" className={styles.pairCell}>
                      <a
                        className={styles.link}
                        href={storybookStoryUrl(storyGroup.firstStoryId)}
                        rel="noreferrer"
                      >
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
      ) : null}
    </section>
  );
}
