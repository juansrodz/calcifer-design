import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Menu } from './Menu';

const meta = {
  title: 'Overlays/Menu',
  component: Menu,
  args: {
    trigger: <Button variant="secondary">Remote actions</Button>,
    items: [
      { id: 'reload', label: 'Reload manifest', onSelect: fn() },
      { id: 'open', label: 'Open standalone', onSelect: fn() },
      { id: 'remove', label: 'Remove from registry', onSelect: fn(), separatorBefore: true },
      { id: 'pin', label: 'Pin version', onSelect: fn(), disabled: true },
    ],
  },
  argTypes: {
    side: { control: 'radio', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'radio', options: ['start', 'center', 'end'] },
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AlignedToTheStart: Story = { args: { align: 'start' } };

/**
 * An open menu renders Base UI's focus guards beside the trigger: visually hidden spans that are
 * `aria-hidden` and `tabIndex={0}`, so Tab into or out of the portalled popup lands on a guard and
 * is redirected (Base UI's `utils/FocusGuard`). axe's `aria-hidden-focus` flags them, and the
 * menu's popup is `role="menu"`, so axe's pass for a page with a visible dialog never applies.
 * The two stories that show the menu open carry this exclusion: KeyboardOpen, which the
 * test-runner flags (it is checked after its play has opened the menu), and OpenOnLoad, which
 * passes in the test-runner but is flagged when its page is loaded on its own, as the Storybook
 * a11y panel does. Nothing in this library renders the guards, so the rule is excluded, as for
 * ToastRegion's close control; the closed stories keep it.
 */
const openMenuA11y = { a11y: { options: { rules: { 'aria-hidden-focus': { enabled: false } } } } };

export const OpenOnLoad: Story = { args: { defaultOpen: true }, parameters: openMenuA11y };

/** Opens with the keyboard and checks the first item takes focus, so arrow keys work at once. */
export const KeyboardOpen: Story = {
  parameters: openMenuA11y,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Remote actions' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    const firstItem = await screen.findByRole('menuitem', { name: 'Reload manifest' });
    // Base UI moves focus to the item after the popup mounts, a moment after it is in the DOM.
    await waitFor(() => expect(firstItem).toHaveFocus());
  },
};
