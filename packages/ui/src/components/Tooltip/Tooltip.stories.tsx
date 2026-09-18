import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Tooltip } from './Tooltip';
import { TooltipProvider } from './TooltipProvider';

/** A 16x16 stroke glyph, sized by the button's own stylesheet. */
function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13.25 8a5.25 5.25 0 1 1-1.6-3.78" />
      <path d="M13.25 2.75v3.5h-3.5" />
    </svg>
  );
}

const meta = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  args: {
    trigger: (
      <Button variant="ghost">
        <RefreshIcon />
      </Button>
    ),
    label: 'Reload the registry',
  },
  argTypes: {
    side: { control: 'radio', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'radio', options: ['start', 'center', 'end'] },
  },
  // Every consumer mounts one of these, host and remote alike: it renders no DOM and attaches
  // no listeners, so nesting is free, and it is what makes adjacent tooltips open instantly.
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Instant: Story = { args: { delay: 0 } };
export const Below: Story = { args: { side: 'bottom', delay: 0 } };

/** Hovers the trigger and checks the tip appears with the same words as its accessible name. */
export const HoverOpens: Story = {
  args: { delay: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole('button', { name: 'Reload the registry' }));
    await expect(await screen.findByText('Reload the registry')).toBeInTheDocument();
  },
};
