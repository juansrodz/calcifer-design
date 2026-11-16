import type { Meta, StoryObj } from '@storybook/react';
import { Collapsible } from './Collapsible';

const meta = {
  title: 'Primitives/Collapsible',
  component: Collapsible,
  args: {
    heading: 'Mains',
    headingLevel: 3,
    children: <p>Lasagna for six, and a roast chicken if the oven is free.</p>,
  },
  argTypes: {
    headingLevel: { control: 'radio', options: [2, 3, 4, 5, 6] },
    open: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed on arrival: the panel stays in the page, hidden, so what is inside keeps its state. */
export const Default: Story = {};

/** `defaultOpen`, for a screen that shows every group open on arrival. */
export const OpenOnArrival: Story = { args: { defaultOpen: true } };

const tintCircle = {
  display: 'inline-block',
  flex: 'none',
  inlineSize: '0.75rem',
  blockSize: '0.75rem',
  marginInlineEnd: 'var(--space-2)',
  borderRadius: 'var(--radius-full)',
  background: 'var(--color-accent)',
} as const;

/**
 * A tint circle ahead of the heading text (decorative, so it is hidden from assistive
 * technology), and a count after it. The trigger's name reads "Mains 2".
 */
export const WithAside: Story = {
  args: {
    heading: (
      <>
        <span style={tintCircle} aria-hidden="true" />
        Mains
      </>
    ),
    headingAside: <span>2</span>,
  },
};

/**
 * The caller owns the state: `open` is fixed here, so a click reports `onOpenChange(false)` and
 * the panel stays open until the caller changes the prop. Flip `open` in the controls.
 */
export const Controlled: Story = {
  args: { open: true },
};

/** A disabled trigger still takes focus and is announced as disabled, but it does not toggle. */
export const Disabled: Story = { args: { disabled: true } };

/**
 * A heading size the default does not draw: the one hook, `--collapsible-heading-size`, set from
 * a class on the root. The story writes its stylesheet inline; a consumer's lives in its own CSS.
 */
export const HeadingSize: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <style>{`.collapsible-heading-size { --collapsible-heading-size: var(--text-sm); }`}</style>
      <Collapsible heading="Sides" className="collapsible-heading-size" defaultOpen>
        <p>Bread, a green salad and the good olives.</p>
      </Collapsible>
    </>
  ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <Collapsible
        heading={
          <>
            <span style={tintCircle} aria-hidden="true" />
            Mains
          </>
        }
        headingAside={<span>2</span>}
        defaultOpen
      >
        <p>Lasagna for six, and a roast chicken if the oven is free.</p>
      </Collapsible>
      <Collapsible heading="Desserts" headingAside={<span>1</span>}>
        <p>Lemon tart.</p>
      </Collapsible>
      <Collapsible heading="Drinks" disabled>
        <p>Nothing yet.</p>
      </Collapsible>
    </div>
  ),
};
