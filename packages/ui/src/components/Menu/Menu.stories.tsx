import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import type { PaintCheck } from '../../../.storybook/paint-checks';
import { PortalInStoryRoot } from '../../../.storybook/PortalInStoryRoot';
import { Avatar } from '../Avatar/Avatar';
import { AvatarGroup } from '../AvatarGroup/AvatarGroup';
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

/**
 * A 16x16 stroke glyph in the text colour, as a consumer's icon set draws one; `tinted` colours it
 * with the accent through an inline style.
 */
function RefreshGlyph({ tinted = false }: { tinted?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      style={tinted ? { color: 'var(--color-accent)' } : undefined}
    >
      <path d="M13 8a5 5 0 1 1-1.5-3.5M13 2.5v3h-3" />
    </svg>
  );
}

/**
 * Items with a start icon: a consumer's glyph, one tinted with the accent through an inline style,
 * two avatars (initials on a seeded fill) and a disabled item with a glyph. The slot is
 * decorative, so each item is still named by its label. Under forced colours the item under the
 * pointer is filled `Highlight`, and everything in the slot (the tinted glyph, the avatar's fill and
 * initials) takes its `HighlightText` ink, so nothing on the fill is left in a token colour.
 *
 * The menu opens on load, before any press, so the browser treats the focus Base UI moves to an
 * item under the pointer as keyboard focus: that item shows its focus ring, not the fill. Close
 * and reopen it with the pointer to see the fill, or see `WithStartIconsHighlighted`.
 */
export const WithStartIcons: Story = {
  args: {
    defaultOpen: true,
    trigger: <Button variant="secondary">Who is bringing</Button>,
    items: [
      { id: 'reload', label: 'Reload the list', onSelect: fn(), startIcon: <RefreshGlyph /> },
      {
        id: 'tinted',
        label: 'Ask again',
        onSelect: fn(),
        startIcon: <RefreshGlyph tinted />,
      },
      {
        id: 'sebastian',
        label: 'Sebastian',
        onSelect: fn(),
        separatorBefore: true,
        startIcon: <Avatar name="Juan Sebastian Rodriguez" size="xs" colorSeed="sebastian" />,
      },
      {
        id: 'christian',
        label: 'Christian',
        onSelect: fn(),
        startIcon: <Avatar name="Christian Ocampo" size="xs" colorSeed="christian" />,
      },
      {
        id: 'nobody',
        label: 'Nobody yet',
        onSelect: fn(),
        disabled: true,
        startIcon: <RefreshGlyph />,
      },
    ],
  },
  parameters: openMenuA11y,
};

/**
 * Moves Base UI's highlight to an item by focusing it, then takes the focus away, as a pointer
 * leaves an item after the menu was opened with a press: the highlight stays, with no focus ring.
 */
async function highlightWithoutFocus(item: HTMLElement): Promise<void> {
  item.focus();
  await waitFor(() => expect(item).toHaveAttribute('data-highlighted'));
  item.blur();
  await waitFor(() => expect(item).not.toHaveFocus());
  await expect(item).toHaveAttribute('data-highlighted');
}

/**
 * `WithStartIcons` with "Ask again" highlighted and not focused, as a pointer leaves it after the
 * menu was opened with a press: the guarded fill shows, with no focus ring. The `play` moves Base
 * UI's highlight there by focusing the item, then takes the focus away; the highlight stays.
 *
 * The test runner checks the paint with the pointer away (`press`, which also holds `:active`;
 * nothing in the menu reads it). Under forced colours: the highlighted item is filled `Highlight`
 * with `HighlightText` ink, and its accent-tinted glyph takes that ink over its inline colour; the
 * disabled item's glyph is `GrayText` as its label is; the separator is drawn in `CanvasText`. Out of
 * forced colours, the disabled item's glyph takes its label's subtle colour.
 */
export const WithStartIconsHighlighted: Story = {
  ...WithStartIcons,
  decorators: [
    (Story) => (
      <PortalInStoryRoot>
        <Story />
      </PortalInStoryRoot>
    ),
  ],
  parameters: {
    ...openMenuA11y,
    paintChecks: [
      {
        target: '[role="menuitem"][data-highlighted]',
        interaction: 'press',
        forcedColors: true,
        expected: { backgroundColor: 'Highlight', color: 'HighlightText' },
      },
      {
        target: '[role="menuitem"][data-highlighted] svg',
        interaction: 'press',
        forcedColors: true,
        expected: { color: 'HighlightText' },
      },
      {
        target: '[role="menuitem"][data-disabled] svg',
        interaction: 'press',
        forcedColors: true,
        expected: { color: 'GrayText' },
      },
      {
        target: '[role="separator"]',
        interaction: 'press',
        forcedColors: true,
        expected: { backgroundColor: 'CanvasText' },
      },
      {
        target: '[role="menuitem"][data-disabled] svg',
        interaction: 'press',
        expected: { color: 'var(--color-text-subtle)' },
      },
    ] satisfies readonly PaintCheck[],
  },
  play: async () => {
    await highlightWithoutFocus(await screen.findByRole('menuitem', { name: 'Ask again' }));
  },
};

/** The avatars and the `+N` chip of the `AvatarGroup` in the highlighted item's start slot. */
const groupAvatars =
  '[role="menuitem"][data-highlighted] [role="list"] > li > [data-testid="avatar"]';
const groupChip = '[role="menuitem"][data-highlighted] [role="list"] > li > [aria-hidden="true"]';

/**
 * An item whose start slot holds an `AvatarGroup` (three avatars and a `+1` chip), highlighted and
 * not focused, as in `WithStartIconsHighlighted`. Under forced colours the hovered item's fill opts
 * out of the browser's colours, which brings back what the browser drops elsewhere: the group's ring
 * (a box shadow in a theme colour) and the chip's shadow. The content guard drops both, and draws
 * the avatars' and the chip's edges (a transparent outline the browser would paint) in the item's
 * `HighlightText`, as their edges are `CanvasText` at rest. The paint checks pin both.
 */
export const WithAvatarGroupHighlighted: Story = {
  args: {
    defaultOpen: true,
    trigger: <Button variant="secondary">Who is bringing</Button>,
    items: [
      { id: 'reload', label: 'Reload the list', onSelect: fn(), startIcon: <RefreshGlyph /> },
      {
        id: 'cooks',
        label: 'The cooks',
        onSelect: fn(),
        startIcon: (
          <AvatarGroup
            label="The cooks"
            size="xs"
            max={3}
            items={[
              { id: 'sebastian', name: 'Juan Sebastian Rodriguez', colorSeed: 'sebastian' },
              { id: 'christian', name: 'Christian Ocampo', colorSeed: 'christian' },
              { id: 'ada', name: 'Ada Lovelace', colorSeed: 'ada' },
              { id: 'grace', name: 'Grace Hopper', colorSeed: 'grace' },
            ]}
          />
        ),
      },
    ],
  },
  decorators: WithStartIconsHighlighted.decorators,
  parameters: {
    ...openMenuA11y,
    paintChecks: [groupAvatars, groupChip].map((target): PaintCheck => ({
      target,
      interaction: 'press',
      forcedColors: true,
      expected: { outlineColor: 'HighlightText', boxShadow: 'none' },
    })) satisfies readonly PaintCheck[],
  },
  play: async () => {
    await highlightWithoutFocus(await screen.findByRole('menuitem', { name: 'The cooks' }));
    await expect(document.querySelectorAll(groupAvatars)).toHaveLength(3);
    await expect(document.querySelectorAll(groupChip)).toHaveLength(1);
  },
};
