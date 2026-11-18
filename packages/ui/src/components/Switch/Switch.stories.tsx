import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, within } from 'storybook/test';
import { Switch } from './Switch';

const meta = {
  title: 'Forms/Switch',
  component: Switch,
  args: { label: 'Email me when someone joins', name: 'notify', onCheckedChange: fn() },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Described: Story = {
  args: { description: 'One message per event, never a digest.' },
};
export const Required: Story = { args: { required: true } };
export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };
export const WithError: Story = { args: { required: true, error: 'Turn this on to continue.' } };
/**
 * The two unchecked-track hooks, `--switch-track-unchecked-background` and
 * `--switch-track-unchecked-border-color`, set from a class on a wrapper (they inherit): here a solid
 * track with no edge of its own, as the WBW mock draws its switch (4e). The mock's lavender is the
 * app's to set; this story fills the track with the control colour instead, so it still holds 3:1
 * on every surface, as WCAG 1.4.11 asks and as a consumer's own colours must. Checked, the track is
 * the accent whatever the hooks say.
 */
export const UncheckedTrack: Story = {
  decorators: [
    (Story) => (
      <>
        <style>{`.switch-unchecked-track {
  --switch-track-unchecked-background: var(--color-border-control);
  --switch-track-unchecked-border-color: transparent;
}`}</style>
        <div className="switch-unchecked-track">
          <Story />
        </div>
      </>
    ),
  ],
  // Runs in a browser only (jsdom resolves no custom properties): the track reads both hooks.
  play: async ({ canvasElement }) => {
    const track = within(canvasElement).getByRole('switch', {
      name: 'Email me when someone joins',
    });
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-border-control)';
    canvasElement.append(probe);
    const controlColour = getComputedStyle(probe).color;
    probe.remove();
    await expect(getComputedStyle(track).backgroundColor).toBe(controlColour);
    await expect(getComputedStyle(track).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  },
};

export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultChecked: true } };
