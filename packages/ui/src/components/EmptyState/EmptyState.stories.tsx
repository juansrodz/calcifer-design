import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button/Button';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Primitives/EmptyState',
  component: EmptyState,
  args: {
    heading: 'No events yet',
    headingLevel: 2,
    children: 'When someone invites you, the event shows up here.',
  },
  argTypes: {
    headingLevel: { control: 'radio', options: [2, 3, 4] },
    tone: { control: 'radio', options: ['neutral', 'selected'] },
    align: { control: 'radio', options: ['center', 'start'] },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Plain by default: a raised card, the heading and a body sentence, centred. */
export const Default: Story = {};

/**
 * `bare` drops the card's surface and shadow, for a container that already frames the empty state:
 * here a panel of the same surface, where a raised card would read as a card in a card.
 */
export const Bare: Story = {
  args: { bare: true, actions: <Button variant="secondary">Clear filters</Button> },
  decorators: [
    (Story) => (
      <div
        style={{
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-card-border)',
          borderRadius: 'var(--radius-popup)',
          padding: 'var(--space-3)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

/** `actions` sit under the body, in a row that wraps. */
export const WithActions: Story = {
  args: { actions: <Button>Create an event</Button> },
};

// A decorative shape for `illustration`, drawn partly outside the box: the root is
// `position: relative`, so an absolutely positioned child is placed against it and may spill over
// the edge. The stories that use it pad the page above the card so the spill is not cut off.
const spillingIllustration = (
  <svg
    width="72"
    height="72"
    viewBox="0 0 72 72"
    aria-hidden="true"
    focusable="false"
    style={{ position: 'absolute', insetBlockStart: '-1.75rem', insetInlineEnd: '1.5rem' }}
  >
    <circle
      cx="36"
      cy="36"
      r="32"
      style={{
        fill: 'var(--color-surface-raised)',
        stroke: 'var(--color-selected)',
        strokeWidth: 4,
      }}
    />
    <path
      d="M24 38a12 12 0 0 0 24 0M28 28v2M44 28v2"
      fill="none"
      strokeWidth="4"
      strokeLinecap="round"
      style={{ stroke: 'var(--color-selected)' }}
    />
  </svg>
);

/**
 * The chosen look: `tone="selected"` paints the selected colour with its own text colour, and
 * `align="start"` sets everything against the start edge.
 */
export const Selected: Story = {
  args: {
    tone: 'selected',
    align: 'start',
    illustration: spillingIllustration,
    heading: 'Nothing to bring yet',
    children: 'Claim an item from an event and it will be listed here.',
    actions: <Button variant="secondary">Browse events</Button>,
  },
  decorators: [
    (Story) => (
      <div style={{ paddingBlockStart: 'var(--space-6)' }}>
        <Story />
      </div>
    ),
  ],
};

/** A heading alone, one level down: no body, no actions, and none of their boxes. */
export const HeadingLevel: Story = {
  args: { heading: 'No one else is going yet', headingLevel: 3, children: undefined },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-6)', paddingBlockStart: 'var(--space-6)' }}>
      <EmptyState heading="No events yet" actions={<Button>Create an event</Button>}>
        When someone invites you, the event shows up here.
      </EmptyState>
      <EmptyState
        tone="selected"
        align="start"
        illustration={spillingIllustration}
        heading="Nothing to bring yet"
        actions={<Button variant="secondary">Browse events</Button>}
      >
        Claim an item from an event and it will be listed here.
      </EmptyState>
    </div>
  ),
};
