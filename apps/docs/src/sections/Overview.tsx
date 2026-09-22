import { Card, Tag } from '@calcifer-design/ui';
import styles from '../styles/docs.module.css';

export interface OverviewProps {
  /** Whether a toast manager reached this app — from a host, or from the standalone entry. */
  hasHostToast: boolean;
}

const decisions = [
  {
    heading: 'Base UI supplies behaviour, never appearance',
    body: `Focus management, ARIA wiring, keyboard contracts and collision-aware positioning come from Base UI ${BASE_UI_VERSION}. Every pixel is this library: CSS Modules over design tokens, one shared popup skin for the whole overlay tier.`,
  },
  {
    heading: 'Tokens are the only source of colour, type and space',
    body: 'Stylelint rejects a raw value for any token-governed property, so a component cannot drift from the scale by accident. The tokens are exported as runtime values too, which is what lets this page compute its own contrast table.',
  },
  {
    heading: 'The host owns the theme, and the region a toast lands in',
    body: 'This page is a federated remote. It ships no theme stylesheet when the shell mounts it, and it never mounts a second toast region — it calls the manager the host passes through the Bridge props.',
  },
  {
    heading: 'Storybook keeps its job',
    body: 'The exhaustive per-component workbench, every variant, each story in its own isolated iframe, stays where it is. This page is curated: the decisions, the tokens, a few real compositions, and an inventory read from Storybook’s own build output.',
  },
] as const;

export function Overview({ hasHostToast }: OverviewProps) {
  return (
    <section className={styles.section} aria-labelledby="overview-heading">
      <h2 className={styles.sectionHeading} id="overview-heading">
        A design system with a front door
      </h2>
      <p className={styles.lede}>
        <code className={styles.code}>@calcifer-design/ui</code> is the library behind this
        portfolio, its showcase remote, the games and the potluck app. It is published to npm,
        versioned with Changesets, and consumed by every one of them — and until this page existed,
        a visitor could see them all and none of it.
      </p>
      <div className={styles.grid}>
        {decisions.map((decision) => (
          <Card key={decision.heading} heading={decision.heading} headingLevel={3}>
            <p>{decision.body}</p>
          </Card>
        ))}
      </div>
      <p className={styles.note} data-testid="toast-owner">
        Toast region:{' '}
        <Tag tone={hasHostToast ? 'accent' : 'neutral'}>
          {hasHostToast ? 'the host' : 'none supplied'}
        </Tag>{' '}
        — a remote never mounts its own. Run standalone, this page creates one manager and one
        region itself; when no host is listening, the toast examples below show their message inline
        instead of raising a notification nobody would see.
      </p>
    </section>
  );
}
