import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from './Button';

/**
 * The surface an inverse button is made for: a solid fill the button's own fill must read against.
 * The soft inverse fill is translucent, so it sits on `--color-inverse` (dark in light mode, light
 * in dark mode), which its ink was chosen against; the solid inverse fill sits on the accent.
 */
function Backdrop({ fill, children }: { fill: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-block',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        background: fill,
      }}
    >
      {children}
    </div>
  );
}

const onAccent = [
  (Story: () => ReactNode) => (
    <Backdrop fill="var(--color-accent)">
      <Story />
    </Backdrop>
  ),
];

const onInverse = [
  (Story: () => ReactNode) => (
    <Backdrop fill="var(--color-inverse)">
      <Story />
    </Backdrop>
  ),
];

/** A 16x16 stroke glyph in `currentColor`, sized to the button's text. */
function PlusIcon() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      style={{ verticalAlign: '-0.125em' }}
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Open projects', variant: 'primary', size: 'md' },
  argTypes: {
    variant: { control: 'radio', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'radio', options: ['md', 'sm', 'lg'] },
    tone: { control: 'radio', options: ['accent', 'inverse', 'selected'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Small: Story = { args: { size: 'sm' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true, children: 'Loading projects' } };

/** The high-contrast fill for a button on an accent or photo surface. */
export const Inverse: Story = { args: { tone: 'inverse' }, decorators: onAccent };
/** The translucent inverse fill; its ink was chosen against `--color-inverse`. */
export const InverseSecondary: Story = {
  args: { variant: 'secondary', tone: 'inverse' },
  decorators: onInverse,
};
/** The inverse primary dims its own fill and ink instead of the whole button. */
export const InverseDisabled: Story = {
  args: { tone: 'inverse', disabled: true },
  decorators: onAccent,
};
export const Selected: Story = { args: { tone: 'selected' } };
export const SelectedSecondary: Story = { args: { variant: 'secondary', tone: 'selected' } };
/** A count after the label; it is part of the accessible name ("Suggestions 2"). */
export const WithBadge: Story = {
  args: { variant: 'secondary', children: 'Suggestions', badge: <span>2</span> },
};
/** The large size, with a leading icon in the children. */
export const Large: Story = {
  args: {
    size: 'lg',
    tone: 'inverse',
    children: (
      <>
        <PlusIcon /> Add an event
      </>
    ),
  },
  decorators: onAccent,
};

/** Tabs to the button and checks it lands there with a visible focus ring. */
export const FocusVisible: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button')).toHaveFocus();
  },
};
