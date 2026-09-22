import {
  Alert,
  Avatar,
  Button,
  Dialog,
  ErrorBoundary,
  IconButton,
  Menu,
  Popover,
  Skeleton,
  Spinner,
  Tooltip,
  TooltipProvider,
} from '@calcifer-design/ui';
import { useState } from 'react';
import type { HostToastManager } from '../host/toast';
import { FormComposition } from './compositions/FormComposition';
import styles from '../styles/docs.module.css';

export interface CompositionsProps {
  hostToast?: HostToastManager;
}

interface PreviewProps {
  broken: boolean;
}

/** Throws on demand, so the boundary beside it has something real to catch. */
function Preview({ broken }: PreviewProps) {
  if (broken) {
    throw new Error('The preview renderer failed while laying out the entry.');
  }
  return <p data-testid="preview">Nothing is wrong here.</p>;
}

export function Compositions({ hostToast }: CompositionsProps) {
  const [lastAction, setLastAction] = useState('none yet');
  const [broken, setBroken] = useState(false);
  const [crashed, setCrashed] = useState(false);

  return (
    // Every remote mounts its own TooltipProvider: it renders no DOM, no portal and no
    // listeners, so nesting one inside the host's is free, and it keeps grouped instant-open
    // working inside this tree (spec §5.3).
    <TooltipProvider>
      <section className={styles.section} aria-labelledby="compositions-heading">
        <h2 className={styles.sectionHeading} id="compositions-heading">
          Components, in composition
        </h2>
        <p className={styles.lede}>
          Every control below is the published library, wired together the way a screen would wire
          it — not one isolated control per row. That view exists, is exhaustive, and is better: it
          is Storybook, linked from the Inventory tab.
        </p>

        <div className={styles.panel}>
          <div className={styles.toolbar}>
            <Dialog
              heading="Edit the entry"
              description="A dialog with a scrolling body, a pinned footer, and a popover opened from inside it."
              trigger={<Button variant="secondary">Edit the entry</Button>}
              footer={<Button>Save</Button>}
            >
              <p>
                Anchored popups and dialogs share one stacking level (
                <code className={styles.code}>z-index: 50</code>
                ), so the surface that opened last paints on top — which is why the popover below
                appears above this dialog rather than behind it. Toasts sit above both, at 70.
              </p>
              <Popover
                heading="Slugs"
                trigger={<Button variant="ghost">What is a slug?</Button>}
                description="The URL-safe part of a title."
              >
                <p>A slug is generated from the title and can be edited until the entry is live.</p>
              </Popover>
            </Dialog>

            <Menu
              trigger={<Button variant="ghost">Entry actions</Button>}
              items={[
                { id: 'duplicate', label: 'Duplicate', onSelect: () => setLastAction('Duplicate') },
                { id: 'archive', label: 'Archive', onSelect: () => setLastAction('Archive') },
                {
                  id: 'delete',
                  label: 'Delete',
                  separatorBefore: true,
                  onSelect: () => setLastAction('Delete'),
                },
              ]}
            />

            <Tooltip
              label="Copy the entry id"
              trigger={
                <IconButton label="Copy the entry id" onClick={() => setLastAction('Copy')}>
                  <span aria-hidden="true">⧉</span>
                </IconButton>
              }
            />
          </div>
          <p className={styles.note} data-testid="last-action" aria-live="polite">
            Last action: {lastAction}
          </p>
        </div>

        <h3 className={styles.subHeading}>A form, and what happens after it</h3>
        <div className={styles.panel}>
          <FormComposition hostToast={hostToast} />
        </div>

        <h3 className={styles.subHeading}>The states a screen actually spends its time in</h3>
        <div className={styles.grid}>
          <div className={styles.panel}>
            <Spinner label="Loading the entry" />
            <Skeleton lines={3} />
          </div>
          <div className={styles.panel}>
            <Alert tone="warning" heading="Behind the published version">
              An example: the registry declares one version while npm already publishes a newer one.
            </Alert>
            <div className={styles.toolbar}>
              <Avatar name="Juan Sebastian Rodriguez" />
              <Avatar name="Christian Ocampo" shape="square" />
            </div>
          </div>
        </div>

        <h3 className={styles.subHeading}>A component that throws</h3>
        <div className={styles.panel}>
          <ErrorBoundary
            // Marks the demo crashed the instant the error is caught, which disables "Break the
            // preview" below for as long as the fallback is showing. Without this, a second
            // press while already crashed would set `broken` back to `true` with nothing on
            // screen to throw it — the fallback, not `children`, is what's rendered while an
            // error is caught — leaving it armed to crash again on the *next* "Try again"
            // instead of recovering. A custom `fallback` replaces the default heading/retryLabel
            // props because its retry button must clear both `broken` and `crashed` before
            // calling the boundary's own `reset()`, so the retried render never throws again.
            onError={() => setCrashed(true)}
            fallback={({ error, reset }) => (
              <div className={styles.fallback}>
                <Alert tone="danger" announce heading="This preview crashed">
                  {error.message}
                </Alert>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setBroken(false);
                    setCrashed(false);
                    reset();
                  }}
                >
                  Try again
                </Button>
              </div>
            )}
          >
            <Preview broken={broken} />
          </ErrorBoundary>
          <Button variant="secondary" onClick={() => setBroken(true)} disabled={crashed}>
            Break the preview
          </Button>
        </div>
      </section>
    </TooltipProvider>
  );
}
